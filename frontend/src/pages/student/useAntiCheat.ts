import { useState, useEffect, useRef } from 'react';

interface AntiCheatOptions {
  maxTabSwitches?: number;
  maxFullscreenEscapes?: number;
  onTerminate: (reason: string) => void;
  onWarning: (reason: string, warningsLeft: number) => void;
}

export function useAntiCheat({
  maxTabSwitches = 2,
  maxFullscreenEscapes = 2,
  onTerminate,
  onWarning
}: AntiCheatOptions) {

  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenEscapes, setFullscreenEscapes] = useState(0);
  const isTerminated = useRef(false);
  const isActive = useRef(true);

  // ── Tab switch / visibility tracking ──────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isTerminated.current && isActive.current) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount > maxTabSwitches) {
            isTerminated.current = true;
            onTerminate('Exceeded maximum allowed tab switches. Test submitted automatically.');
          } else {
            onWarning(
              `Tab switch detected! This is a violation. You have ${maxTabSwitches - newCount + 1} warning(s) remaining.`,
              maxTabSwitches - newCount + 1
            );
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [maxTabSwitches, onTerminate, onWarning]);

  // ── Fullscreen tracking ───────────────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isTerminated.current && isActive.current) {
        setFullscreenEscapes(prev => {
          const newCount = prev + 1;
          if (newCount > maxFullscreenEscapes) {
            isTerminated.current = true;
            onTerminate('Exceeded maximum allowed full-screen escapes. Test submitted automatically.');
          } else {
            onWarning(
              `Full-screen mode exited! Return to full-screen immediately. ${maxFullscreenEscapes - newCount + 1} warning(s) remaining.`,
              maxFullscreenEscapes - newCount + 1
            );
          }
          return newCount;
        });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [maxFullscreenEscapes, onTerminate, onWarning]);

  // ── Screenshot / PrintScreen prevention ──────────────────────────────
  useEffect(() => {
    // Block common screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive.current || isTerminated.current) return;

      const isPrintScreen  = e.key === 'PrintScreen';
      const isWinShiftS    = e.shiftKey && e.key === 'S' && (e.metaKey || e.getModifierState('OS'));
      const isCtrlShiftS   = e.ctrlKey && e.shiftKey && e.key === 's';
      const isAltPrintScr  = e.altKey && e.key === 'PrintScreen';

      // Block F12 developer tools
      const isF12 = e.key === 'F12';
      // Block Ctrl+U (view source)
      const isCtrlU = e.ctrlKey && e.key === 'u';
      // Block Ctrl+Shift+I (devtools)
      const isDevTools = e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C');

      if (isPrintScreen || isWinShiftS || isCtrlShiftS || isAltPrintScr) {
        e.preventDefault();
        onWarning('Screenshot attempt detected! Screenshots are not allowed during the test.', maxTabSwitches);
        return;
      }

      if (isF12 || isCtrlU || isDevTools) {
        e.preventDefault();
        return;
      }
    };

    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (isActive.current) e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [maxTabSwitches, onWarning]);

  // ── CSS-level screenshot deterrent ───────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'anti-cheat-style';
    style.textContent = `
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById('anti-cheat-style')?.remove();
    };
  }, []);

  // ── Fullscreen helper ─────────────────────────────────────────────────
  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => {
        console.warn('Fullscreen permission denied or not supported', e);
      });
    }
  };

  const deactivate = () => {
    isActive.current = false;
  };

  return { tabSwitches, fullscreenEscapes, enterFullscreen, deactivate };
}
