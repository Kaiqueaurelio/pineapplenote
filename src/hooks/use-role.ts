import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;

/**
 * Lê o papel do usuário a partir da tabela dedicada `user_roles`.
 * A verificação real de permissão acontece no banco, via RLS + has_role().
 */
export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!active) return;
        const roles = (data ?? []).map((item) => item.role);
        setRole(roles.includes("admin") ? "admin" : roles.length ? "student" : null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { role, isAdmin: role === "admin", loading };
}
