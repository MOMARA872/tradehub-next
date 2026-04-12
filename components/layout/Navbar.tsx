"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRegionStore } from "@/store/regionStore";
import { REGIONS } from "@/lib/data/regions";
import {
  Search,
  Bell,
  MapPin,
  Menu,
  X,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Star,
  Scale,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/hooks/useI18n";
import { UserAvatar } from "@/components/user/UserAvatar";
import { dbNotificationToNotification } from "@/lib/types";
import type { Notification } from "@/lib/types";
import { timeAgo } from "@/lib/helpers/format";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const { selectedRegion, setRegion } = useRegionStore();
  const { t } = useI18n();

  const publicPages = [
    { id: "/", label: t("nav.home"), href: "/" },
    { id: "/browse", label: t("nav.browse"), href: "/browse" },
    { id: "/map-view", label: t("nav.map"), href: "/map-view" },
    { id: "/community", label: t("nav.community"), href: "/community" },
  ];

  const userPages = [
    { id: "/dashboard", label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { id: "/messages", label: t("nav.messages"), href: "/messages", icon: MessageSquare },
    { id: "/analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "/reviews", label: "Blind Reviews", href: "/reviews", icon: Star },
    { id: "/disputes", label: "Disputes", href: "/disputes", icon: Scale },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Supabase auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch notifications + poll every 5 seconds
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    async function fetchNotifications() {
      const { data: rows } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (rows) {
        const notifList = rows.map(dbNotificationToNotification);
        setNotifications(notifList);
        setUnreadCount(notifList.filter((n) => !n.read).length);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }

  return (
    <nav className="sticky top-0 z-[200] backdrop-blur-md border-b" style={{ backgroundColor: "var(--navbar-bg)", borderColor: "var(--border-color)" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <span className="text-lg">🔄</span>
          <span className="font-heading font-extrabold text-lg text-foreground">TradeHub</span>
        </Link>

        {/* Region Selector */}
        <div className="relative hidden sm:block" ref={regionRef}>
          <button
            onClick={() => setRegionOpen(!regionOpen)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="max-w-[100px] truncate">{selectedRegion.name}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {regionOpen && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px] z-50 animate-fade-in">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRegion(r.id); setRegionOpen(false); }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-surface3 transition-colors ${selectedRegion.id === r.id ? "text-brand font-semibold" : "text-foreground"}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav Links (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {publicPages.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                pathname === p.id
                  ? "text-brand font-semibold bg-brand/10"
                  : "text-muted hover:text-foreground hover:bg-surface2"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-xs">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings..."
              className="w-full bg-surface2 border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground">
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Post Button */}
        <Link
          href="/post-new"
          className="hidden sm:flex items-center gap-1 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Post
        </Link>

        {/* Notification + Auth */}
        <div className="flex items-center gap-2">
          {!!user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative text-muted hover:text-foreground transition-colors"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-brand text-white text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg w-80 max-h-[400px] z-50 animate-fade-in overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-brand hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-xs text-muted">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link}
                          onClick={() => {
                            setNotifOpen(false);
                            if (!n.read) {
                              supabase.from("notifications").update({ read: true }).eq("id", n.id).then();
                              setNotifications((prev) =>
                                prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                              );
                              setUnreadCount((prev) => Math.max(0, prev - 1));
                            }
                          }}
                          className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-border transition-colors hover:bg-surface2 ${
                            !n.read ? "bg-brand/5" : ""
                          }`}
                        >
                          <span className="text-base mt-0.5 shrink-0">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${!n.read ? "text-foreground font-medium" : "text-muted"}`}>
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-[10px] text-subtle mt-0.5 truncate">{n.body}</p>
                            )}
                            <p className="text-[10px] text-subtle mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-brand shrink-0 mt-1.5" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!!user && profile ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hover:opacity-90 transition-opacity"
              >
                <UserAvatar user={{ id: profile.id, displayName: profile.display_name, avatarInitials: profile.avatar_initials, profileImage: profile.profile_image }} size="sm" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={{ id: profile.id, displayName: profile.display_name, avatarInitials: profile.avatar_initials, profileImage: profile.profile_image }} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{profile.display_name}</p>
                        <p className="text-xs text-subtle">{profile.city}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/profile/${profile.id}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-surface2 transition-colors"
                  >
                    <User className="h-4 w-4" /> My Profile
                  </Link>
                  <div className="border-t border-border my-0.5" />
                  {userPages.map((p) => (
                    <Link
                      key={p.id}
                      href={p.href}
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface2 transition-colors ${pathname === p.id ? "text-brand font-medium" : "text-foreground"}`}
                    >
                      <p.icon className="h-4 w-4" /> {p.label}
                    </Link>
                  ))}
                  <div className="border-t border-border my-0.5" />
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-surface2 transition-colors"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-danger hover:bg-surface2 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-muted hover:text-foreground transition-colors">
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                {t("nav.signup")}
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="md:hidden text-foreground"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-surface border-border w-72">
              <div className="flex flex-col gap-1 mt-6">
                {publicPages.map((p) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      pathname === p.id ? "text-brand font-semibold bg-brand/10" : "text-foreground"
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
                <div className="border-t border-border my-2" />
                {!!user && userPages.map((p) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground"
                  >
                    <p.icon className="h-4 w-4" /> {p.label}
                  </Link>
                ))}
                <div className="border-t border-border my-2" />
                {/* Region Selector Mobile */}
                <div className="px-3">
                  <p className="text-xs text-subtle mb-1">Region</p>
                  {REGIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setRegion(r.id); setMobileOpen(false); }}
                      className={`block w-full text-left px-2 py-1 text-sm rounded ${selectedRegion.id === r.id ? "text-brand font-medium" : "text-foreground"}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
