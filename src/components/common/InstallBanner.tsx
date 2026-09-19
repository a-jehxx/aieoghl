import { useEffect, useState } from 'react';
import { useNavigationStore } from '@/store/navigationStore';

const DISMISSED_KEY = 'hsm-install-banner-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const isMain = useNavigationStore((s) => s.stack[s.stack.length - 1].type === 'main');
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(isDismissed);

  useEffect(() => {
    if (isStandalone()) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPromptEvent(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // 저장 실패해도 이번 화면에서는 배너를 닫은 것으로 처리한다.
    }
  }

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setPromptEvent(null);
  }

  if (!isMain || dismissed || isStandalone()) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {promptEvent ? (
        <>
          <p className="text-sm font-medium text-slate-900">앱처럼 설치해서 쓰시겠어요?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-medium text-white active:opacity-80"
            >
              설치하기
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-10 flex-1 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 active:bg-slate-200"
            >
              닫기
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-xs text-slate-500">
            앱처럼 설치하려면 Chrome 메뉴(⋮) → 홈 화면에 추가를 눌러주세요.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="닫기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
