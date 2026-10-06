import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useLockBody } from '@/hooks/useLockBody';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label: string;
  /** "sheet" desliza de baixo no mobile; "center" é um modal clássico. */
  variant?: 'center' | 'sheet';
}

export function Modal({ open, onClose, children, className, label, variant = 'center' }: ModalProps) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sheet = variant === 'sheet';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn('fixed inset-0 z-[70] flex justify-center', sheet ? 'items-end' : 'items-center p-4')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            className={cn(
              'glass-strong relative w-full overflow-hidden',
              sheet ? 'max-h-[88svh] rounded-t-[28px] pb-[env(safe-area-inset-bottom)]' : 'max-h-[92svh] max-w-lg rounded-[28px]',
              className,
            )}
            initial={sheet ? { y: '100%' } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <button
              onClick={onClose}
              className="glass-pill absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-bone/80 transition hover:text-bone"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[inherit] overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
