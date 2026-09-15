import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Plus, Search, Sprout } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { checkAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/fertilizers")({
  head: () => ({
    meta: [
      { title: "Fertiliser guide — KisanSahayak" },
      {
        name: "description",
        content:
          "Browse fertilisers for your crop: nutrients, dosage per acre, when to apply, approximate price and what problem each one solves.",
      },
      { property: "og:title", content: "Fertiliser guide — KisanSahayak" },
      {
        property: "og:description",
        content: "Which fertiliser to use for your crop, how much and when.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FertilizersPage,
});

type Fertilizer = {
  id: string;
  name: string;
  kind: string;
  nutrients: string | null;
  crops: string[];
  problems: string[];
  dosage: string | null;
  timing: string | null;
  price_range: string | null;
  notes: string | null;
};

const KINDS = ["chemical", "organic", "bio", "micronutrient"];

function FertilizersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const isAdminFn = useServerFn(checkAdmin);

  const { data: adminData } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: () => isAdminFn(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["fertilizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fertilizers")
        .select("id, name, kind, nutrients, crops, problems, dosage, timing, price_range, notes")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Fertilizer[];
    },
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((f) =>
      [f.name, f.kind, f.nutrients ?? "", ...f.crops, ...f.problems]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-semibold text-soil">{t("fertTitle")}</h1>
      <p className="mt-1 text-[15px] font-medium text-soil-500">{t("fertSubtitle")}</p>

      <label className="mt-5 flex items-center gap-2 rounded-2xl bg-cream-2 px-4 py-3 ring-1 ring-black/10">
        <Search className="size-5 shrink-0 text-soil-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchFert")}
          className="w-full bg-transparent text-base font-medium text-soil outline-none placeholder:text-soil-500"
        />
      </label>

      {adminData?.isAdmin ? (
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf py-3.5 text-base font-semibold text-cream"
        >
          <Plus className="size-5" />
          {t("addFert")}
        </button>
      ) : null}

      {adminData?.isAdmin && showForm ? <AddFertilizerForm onDone={() => setShowForm(false)} /> : null}

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-leaf-700" />
        </div>
      ) : (
        <section className="mt-5 space-y-2.5">
          {list.map((f) => (
            <article key={f.id} className="rounded-2xl bg-cream-2 p-4 ring-1 ring-black/5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf/15">
                  <Sprout className="size-5 text-leaf-700" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold text-soil">{f.name}</h2>
                  <p className="text-sm font-medium text-soil-500">
                    {f.kind}
                    {f.nutrients ? ` · ${f.nutrients}` : ""}
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm font-medium text-soil-700">
                {f.dosage ? <Row label={t("dosage")} value={f.dosage} /> : null}
                {f.timing ? <Row label={t("timing")} value={f.timing} /> : null}
                {f.crops.length ? <Row label={t("goodFor")} value={f.crops.join(", ")} /> : null}
                {f.problems.length ? <Row label={t("helpsWith")} value={f.problems.join(", ")} /> : null}
                {f.price_range ? <Row label={t("price")} value={f.price_range} /> : null}
              </dl>
              {f.notes ? <p className="mt-2 text-sm font-medium text-soil-500">{f.notes}</p> : null}
            </article>
          ))}
          {!list.length ? (
            <p className="rounded-2xl bg-cream-2 p-4 text-[15px] font-medium text-soil-500 ring-1 ring-black/5">
              {t("noFert")}
            </p>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-soil-500">{label}:</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}

function AddFertilizerForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "chemical",
    nutrients: "",
    crops: "",
    problems: "",
    dosage: "",
    timing: "",
    price_range: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("fertilizers").insert({
      name: form.name.trim(),
      kind: form.kind,
      nutrients: form.nutrients.trim() || null,
      crops: form.crops.split(",").map((s) => s.trim()).filter(Boolean),
      problems: form.problems.split(",").map((s) => s.trim()).filter(Boolean),
      dosage: form.dosage.trim() || null,
      timing: form.timing.trim() || null,
      price_range: form.price_range.trim() || null,
      notes: form.notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("fertAdded"));
    await qc.invalidateQueries({ queryKey: ["fertilizers"] });
    onDone();
  };

  const field =
    "w-full rounded-xl bg-cream px-4 py-3 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf";

  return (
    <form onSubmit={submit} className="mt-3 space-y-2.5 rounded-2xl bg-cream-2 p-4 ring-1 ring-black/10">
      <input className={field} placeholder="Name (e.g. Urea)" value={form.name} onChange={set("name")} required />
      <select className={field} value={form.kind} onChange={set("kind")}>
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <input className={field} placeholder="Nutrients (e.g. N 46%)" value={form.nutrients} onChange={set("nutrients")} />
      <input className={field} placeholder="Crops, comma separated" value={form.crops} onChange={set("crops")} />
      <input className={field} placeholder="Problems it solves, comma separated" value={form.problems} onChange={set("problems")} />
      <input className={field} placeholder="How much per acre" value={form.dosage} onChange={set("dosage")} />
      <input className={field} placeholder="When to apply" value={form.timing} onChange={set("timing")} />
      <input className={field} placeholder="Approx price" value={form.price_range} onChange={set("price_range")} />
      <input className={field} placeholder="Notes" value={form.notes} onChange={set("notes")} />
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-3.5 text-base font-semibold text-cream disabled:opacity-70"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        {t("addFert")}
      </button>
    </form>
  );
}
