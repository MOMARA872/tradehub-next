"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { timeAgo } from "@/lib/helpers/format";
import { EmptyState } from "@/components/common/EmptyState";
import { Send, Search, ArrowLeft } from "lucide-react";

const THREADS = [
  {
    id: "thread001",
    participants: ["user001", "user002"],
    listingTitle: "Handmade Ceramic Vase",
    lastMessage: "Great! When can you pick it up?",
    lastMessageAt: "2024-03-24T14:30:00Z",
    unreadCount: 0,
    messages: [
      { senderId: "user002", body: "Hi! I love your ceramic vase. Is it still available?", sentAt: "2024-03-24T10:15:00Z" },
      { senderId: "user001", body: "Yes! Still available. Just posted last week.", sentAt: "2024-03-24T10:45:00Z" },
      { senderId: "user002", body: "Could you do $40 instead of $45?", sentAt: "2024-03-24T11:20:00Z" },
      { senderId: "user001", body: "Sure, $40 works! When works for you?", sentAt: "2024-03-24T13:00:00Z" },
      { senderId: "user002", body: "Great! When can you pick it up?", sentAt: "2024-03-24T14:30:00Z" },
    ],
  },
  {
    id: "thread002",
    participants: ["user002", "user006"],
    listingTitle: "Web Design Skills Trade",
    lastMessage: "Awesome! Let's meet tomorrow to discuss details.",
    lastMessageAt: "2024-03-23T16:45:00Z",
    unreadCount: 1,
    messages: [
      { senderId: "user006", body: "I saw your web design skills listing. I need a website!", sentAt: "2024-03-23T14:10:00Z" },
      { senderId: "user002", body: "Awesome! What kind of website are you thinking?", sentAt: "2024-03-23T14:35:00Z" },
      { senderId: "user006", body: "I teach guitar and need a simple site for students.", sentAt: "2024-03-23T15:00:00Z" },
      { senderId: "user002", body: "Perfect match! I've been wanting lessons.", sentAt: "2024-03-23T15:20:00Z" },
      { senderId: "user006", body: "Awesome! Let's meet tomorrow to discuss details.", sentAt: "2024-03-23T16:45:00Z" },
    ],
  },
];

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = THREADS.find((t) => t.id === selectedThreadId);

  // Filter threads the current user participates in
  const userThreads = THREADS.filter((t) =>
    currentUser ? t.participants.includes(currentUser.id) : false
  );

  const filteredThreads = searchQuery
    ? userThreads.filter(
        (t) =>
          t.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : userThreads;

  // Scroll to bottom when thread changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId]);

  function getOtherParticipant(_thread: (typeof THREADS)[0]): User | null {
    return null;
  }

  function handleSend() {
    if (!newMessage.trim()) return;
    // In a real app this would send to the backend
    setNewMessage("");
  }

  if (!currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <EmptyState message="Please log in to view messages" icon="🔒" />
      </div>
    );
  }

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
            {filteredThreads.length === 0 ? (
              <div className="py-12">
                <EmptyState message="No conversations yet" icon="💬" />
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const other = getOtherParticipant(thread);
                const isActive = selectedThreadId === thread.id;

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
                          {thread.unreadCount > 0 && (
                            <span className="shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-brand text-white text-[10px] font-semibold">
                              {thread.unreadCount}
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
                <UserAvatar user={getOtherParticipant(selectedThread)} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getOtherParticipant(selectedThread)?.displayName || "Unknown"}
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    {selectedThread.listingTitle}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedThread.messages.map((msg, idx) => {
                  const isOwn = msg.senderId === currentUser.id;
                  const sender = null as (User | null);

                  return (
                    <div
                      key={idx}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? "flex-row-reverse" : ""}`}>
                        {!isOwn && (
                          <UserAvatar user={sender || null} size="sm" />
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
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    disabled={!newMessage.trim()}
                    className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-brand text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState message="Select a conversation to start messaging" icon="💬" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
