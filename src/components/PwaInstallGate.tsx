import { useEffect, useState, type PropsWithChildren } from "react";
import { Download, Plus, Radar, Share2, Smartphone } from "lucide-react";

type InstallState = "idle" | "prompting" | "accepted" | "dismissed" | "manual";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const standaloneDisplayModes = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)",
];

const isRunningAsPwa = () => {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return navigatorWithStandalone.standalone === true ||
    standaloneDisplayModes.some((query) => window.matchMedia(query).matches);
};

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function PwaInstallGate({ children }: PropsWithChildren) {
  const [isStandalone, setIsStandalone] = useState(isRunningAsPwa);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>("idle");

  useEffect(() => {
    const updateStandaloneState = () => setIsStandalone(isRunningAsPwa());
    const mediaQueries = standaloneDisplayModes.map((query) => window.matchMedia(query));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallState("idle");
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setInstallState("accepted");
      updateStandaloneState();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQueries.forEach((query) => query.addEventListener("change", updateStandaloneState));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQueries.forEach((query) => query.removeEventListener("change", updateStandaloneState));
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setInstallState("manual");
      return;
    }

    setInstallState("prompting");
    await installPrompt.prompt();

    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallState(choice.outcome === "accepted" ? "accepted" : "dismissed");
  };

  if (isStandalone) {
    return <>{children}</>;
  }

  const buttonLabel = installState === "prompting"
    ? "Abrindo instalador"
    : installPrompt
      ? "Instalar App"
      : "Como instalar";

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-5 font-sans">
      <section className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-red-600" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-950/40 shrink-0">
              <Radar className="w-8 h-8 text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                Acesso restrito
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight">
                Instale o Radar Alerta
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Este app só funciona instalado como PWA para garantir uma experiência dedicada de alerta no trânsito.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstall}
            disabled={installState === "prompting"}
            className="mt-6 w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-wait"
          >
            <Download className="w-4 h-4" />
            {buttonLabel}
          </button>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            {installState === "accepted" ? (
              <p className="text-sm font-bold text-emerald-300">
                Instalado. Abra pelo ícone do app para continuar.
              </p>
            ) : isIos() || installState === "manual" || installState === "dismissed" ? (
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex gap-3">
                  <Share2 className="w-5 h-5 text-blue-300 shrink-0" />
                  <span>Abra o menu de compartilhamento do navegador.</span>
                </div>
                <div className="flex gap-3">
                  <Plus className="w-5 h-5 text-blue-300 shrink-0" />
                  <span>Escolha Adicionar à Tela de Início ou Instalar app.</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-sm text-slate-300">
                <Smartphone className="w-5 h-5 text-blue-300 shrink-0" />
                <span>Se o botão ainda não abrir o instalador, aguarde alguns segundos e tente novamente.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
