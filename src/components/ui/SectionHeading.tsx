import { RichText } from './RichText';
import { Reveal } from './Reveal';
import { cn } from '@/lib/cn';

interface Props {
  index: string;
  eyebrow: string;
  title: string;
  text?: string;
  align?: 'left' | 'split';
  className?: string;
}

export function SectionHeading({ index, eyebrow, title, text, align = 'split', className }: Props) {
  return (
    <div className={cn('grid gap-8', align === 'split' && 'lg:grid-cols-12 lg:items-end', className)}>
      <div className={cn(align === 'split' && 'lg:col-span-8')}>
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span className="text-bone/40">({index})</span>
            <span className="h-px w-8 bg-white/20" />
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="display mt-6 text-[clamp(2.4rem,6vw,5.5rem)] text-bone">
            <RichText text={title} accentClassName="text-accent" />
          </h2>
        </Reveal>
      </div>
      {text && (
        <Reveal delay={0.16} className={cn(align === 'split' && 'lg:col-span-4 lg:pb-3')}>
          <p className="max-w-md text-[15px] leading-relaxed text-mist">{text}</p>
        </Reveal>
      )}
    </div>
  );
}
