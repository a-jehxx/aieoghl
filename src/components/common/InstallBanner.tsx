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
    <div className="border-t border-line bg-card p-4">
      {promptEvent ? (
        <>
          <p className="text-sm font-medium text-ink">앱처럼 설치해서 쓰시겠어요?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="h-11 flex-1 rounded-[10px] bg-navy text-sm font-medium text-white active:opacity-80"
            >
              설치하기
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-11 flex-1 rounded-[10px] border border-line bg-white text-sm font-medium text-ink active:bg-bg"
            >
              닫기
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-xs text-ink-sub">
            앱처럼 설치하려면 Chrome 메뉴(⋮) → 홈 화면에 추가를 눌러주세요.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="닫기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-sub active:bg-bg"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
