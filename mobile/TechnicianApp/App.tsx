import React, {useEffect} from 'react';
import {I18nManager} from 'react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useAuthStore} from './src/store/auth.store';
import {useServerStore} from './src/store/server.store';
import Navigation from './src/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

dayjs.extend(relativeTime);
dayjs.locale('ar');

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {staleTime: 5 * 60 * 1000, retry: 2},
  },
});

export default function App() {
  const hydrate = useAuthStore(state => state.hydrate);
  const hydrateServer = useServerStore(state => state.hydrate);
  useEffect(() => {hydrateServer(); hydrate();}, [hydrate, hydrateServer]);

  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
    </QueryClientProvider>
  );
}
