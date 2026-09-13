import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminFarmer = {
  id: string;
  email: string | null;
  fullName: string | null;
  village: string | null;
  language: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  scanCount: number;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Not an admin account");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(data) };
  });

export const listFarmers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ farmers: AdminFarmer[]; totalScans: number }> => {
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: users }, { data: profiles }, { data: scans }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("profiles").select("id, full_name, village, language, created_at"),
      supabaseAdmin.from("scans").select("user_id"),
    ]);

    const scanCounts = new Map<string, number>();
    for (const s of scans ?? []) {
      scanCounts.set(s.user_id, (scanCounts.get(s.user_id) ?? 0) + 1);
    }
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const farmers: AdminFarmer[] = (users?.users ?? []).map((u) => {
      const p = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        fullName:
          p?.full_name ?? ((u.user_metadata?.["full_name"] as string | undefined) ?? null),
        village: p?.village ?? null,
        language: p?.language ?? "en",
        createdAt: u.created_at ?? p?.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        scanCount: scanCounts.get(u.id) ?? 0,
      };
    });

    farmers.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

    return { farmers, totalScans: scans?.length ?? 0 };
  });
