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

const renderInto = ( container: HTMLElement ) => {
	createRoot( container ).render(
		<NoticeContextProvider>
			<QueryClientProvider client={ new QueryClient() }>
				{ /* The host page names itself through `getHeaderControlsSlot()`; an older host sends none. */ }
				<HeaderControls trackingContext={ container.dataset.trackingContext } />
			</QueryClientProvider>
		</NoticeContextProvider>
	);
};

// The dashboard mounts the container after this script runs; give up after 30s, as the JITM script does.
const waitForContainer = () => {
	const observer = new MutationObserver( () => {
		const container = document.getElementById( HEADER_CONTROLS_CONTAINER_ID );
		if ( container ) {
			observer.disconnect();
			clearTimeout( timeout );
			renderInto( container );
		}
	} );
	const timeout = setTimeout( () => observer.disconnect(), 30000 );

	observer.observe( document.body, { childList: true, subtree: true } );
};

const mountedContainer = document.getElementById( HEADER_CONTROLS_CONTAINER_ID );
if ( mountedContainer ) {
	renderInto( mountedContainer );
} else {
	waitForContainer();
}
