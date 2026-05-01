import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FC, ReactNode } from 'react';

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		},
	},
} );

const Providers: FC< { children: ReactNode } > = ( { children } ) => (
	<ThemeProvider>
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	</ThemeProvider>
);

export default Providers;
