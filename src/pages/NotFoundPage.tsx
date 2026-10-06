import { LinkButton } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[11px] tracking-[0.3em] text-fog">ERRO 404 · CENA NÃO ENCONTRADA</p>
      <h1 className="display mt-6 text-[clamp(3rem,10vw,7rem)]">
        Corta<em className="font-serif font-normal italic">!</em>
      </h1>
      <p className="mt-4 max-w-sm text-mist">Essa página não existe ou foi movida.</p>
      <LinkButton href="/" arrow className="mt-10">
        Voltar ao início
      </LinkButton>
    </div>
  );
}
