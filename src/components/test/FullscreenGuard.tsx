import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Maximize, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenGuardProps {
  children: React.ReactNode;
  maxExits?: number;
  onMaxExitsReached: () => void;
  onExitCountChange?: (count: number) => void;
  initialExitCount?: number;
}

export default function FullscreenGuard({
  children,
  maxExits = 7,
  onMaxExitsReached,
  onExitCountChange,
  initialExitCount = 0
}: FullscreenGuardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitCount, setExitCount] = useState(initialExitCount);
  const [showWarning, setShowWarning] = useState(false);
  const [showEnterPrompt, setShowEnterPrompt] = useState(false);
  const hasBeenFullscreen = useRef(false);
  const exitCountRef = useRef(initialExitCount);

  // Keep ref in sync
  useEffect(() => {
    exitCountRef.current = exitCount;
  }, [exitCount]);

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowWarning(false);
      setShowEnterPrompt(false);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  const incrementExit = useCallback(() => {
    const newCount = exitCountRef.current + 1;
    exitCountRef.current = newCount;
    setExitCount(newCount);
    onExitCountChange?.(newCount);

    if (newCount >= maxExits) {
      onMaxExitsReached();
    } else {
      setShowWarning(true);
    }
  }, [maxExits, onMaxExitsReached, onExitCountChange]);

  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    setIsFullscreen(isCurrentlyFullscreen);

    if (isCurrentlyFullscreen) {
      hasBeenFullscreen.current = true;
      setShowEnterPrompt(false);
      setShowWarning(false);
    } else if (hasBeenFullscreen.current) {
      incrementExit();
    }
  }, [incrementExit]);

  // Fullscreen change listeners
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // SECURITY: Detect tab switch / window blur via visibilitychange
  useEffect(() => {
    if (!hasBeenFullscreen.current) return;

    const handleVisibilityChange = () => {
      if (document.hidden && hasBeenFullscreen.current) {
        // Tab was switched - count as exit
        incrementExit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [incrementExit]);

  // SECURITY: Detect window blur (Alt+Tab, clicking outside)
  useEffect(() => {
    if (!hasBeenFullscreen.current) return;

    const handleBlur = () => {
      if (hasBeenFullscreen.current && document.fullscreenElement) {
        // Window lost focus while in fullscreen - suspicious
        incrementExit();
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [incrementExit]);

  // SECURITY: Block right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // SECURITY: Block dangerous keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+C (Copy) - prevent copying questions
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        return;
      }
      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return;
      }
      // Block Escape (already handled by fullscreen exit, but prevent default)
      if (e.key === 'Escape') {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // SECURITY: Disable text selection and drag
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'fullscreen-guard-security';
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      img { pointer-events: none !important; -webkit-user-drag: none !important; }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('fullscreen-guard-security');
      if (el) el.remove();
    };
  }, []);

  // On mount: check if already fullscreen
  useEffect(() => {
    const alreadyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    if (alreadyFullscreen) {
      hasBeenFullscreen.current = true;
      setIsFullscreen(true);
    } else {
      setShowEnterPrompt(true);
    }
  }, []);

  const showOverlay = showWarning || showEnterPrompt;

  return (
    <>
      <div className={`relative ${showOverlay ? 'blur-lg pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Fullscreen Entry Prompt */}
      <AnimatePresence>
        {showEnterPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Maximize className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl font-bold font-display mb-2">
                Fullscreen Required
              </h2>
              <p className="text-muted-foreground mb-4">
                This test must be taken in fullscreen mode. Click the button below to enter fullscreen and begin.
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-6 text-sm text-destructive">
                <ShieldAlert className="w-4 h-4 inline mr-1" />
                Switching tabs, opening DevTools, or exiting fullscreen will be detected and counted.
              </div>

              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={enterFullscreen}
              >
                <Maximize className="w-5 h-5 mr-2" />
                Enter Full Screen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              <h2 className="text-2xl font-bold font-display mb-2">
                Security Violation Detected
              </h2>
              <p className="text-muted-foreground mb-4">
                You exited fullscreen or switched away from the test. Return to fullscreen to continue.
              </p>

              <div className={`p-4 rounded-lg mb-6 ${
                exitCount >= maxExits - 2
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-[hsl(45,93%,47%)]/20 text-[hsl(45,93%,47%)]'
              }`}>
                <p className="font-semibold">
                  Warning: {exitCount} of {maxExits} violations used
                </p>
                <p className="text-sm mt-1">
                  {maxExits - exitCount} remaining before auto-submit
                </p>
              </div>

              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={enterFullscreen}
              >
                <Maximize className="w-5 h-5 mr-2" />
                Continue in Full Screen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
