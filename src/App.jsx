import useHash, { hashStartsWith } from './hooks/useHash.js';
import Nav from './components/Nav/Nav.jsx';
import PlayerPage from './pages/PlayerPage.jsx';
import DMPage from './pages/DMPage.jsx';

export default function App() {
  const hash = useHash();
  const onDM = hashStartsWith(hash, '/dm');
  const activeMatch = onDM ? '/dm' : '/';

  return (
    <div className="min-h-full">
      <Nav activeMatch={activeMatch} />
      {onDM ? <DMPage /> : <PlayerPage />}
    </div>
  );
}
