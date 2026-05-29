import { ThemeProvider } from '@automattic/jetpack-components';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import type { FC, ReactNode } from 'react';

interface ProvidersProps {
	children: ReactNode;
}

// `DataSyncProvider` supplies the TanStack `QueryClient` that `useDataSync`
// relies on — no need for a hand-rolled client here.
const Providers: FC< ProvidersProps > = ( { children } ) => (
	<ThemeProvider>
		<DataSyncProvider>{ children }</DataSyncProvider>
	</ThemeProvider>
);

export default Providers;
