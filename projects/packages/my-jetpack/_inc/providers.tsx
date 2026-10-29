import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NoticeContextProvider from './context/notices/noticeContext';
import ValueStoreContextProvider from './context/value-store/valueStoreContext';
import type { ReactNode, FC } from 'react';

interface ProvidersProps {
	children: ReactNode;
}

// One client for the page: the stage and the inspector are separate React trees that read the same data.
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
