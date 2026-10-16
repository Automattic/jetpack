/**
 * Exposes the shared header's controls to dashboards built outside My Jetpack, such as Boost's.
 *
 * A webpack script, so `@automattic/jetpack-connection` resolves to the page's shared copy instead of a second bundled one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getHeaderControls } from './components/header-controls';
import NoticeContextProvider from './context/notices/noticeContext';

const queryClient = new QueryClient();

window.myJetpackHeaderControls = {
	getHeaderControls: () => {
		const controls = getHeaderControls();

		return (
			controls && (
				<NoticeContextProvider>
					<QueryClientProvider client={ queryClient }>{ controls }</QueryClientProvider>
				</NoticeContextProvider>
			)
		);
	},
};
