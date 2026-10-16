/**
 * Renders the shared header's controls into the container dashboards built outside My Jetpack, such as Boost's, put in their header.
 *
 * A webpack script, so `@automattic/jetpack-connection` resolves to the page's shared copy instead of a second bundled one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from '@wordpress/element';
import HeaderControls from './components/header-controls';
import { HEADER_CONTROLS_CONTAINER_ID } from './components/header-controls/slot';
import NoticeContextProvider from './context/notices/noticeContext';
import type { Root } from 'react-dom/client';

const queryClient = new QueryClient();
let mounted: { container: HTMLElement; root: Root } | null = null;

// The dashboard mounts the container after this script runs, and may replace it when it re-renders.
const followContainer = () => {
	const container = document.getElementById( HEADER_CONTROLS_CONTAINER_ID );
	if ( container === ( mounted?.container ?? null ) ) {
		return;
	}

	mounted?.root.unmount();
	mounted = container ? { container, root: createRoot( container ) } : null;
	mounted?.root.render(
		<NoticeContextProvider>
			<QueryClientProvider client={ queryClient }>
				<HeaderControls />
			</QueryClientProvider>
		</NoticeContextProvider>
	);
};

followContainer();
new MutationObserver( followContainer ).observe( document.body, {
	childList: true,
	subtree: true,
} );
