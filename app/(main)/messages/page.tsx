"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { dbThreadToThread, dbMessageToMessage, dbProfileToUser } from "@/lib/types";
import type { User, Thread, Message } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { timeAgo } from "@/lib/helpers/format";
import { EmptyState } from "@/components/common/EmptyState";
import { Send, Search, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

function MessagesInner() {
  const { currentUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, User>>(new Map());
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadsRef = useRef<Thread[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  // Load threads on mount
  const loadThreads = useCallback(async () => {
    if (!currentUser) return;
    setLoadingThreads(true);

    const { data: rows, error } = await supabase
      .from("threads")
      .select("*")
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      setLoadingThreads(false);
      return;
    }

    const threadList = (rows ?? []).map(dbThreadToThread);
    setThreads(threadList);

    // Batch-fetch profiles for all participants
    const otherIds = new Set<string>();
    for (const t of threadList) {
      if (t.buyerId !== currentUser.id) otherIds.add(t.buyerId);
      if (t.sellerId !== currentUser.id) otherIds.add(t.sellerId);
    }

    if (otherIds.size > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("*")
        .in("id", [...otherIds]);

      if (profileRows) {
        const map = new Map<string, User>();
        for (const p of profileRows) {
          const user = dbProfileToUser(p);
          map.set(user.id, user);
        }
        setProfiles(map);
      }
    }

    setLoadingThreads(false);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (currentUser) loadThreads();
  }, [currentUser, loadThreads]);

  // Auto-select thread from URL param
  useEffect(() => {
    const threadParam = searchParams.get("thread");
    if (threadParam && threads.length > 0) {
      const exists = threads.find((t) => t.id === threadParam);
      if (exists) {
        setSelectedThreadId(threadParam);
      }
    }
  }, [searchParams, threads]);

  // Load messages when thread is selected
  const loadMessages = useCallback(
    async (threadId: string) => {
      if (!currentUser) return;
      setLoadingMessages(true);

      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("sent_at", { ascending: true });

      setMessages((rows ?? []).map(dbMessageToMessage));
      setLoadingMessages(false);

      // Mark received messages as read
      const unreadIds = (rows ?? [])
        .filter((m: { is_read: boolean; sender_id: string }) => !m.is_read && m.sender_id !== currentUser.id)
        .map((m: { id: string }) => m.id);
      if (unreadIds.length > 0) {
        supabase.from("messages").update({ is_read: true }).in("id", unreadIds).then();
      }

      // Reset unread counter for current user
      const thread = threadsRef.current.find((t) => t.id === threadId);
      if (thread) {
        const isBuyer = currentUser.id === thread.buyerId;
        const unreadCol = isBuyer ? "buyer_unread" : "seller_unread";
        await supabase
          .from("threads")
          .update({ [unreadCol]: 0 })
          .eq("id", threadId);

        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? { ...t, [isBuyer ? "buyerUnread" : "sellerUnread"]: 0 }
              : t
          )
        );
      }
    },
    [currentUser, supabase]
  );

  useEffect(() => {
    if (selectedThreadId) loadMessages(selectedThreadId);
  }, [selectedThreadId, loadMessages]);

  // Poll for new messages every 3 seconds when a thread is selected
  useEffect(() => {
    if (!selectedThreadId || !currentUser) return;

    const interval = setInterval(async () => {
      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", selectedThreadId)
        .order("sent_at", { ascending: true });

      if (rows) {
        // Mark any new incoming messages as read
        const unreadIds = rows
          .filter((m: { is_read: boolean; sender_id: string }) => !m.is_read && m.sender_id !== currentUser.id)
          .map((m: { id: string }) => m.id);
        if (unreadIds.length > 0) {
          supabase.from("messages").update({ is_read: true }).in("id", unreadIds).then();
        }

        setMessages((prev) => {
          const newMessages = rows.map(dbMessageToMessage);
          // Update if message count changed, last message changed, or read status changed
          if (newMessages.length !== prev.length) return newMessages;
          const lastNew = newMessages[newMessages.length - 1];
          const lastOld = prev[prev.length - 1];
          if (lastNew && lastOld && lastNew.id !== lastOld.id) return newMessages;
          // Check if any read status changed (for sent messages marked as read by recipient)
          const readChanged = newMessages.some(
            (m, i) => prev[i] && m.isRead !== prev[i].isRead
          );
          if (readChanged) return newMessages;
          return prev;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedThreadId, currentUser, supabase]);

  // Poll for thread updates every 5 seconds (new threads, unread counts, last message)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      const { data: rows } = await supabase
        .from("threads")
        .select("*")
        .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
        .order("last_message_at", { ascending: false });

      if (rows) {
        const updatedThreads = rows.map(dbThreadToThread);
        setThreads((prev) => {
          // Only update if something changed
          if (JSON.stringify(prev) === JSON.stringify(updatedThreads)) return prev;
          return updatedThreads;
        });

        // Fetch any new participant profiles we don't have yet
        const missingIds = new Set<string>();
        for (const t of updatedThreads) {
          const otherId = t.buyerId === currentUser.id ? t.sellerId : t.buyerId;
          if (!profiles.has(otherId)) missingIds.add(otherId);
        }
        if (missingIds.size > 0) {
          const { data: profileRows } = await supabase
            .from("profiles")
            .select("*")
            .in("id", [...missingIds]);
          if (profileRows) {
            setProfiles((prev) => {
              const next = new Map(prev);
              for (const p of profileRows) {
                const u = dbProfileToUser(p);
                next.set(u.id, u);
              }
              return next;
            });
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, supabase, profiles]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getOtherParticipant(thread: Thread): User | null {
    if (!currentUser) return null;
    const otherId =
      currentUser.id === thread.buyerId ? thread.sellerId : thread.buyerId;
    return profiles.get(otherId) ?? null;
  }

  function getUnreadCount(thread: Thread): number {
    if (!currentUser) return 0;
    return currentUser.id === thread.buyerId
      ? thread.buyerUnread
      : thread.sellerUnread;
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedThreadId || !currentUser || sending)
      return;
    setSending(true);
    const body = newMessage.trim();
    setNewMessage("");

    const thread = threads.find((t) => t.id === selectedThreadId);
    if (!thread) {
      setSending(false);
      return;
    }

    const isBuyer = currentUser.id === thread.buyerId;
    const otherUnreadKey = isBuyer ? "seller_unread" : "buyer_unread";

    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        thread_id: selectedThreadId,
        sender_id: currentUser.id,
        body,
      })
      .select()
      .single();

    if (error || !msg) {
      toast.error("Failed to send message");
      setNewMessage(body); // restore the message
      setSending(false);
      return;
    }

    // Update thread metadata
    await supabase
      .from("threads")
      .update({
        last_message: body,
        last_message_at: msg.sent_at,
        [otherUnreadKey]:
          (isBuyer ? thread.sellerUnread : thread.buyerUnread) + 1,
      })
      .eq("id", selectedThreadId);

    // Update local state
    setMessages((prev) => [...prev, dbMessageToMessage(msg)]);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedThreadId
          ? { ...t, lastMessage: body, lastMessageAt: msg.sent_at }
          : t
      )
    );
    setSending(false);
  }

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <EmptyState message="Please log in to view messages" icon="Lock" />
      </div>
    );
  }

  const filteredThreads = searchQuery
    ? threads.filter(
        (t) =>
          t.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-6">
        Messages
      </h1>

      <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden h-[calc(100vh-220px)] min-h-[500px] flex">
        {/* Thread List */}
        <div
          className={`w-full md:w-80 md:min-w-[320px] border-r border-border flex flex-col ${
            selectedThreadId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-surface2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Thread Items */}
          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="py-12">
                <EmptyState message="No conversations yet" icon="MessageSquare" />
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const other = getOtherParticipant(thread);
                const isActive = selectedThreadId === thread.id;
                const unread = getUnreadCount(thread);

                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-surface2 ${
                      isActive ? "bg-surface2" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar user={other} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {other?.displayName || "Unknown"}
                          </p>
                          <span className="text-[10px] text-subtle whitespace-nowrap">
                            {timeAgo(thread.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand font-medium truncate mt-0.5">
                          {thread.listingTitle}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted truncate">
                            {thread.lastMessage}
                          </p>
                          {unread > 0 && (
                            <span className="shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-brand text-white text-[10px] font-semibold">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col ${
            selectedThreadId ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setSelectedThreadId(null)}
                  className="md:hidden text-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <UserAvatar
                  user={getOtherParticipant(selectedThread)}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getOtherParticipant(selectedThread)?.displayName ||
                      "Unknown"}
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    {selectedThread.listingTitle}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted">
                      No messages yet. Send the first one!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser.id;
                    const sender = isOwn
                      ? null
                      : profiles.get(msg.senderId) ?? null;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[75%] ${isOwn ? "flex-row-reverse" : ""}`}
                        >
                          {!isOwn && (
                            <UserAvatar user={sender} size="sm" />
                          )}
                          <div>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isOwn
                                  ? "bg-brand text-white rounded-br-md"
                                  : "bg-surface2 text-foreground rounded-bl-md"
                              }`}
                            >
                              {msg.body}
                            </div>
                            <p
                              className={`text-[10px] text-subtle mt-1 ${
                                isOwn ? "text-right" : "text-left"
                              }`}
                            >
                              {timeAgo(msg.sentAt)}
                              {isOwn && msg.isRead && (
                                <span className="ml-1.5 text-success">Read</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                message="Select a conversation to start messaging"
                icon="MessageSquare"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
        </div>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
