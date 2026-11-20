import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NoticeContextProvider from './context/notices/noticeContext';
import ValueStoreContextProvider from './context/value-store/valueStoreContext';
import type { ReactNode, FC } from 'react';

interface ProvidersProps {
	children: ReactNode;
}

// One client per page load: a client made in render would drop its cache whenever Providers re-renders.
export const queryClient = new QueryClient();

const Providers: FC< ProvidersProps > = ( { children } ) => {
	return (
		<ThemeProvider>
			<NoticeContextProvider>
				<ValueStoreContextProvider>
					<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
				</ValueStoreContextProvider>
			</NoticeContextProvider>
		</ThemeProvider>
	);
};

export default Providers;
