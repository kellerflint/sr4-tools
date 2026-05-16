const LINKS = [
  { hash: '#/', label: 'Shooting Helper', match: '/' },
  { hash: '#/dm', label: 'DM Combat', match: '/dm' },
];

export default function Nav({ activeMatch }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="#/" className="text-lg font-bold tracking-tight text-text">
          <span className="text-accent">SR4</span> Tools
        </a>
        <nav className="flex gap-1">
          {LINKS.map((l) => {
            const active = l.match === activeMatch;
            return (
              <a
                key={l.hash}
                href={l.hash}
                data-testid={`nav-${l.match === '/' ? 'player' : 'dm'}`}
                data-active={active ? 'true' : 'false'}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:bg-surface-2 hover:text-text'
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
