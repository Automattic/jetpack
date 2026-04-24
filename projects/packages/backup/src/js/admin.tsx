import { useEffect, useState } from '@wordpress/element';
import { HashRouter, Route, Routes } from 'react-router';
import Providers from './providers';
import DownloadScreen from './screens/download';
import OverviewScreen from './screens/overview';
import Shell from './shell';
import type { FC } from 'react';

// HashRouter + Routes over the `#/…` location — wp-admin owns the
// pathname. On this WordPress/Atomic env, React Router's internal
// subscription to `history.listen` never propagates location updates
// through context after mount (the state gets committed but children
// don't re-render). Mount itself works, so we remount HashRouter on
// every hash change by keying it. Providers stay OUTSIDE the key so
// the QueryClient cache + ThemeProvider survive navigation.
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
						<Route path="*" element={ <OverviewScreen /> } />
					</Route>
				</Routes>
			</HashRouter>
		</Providers>
	);
};

export default App;
