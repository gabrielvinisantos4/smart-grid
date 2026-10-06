import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { ROLE_LABELS } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { adminNav } from './navigation';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-3 pt-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30">
          <span className="h-1.5 w-1.5 rounded-full bg-bone" />
        </span>
        <div>
          <p className="text-[14px] font-medium tracking-[-0.02em]">Studio Admin</p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog">Painel de controle</p>
        </div>
      </div>

      <nav className="mt-10 flex-1 space-y-1">
        {adminNav.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] transition-all duration-300',
                isActive ? 'bg-white/[0.08] text-bone shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]' : 'text-bone/55 hover:bg-white/[0.04] hover:text-bone',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-[18px] w-[18px] transition', isActive ? 'text-bone' : 'text-bone/50')} strokeWidth={1.7} />
                {label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <a href="/" target="_blank" rel="noreferrer" className="mb-3 flex items-center justify-between rounded-2xl border border-white/[0.07] px-3 py-2.5 text-[13px] text-bone/70 transition hover:border-white/20 hover:text-bone">
        Ver site publicado <ArrowUpRight className="h-4 w-4" />
      </a>

      <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[13px] font-medium uppercase">{user?.name.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] text-bone">{user?.name}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-fog">{user && ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate('/admin/login', { replace: true });
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] py-2 text-[13px] text-bone/70 transition hover:border-white/20 hover:text-bone"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    document.title = 'Painel — Studio Admin';
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-svh bg-ink">
      <div className="pointer-events-none fixed inset-0 [background:radial-gradient(900px_circle_at_85%_-10%,rgb(255_255_255/0.06),transparent_60%),radial-gradient(700px_circle_at_0%_110%,rgb(255_255_255/0.03),transparent_60%)]" />

      <aside className="fixed inset-y-3 left-3 z-30 hidden w-64 lg:block">
        <div className="glass h-full rounded-[28px] p-4">
          <SidebarContent />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
        <div className="glass flex w-full items-center justify-between rounded-full py-2 pl-4 pr-2">
          <span className="text-[14px] font-medium">Studio Admin</span>
          <button onClick={() => setOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06]" aria-label="Abrir menu">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="glass-strong absolute inset-y-3 left-3 w-[280px] rounded-[28px] p-4"
            >
              <button onClick={() => setOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06]" aria-label="Fechar menu">
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative px-4 pb-28 pt-4 lg:ml-[17.5rem] lg:px-10 lg:pt-10">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-[1200px]">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
