import type { CSSProperties } from "react";
import vexoLogo from "../assets/VexoLogo.png";

type LoadingAnimationProps = {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
};

const pulseDelays: CSSProperties[] = [
  { animationDelay: "0s" },
  { animationDelay: "0.15s" },
  { animationDelay: "0.3s" },
  { animationDelay: "0.45s" },
];

const barHeights = ["h-6", "h-9", "h-7", "h-11", "h-8"];
const barDelays: CSSProperties[] = [
  { animationDelay: "0s" },
  { animationDelay: "0.12s" },
  { animationDelay: "0.24s" },
  { animationDelay: "0.36s" },
  { animationDelay: "0.48s" },
];

const LoadingAnimation = ({
  title = "Loading Dashboard",
  subtitle = "Preparing your latest data and insights...",
  fullScreen = true,
}: LoadingAnimationProps) => {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${
        fullScreen ? "min-h-screen" : "min-h-[60vh] rounded-3xl"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/15" />
      </div>

      <div className="relative mx-auto flex min-h-[inherit] w-full max-w-3xl items-center justify-center px-6 py-14">
        <section className="w-full rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/75 sm:p-10">
          <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950/70">
            <img src={vexoLogo} alt="Vexo" className="h-8 w-auto sm:h-9" />
            <span className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">Flash Trade</span>
          </div>

          <div className="mb-6 flex items-end justify-center gap-1.5">
            {barHeights.map((height, index) => (
              <span
                key={`loader-bar-${height}-${index}`}
                style={barDelays[index]}
                className={`w-2 ${height} animate-bounce rounded-full bg-gradient-to-t from-sky-500 to-indigo-500`}
              />
            ))}
          </div>

          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-sky-500 dark:border-slate-700 dark:border-t-sky-400" />

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">{subtitle}</p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {pulseDelays.map((style, index) => (
              <span
                key={`loader-dot-${index}`}
                style={style}
                className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500 dark:bg-sky-400"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoadingAnimation;
