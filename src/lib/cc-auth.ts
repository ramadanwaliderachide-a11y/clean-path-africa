import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CCUser = { id: string; name: string; email: string; phone?: string; isAdmin: boolean };

async function loadUser(): Promise<CCUser | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", u.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", u.id),
  ]);
  return {
    id: u.id,
    email: u.email ?? "",
    name: profile?.full_name || (u.user_metadata?.full_name as string) || u.email || "Utilizador",
    phone: profile?.phone ?? undefined,
    isAdmin: !!roles?.some((r) => r.role === "admin"),
  };
}

/** Returns undefined while loading, null when signed out. */
export function useAuth() {
  const [user, setUser] = useState<CCUser | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const refresh = () => loadUser().then((u) => alive && setUser(u));
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") refresh();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return user;
}

export function useUser() {
  return useAuth() ?? null;
}

export async function logout() {
  await supabase.auth.signOut();
}
