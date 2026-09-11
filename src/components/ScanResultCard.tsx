import { Phone, Volume2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { speakText } from "@/lib/ai.functions";
import { playBase64Mp3 } from "@/lib/media";
import { useI18n } from "@/lib/i18n";

export type ScanView = {
  imageUrl?: string | null;
  crop?: string | null;
  disease: string;
  severityLabel: string;
  severityScore: number;
  summary?: string | null;
  steps: string[];
  when?: string;
};

export function ScanResultCard({ scan }: { scan: ScanView }) {
  const { t, lang } = useI18n();
  const speak = useServerFn(speakText);
  const [speaking, setSpeaking] = useState(false);

  const readAloud = async () => {
    setSpeaking(true);
    try {
      const text = [scan.disease, scan.summary, ...scan.steps].filter(Boolean).join(". ");
      const { audioBase64 } = await speak({ data: { text, language: lang } });
      await playBase64Mp3(audioBase64);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice failed");
    } finally {
      setSpeaking(false);
    }
  };

  const tone =
    scan.severityScore >= 60
      ? "bg-clay/15 text-clay ring-clay/30"
      : scan.severityScore >= 30
        ? "bg-sun/20 text-sun-700 ring-sun/40"
        : "bg-leaf/15 text-leaf-700 ring-leaf/30";

  return (
    <div className="rounded-3xl bg-cream-2 p-4 ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-bold uppercase tracking-wide text-soil-500">{t("scanResult")}</span>
        {scan.when ? <span className="shrink-0 text-sm font-medium text-soil-500">{scan.when}</span> : null}
      </div>

      {scan.imageUrl ? (
        <img
          src={scan.imageUrl}
          alt={scan.disease}
          className="aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-black/5"
        />
      ) : null}

      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-2xl font-semibold text-soil">{scan.disease}</h3>
          <span className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${tone}`}>
            {scan.severityLabel}
          </span>
        </div>
        {scan.crop ? <p className="text-sm font-semibold text-soil-500">{scan.crop}</p> : null}
        {scan.summary ? (
          <p className="mt-1 text-[15px] leading-relaxed text-soil-700">{scan.summary}</p>
        ) : null}
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cream ring-1 ring-black/5">
          <div
            className={`h-full rounded-full ${scan.severityScore >= 60 ? "bg-clay" : scan.severityScore >= 30 ? "bg-sun" : "bg-leaf"}`}
            style={{ width: `${Math.max(4, Math.min(100, scan.severityScore))}%` }}
          />
        </div>
        <p className="mt-1.5 text-sm font-semibold text-soil-500">
          {t("severity")} {scan.severityScore} / 100
        </p>
      </div>

      {scan.steps.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-soil-500">{t("whatToDo")}</p>
          <ol className="space-y-2.5">
            {scan.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-leaf font-display text-base font-bold text-cream">
                  {i + 1}
                </span>
                <span className="min-w-0 pt-1 text-[15px] font-medium leading-snug text-soil">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <button
        type="button"
        onClick={readAloud}
        disabled={speaking}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf py-4 text-base font-semibold text-cream ring-1 ring-leaf-700 disabled:opacity-60"
      >
        <Volume2 className="size-5" />
        {t("speakAnswer")}
      </button>
      <a
        href="tel:18001801551"
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold text-soil-700 ring-1 ring-black/10"
      >
        <Phone className="size-5" />
        Kisan Call Centre · 1800-180-1551
      </a>
    </div>
  );
}
