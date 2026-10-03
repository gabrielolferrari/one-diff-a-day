import { useEffect, useMemo, useState } from 'react';
import ChallengeView from './components/ChallengeView';
import Home from './components/Home';
import { pickChallenge, todayKey } from './lib/daily';
import { parseRoute } from './lib/routes';

function useHash(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const today = useMemo(() => todayKey(), []);
  const route = parseRoute(hash, today);

  // Opening a PR starts at the top. With a day selected, the day panel scrolls itself into view instead.
  const scrollKey = route.view === 'challenge' ? `${route.date}-${route.level}` : 'home';
  const keepScroll = route.view === 'home' && route.selected !== null;
  useEffect(() => {
    if (!keepScroll) window.scrollTo(0, 0);
  }, [scrollKey]);

  if (route.view === 'challenge') {
    return (
      <ChallengeView
        key={scrollKey}
        date={route.date}
        today={today}
        challenge={pickChallenge(route.level, route.date)}
      />
    );
  }
  return <Home today={today} selected={route.selected} />;
}
