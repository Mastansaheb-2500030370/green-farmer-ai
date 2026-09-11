import { LANGUAGES, useI18n } from "@/lib/i18n";

export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();

  return (
    <section className="mb-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="min-w-0 font-display text-2xl font-semibold text-soil">{t("chooseLanguage")}</h2>
        <span className="shrink-0 text-sm font-medium text-soil-500">{LANGUAGES.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {LANGUAGES.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl py-3.5 ${
                active ? "bg-leaf text-cream ring-2 ring-leaf-700" : "bg-cream-2 ring-1 ring-black/5"
              }`}
            >
              <span className={`font-display text-lg ${active ? "font-bold" : "font-semibold text-soil"}`}>
                {l.short}
              </span>
              <span className={`text-[13px] ${active ? "font-semibold" : "font-medium text-soil-500"}`}>
                {l.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
