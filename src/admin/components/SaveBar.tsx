import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/Button';

/** Barra flutuante que aparece quando há alterações não salvas. */
export function SaveBar({ dirty, saving, onSave, onDiscard, disabled }: { dirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void; disabled?: boolean }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed inset-x-3 bottom-4 z-40 mx-auto max-w-xl lg:left-[calc(16rem+1.5rem)]"
        >
          <div className="glass-strong flex items-center justify-between gap-3 rounded-[22px] py-2.5 pl-5 pr-2.5">
            <span className="flex items-center gap-2.5 text-[13.5px] text-bone/85">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-amber-300" />
              Alterações não salvas
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
                Descartar
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving || disabled}>
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
