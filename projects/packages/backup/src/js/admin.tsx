import { useEffect, useState } from '@wordpress/element';
import { HashRouter, Route, Routes } from 'react-router';
import Providers from './providers';
import DownloadScreen from './screens/download';
import OverviewScreen from './screens/overview';
import RestoreScreen from './screens/restore';
import Shell from './shell';
import type { FC } from 'react';

// HashRouter + Routes over the `#/…` location — wp-admin owns the
// pathname. We tried react-router 7's data-router (createHashRouter +
// RouterProvider) for Phase 6, hoping its external store would dodge
// the rendering stall under WP's canary ReactDOM
// (`18.3.1-next-f1338f8080-20240426`). It didn't: the router's
// internal state DOES update on navigate() (we verified state.location
// flips to /restore), but RouterProvider's useSyncExternalStore
// subscribers never re-render the children, so the Outlet keeps the
// previous screen mounted.
//
// Falling back to the same workaround that worked before Phase 6: key
// the HashRouter on the URL hash and remount the whole router tree on
// every hashchange. Costs ~1-2s of Gates re-run per nav, but it
// reliably propagates location changes. Providers stay OUTSIDE the
// key so the QueryClient cache + ThemeProvider survive navigation.
const App: FC = () => {
	const [ hashKey, setHashKey ] = useState( () => window.location.hash || '#/' );
	useEffect( () => {
		const onHashChange = () => setHashKey( window.location.hash || '#/' );
		window.addEventListener( 'hashchange', onHashChange );
		window.addEventListener( 'popstate', onHashChange );

		// React Router's `navigate()` uses `history.pushState`, which
		// doesn't fire `hashchange` even when the URL's hash changes.
		// Patch pushState / replaceState to dispatch a synthetic
		// hashchange so the `hashKey` listener above picks up
		// programmatic navigations and remounts the router tree.
		const origPush = window.history.pushState;
		const origReplace = window.history.replaceState;
		const fireHashChange = () => onHashChange();
		window.history.pushState = function ( ...args ) {
			origPush.apply( this, args );
			fireHashChange();
		};
		window.history.replaceState = function ( ...args ) {
			origReplace.apply( this, args );
			fireHashChange();
		};

		return () => {
			window.removeEventListener( 'hashchange', onHashChange );
			window.removeEventListener( 'popstate', onHashChange );
			window.history.pushState = origPush;
			window.history.replaceState = origReplace;
		};
	}, [] );

	return (
		<Providers>
			<HashRouter key={ hashKey }>
				<Routes>
					<Route element={ <Shell /> }>
						<Route index element={ <OverviewScreen /> } />
						<Route path="download" element={ <DownloadScreen /> } />
						<Route path="restore" element={ <RestoreScreen /> } />
						<Route path="*" element={ <OverviewScreen /> } />
					</Route>
				</Routes>
			</HashRouter>
		</Providers>
	);
};

export default App;
