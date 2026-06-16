/**
 * Root App component — screen routing.
 *
 * The active screen is chosen from the `?plugin=<slug>` URL param:
 * - absent → PluginList wrapped in AdminPage (all plugins overview)
 * - slug   → PluginManage (single-plugin manage view, owns its own AdminPage so it can supply a breadcrumb once the plugin name is known)
 *
 * Navigation between the two screens happens client-side via the History API
 * (see `./api/navigation`), so switching doesn't trigger a full page reload —
 * the `?plugin=` URL still changes, stays bookmarkable, and renders correctly on
 * a cold load.
 *
 * @package
 */

import { AdminPage, JetpackFooter } from '@automattic/jetpack-components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBetaData } from './api/boot';
import { BetaNavContext, type NavigateFn } from './api/navigation';
import PluginList from './screens/plugin-list';
import PluginManage from './screens/plugin-manage';
import './style.scss';

const boot = getBetaData();

/**
 * The active plugin slug from the current URL (`?plugin=`), or null for the list.
 *
 * @return The plugin slug, or null.
 */
const pluginFromUrl = (): string | null =>
	new URLSearchParams( window.location.search ).get( 'plugin' );

/**
 * App component.
 *
 * @return The active screen, wrapped in AdminPage where appropriate.
 */
const App = () => {
	const [ plugin, setPlugin ] = useState< string | null >( pluginFromUrl );

	// Keep the active screen in sync with the URL for browser back/forward.
	useEffect( () => {
		const onPopState = () => setPlugin( pluginFromUrl() );
		window.addEventListener( 'popstate', onPopState );
		return () => window.removeEventListener( 'popstate', onPopState );
	}, [] );

	// Client-side navigation: update the `?plugin=` URL without a full reload.
	const navigate = useCallback< NavigateFn >( slug => {
		const url = new URL( window.location.href );
		if ( slug ) {
			url.searchParams.set( 'plugin', slug );
		} else {
			url.searchParams.delete( 'plugin' );
		}
		window.history.pushState( null, '', url.toString() );
		setPlugin( slug );
		window.scrollTo( 0, 0 );
	}, [] );

	return (
		<BetaNavContext.Provider value={ navigate }>
			{ plugin ? (
				// The manage screen owns its own AdminPage so it can inject a
				// breadcrumb once it knows the plugin name (fetched asynchronously).
				<PluginManage slug={ plugin } />
			) : (
				<AdminPage
					title="Beta Tester"
					subTitle={ __(
						'Test beta features and pull requests for Jetpack plugins.',
						'jetpack-beta'
					) }
					apiRoot={ boot.apiRoot }
					apiNonce={ boot.apiNonce }
					showFooter={ false }
					unwrapped
				>
					<PluginList />
					<JetpackFooter showDefaultLinks={ false } />
				</AdminPage>
			) }
		</BetaNavContext.Provider>
	);
};

export default App;
