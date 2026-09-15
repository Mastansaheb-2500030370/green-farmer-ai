import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { listFarmers } from "@/lib/admin.functions";
import { FertilizerForm } from "@/components/FertilizerForm";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — KisanSahayak" },
      {
        name: "description",
        content: "Private admin console to view registered farmers and their activity on KisanSahayak.",
      },
      { property: "og:title", content: "Admin console — KisanSahayak" },
      { property: "og:description", content: "Private admin console for registered farmer accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-soil">
        <Loader2 className="size-6 animate-spin text-cream" />
      </div>
    );
  }

  return user ? <AdminDashboard /> : <AdminLogin />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setBusy(false);
  };

  const field =
    "w-full rounded-xl bg-cream px-4 py-3 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf";

  return (
    <div className="grid min-h-screen place-items-center bg-soil px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-cream-2 p-6 ring-1 ring-black/10">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-leaf text-cream">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-soil">Admin console</h1>
            <p className="text-sm font-medium text-soil-500">Staff access only</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            className={field}
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={field}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-3.5 text-base font-semibold text-cream disabled:opacity-70"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : null}
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const fetchFarmers = useServerFn(listFarmers);
  const [tab, setTab] = useState<"farmers" | "fertilizers">("farmers");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-farmers"],
    queryFn: () => fetchFarmers(),
    retry: false,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-soil px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-leaf text-cream">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-cream">Admin console</h1>
              <p className="text-sm font-medium text-cream/60">Farmers and fertiliser database</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl bg-cream-2 px-4 py-2.5 text-sm font-semibold text-soil"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </header>

        <nav className="mb-5 flex gap-2">
          {(["farmers", "fertilizers"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${
                tab === key ? "bg-sun text-soil" : "bg-cream-2/20 text-cream"
              }`}
            >
              {key === "farmers" ? "Farmers" : "Fertilisers"}
            </button>
          ))}
        </nav>

        {tab === "fertilizers" ? (
          <FertilizerAdmin />
        ) : isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-6 animate-spin text-cream" />
          </div>
        ) : error ? (
          <p className="rounded-2xl bg-cream-2 p-5 text-base font-medium text-soil">
            This account is not an admin. Sign in with an admin account.
          </p>
        ) : (

          <>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Farmers" value={data?.farmers.length ?? 0} />
              <Stat label="Total scans" value={data?.totalScans ?? 0} />
              <Stat
                label="New this week"
                value={
                  data?.farmers.filter(
                    (f) =>
                      f.createdAt &&
                      Date.now() - new Date(f.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
                  ).length ?? 0
                }
              />
            </div>

            <div className="overflow-x-auto rounded-2xl bg-cream-2 ring-1 ring-black/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-cream text-soil-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Village</th>
                    <th className="px-4 py-3 font-semibold">Language</th>
                    <th className="px-4 py-3 font-semibold">Scans</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.farmers ?? []).map((f) => (
                    <tr key={f.id} className="border-t border-black/5 text-soil">
                      <td className="px-4 py-3 font-semibold">{f.fullName ?? "—"}</td>
                      <td className="px-4 py-3">{f.email ?? "—"}</td>
                      <td className="px-4 py-3">{f.village ?? "—"}</td>
                      <td className="px-4 py-3 uppercase">{f.language}</td>
                      <td className="px-4 py-3">{f.scanCount}</td>
                      <td className="px-4 py-3">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {data && data.farmers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-medium text-soil-500">
                        No farmers have registered yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FertilizerAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-fertilizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fertilizers")
        .select("id, name, kind, nutrients, crops, dosage, is_active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const toggle = async (id: string, next: boolean) => {
    const { error } = await supabase.from("fertilizers").update({ is_active: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["admin-fertilizers"] });
    await qc.invalidateQueries({ queryKey: ["fertilizers"] });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-cream">Add a fertiliser</h2>
        <FertilizerForm />
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-cream">
          Fertiliser database ({data?.length ?? 0})
        </h2>
        {isLoading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="size-6 animate-spin text-cream" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-cream-2 ring-1 ring-black/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream text-soil-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Nutrients</th>
                  <th className="px-4 py-3 font-semibold">Crops</th>
                  <th className="px-4 py-3 font-semibold">Dose</th>
                  <th className="px-4 py-3 font-semibold">Shown</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((f) => (
                  <tr key={f.id} className="border-t border-black/5 text-soil">
                    <td className="px-4 py-3 font-semibold">{f.name}</td>
                    <td className="px-4 py-3 capitalize">{f.kind}</td>
                    <td className="px-4 py-3">{f.nutrients ?? "—"}</td>
                    <td className="px-4 py-3">{f.crops.join(", ") || "—"}</td>
                    <td className="px-4 py-3">{f.dosage ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(f.id, !f.is_active)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          f.is_active ? "bg-leaf text-cream" : "bg-cream text-soil-500 ring-1 ring-black/10"
                        }`}
                      >
                        {f.is_active ? "Visible" : "Hidden"}
                      </button>
                    </td>
                  </tr>
                ))}
                {data && data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-medium text-soil-500">
                      No fertilisers yet. Add the first one above.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-cream-2 p-4 ring-1 ring-black/10">
      <p className="text-sm font-medium text-soil-500">{label}</p>
      <p className="font-display text-3xl font-semibold text-soil">{value}</p>
    </div>
  );
}
