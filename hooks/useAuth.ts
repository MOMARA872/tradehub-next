"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbProfileToUser } from "@/lib/types";
import type { User } from "@/lib/types";

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  loading: boolean;
}

/**
 * Hook to get the current Supabase user and their profile.
 * Replaces the old mock useAuthStore.
 */
export function useAuth(): AuthState {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        if (profile) {
          setCurrentUser(dbProfileToUser(profile));
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;

        if (profile) {
          setCurrentUser(dbProfileToUser(profile));
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    currentUser,
    isLoggedIn: !!currentUser,
    loading,
  };
}
