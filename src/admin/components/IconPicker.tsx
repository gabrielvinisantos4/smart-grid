import { ICON_NAMES } from '@shared/icons';
import { DynamicIcon } from '@/config/icons';
import { cn } from '@/lib/cn';

export function IconPicker({ value, onChange, disabled }: { value: string; onChange: (icon: string) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-11">
      {ICON_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          title={name}
          disabled={disabled}
          onClick={() => onChange(name)}
          className={cn(
            'flex aspect-square items-center justify-center rounded-xl border transition',
            value === name ? 'border-bone bg-bone text-ink' : 'border-white/[0.07] text-bone/70 hover:border-white/25 hover:text-bone',
          )}
          aria-pressed={value === name}
          aria-label={name}
        >
          <DynamicIcon name={name} className="h-4 w-4" strokeWidth={1.7} />
        </button>
      ))}
    </div>
  );
}
