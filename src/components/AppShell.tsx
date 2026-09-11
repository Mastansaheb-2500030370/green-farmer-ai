import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Home, Leaf, Mic, User } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const initial = (user?.user_metadata?.["full_name"] as string | undefined)?.[0]?.toUpperCase() ?? "?";

  const nav = [
    { to: "/", label: t("home"), Icon: Home },
    { to: "/scan", label: t("scan"), Icon: Camera },
    { to: "/voice", label: t("voice"), Icon: Mic },
    { to: "/tips", label: t("tips"), Icon: Leaf },
    { to: "/me", label: t("me"), Icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-cream font-body text-soil antialiased">
      <header className="sticky top-0 z-20 bg-cream/95 ring-1 ring-black/5 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf font-display text-lg font-bold text-cream">
              K
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-lg font-semibold text-soil">
                {t("appName")}
              </span>
              <span className="block truncate text-[11px] font-medium text-soil-500">{t("tagline")}</span>
            </span>
          </Link>
          <Link
            to="/me"
            aria-label={t("profile")}
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-2 ring-1 ring-black/5"
          >
            <span className="grid size-9 place-items-center rounded-full bg-clay font-display text-base font-bold text-cream">
              {initial}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-32 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {nav.map(({ to, label, Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-3 ${active ? "text-leaf-700" : "text-soil-500"}`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-xs ${active ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
