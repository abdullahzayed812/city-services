import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './src/navigation';
import { useAuthStore } from './src/store/auth.store';
import { useServerStore } from './src/store/server.store';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrateServer = useServerStore((state) => state.hydrate);

  useEffect(() => {
    hydrateServer();
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
    </QueryClientProvider>
  );
}
