import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'glass' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-500 ease-[var(--ease-cine)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40';

const variants: Record<Variant, string> = {
  primary:
    'bg-bone text-ink shadow-[0_10px_40px_-10px_rgb(255_255_255/0.35),inset_0_-1px_0_rgb(0_0_0/0.12)] hover:bg-white hover:shadow-[0_18px_60px_-12px_rgb(255_255_255/0.45)]',
  glass: 'glass-pill text-bone hover:border-white/25 hover:bg-white/10',
  ghost: 'text-bone/80 hover:bg-white/6 hover:text-bone',
  outline: 'border border-white/15 text-bone hover:border-white/40 hover:bg-white/5',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-[15px]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

function Inner({ arrow, icon, children }: Pick<CommonProps, 'arrow' | 'icon' | 'children'>) {
  return (
    <>
      {icon}
      <span className="relative">{children}</span>
      {arrow && (
        <span className="relative -mr-1 flex h-6 w-6 items-center justify-center overflow-hidden">
          <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[var(--ease-cine)] group-hover/btn:translate-x-[140%]" />
          <ArrowRight className="absolute h-4 w-4 -translate-x-[140%] transition-transform duration-500 ease-[var(--ease-cine)] group-hover/btn:translate-x-0" />
        </span>
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant = 'primary', size = 'md', arrow, icon, children, className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      <Inner arrow={arrow} icon={icon}>
        {children}
      </Inner>
    </button>
  ),
);
Button.displayName = 'Button';

export function LinkButton({
  variant = 'primary',
  size = 'md',
  arrow,
  icon,
  children,
  className,
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...props}>
      <Inner arrow={arrow} icon={icon}>
        {children}
      </Inner>
    </a>
  );
}
