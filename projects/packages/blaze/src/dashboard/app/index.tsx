/**
 * Root of the Blaze Ads dashboard, routed by the hashbang.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, type MouseEvent } from 'react';
import config from '../compat/config';
import page, { matchPath, useRoute } from '../compat/router';
import { getAdvertisingDashboardPath } from '../promote-post-i2/utils';
import { fixPath, getRoutes, getSetupRedirect, type RouteResult } from './routes';
import '../promote-post-i2/style.scss';
import './app.scss';

const queryClient = new QueryClient();

const GRIDICONS_SPRITE =
	'https://widgets.wp.com/blaze-dashboard/common/gridicons-506499ddac13811fee8e.svg';
const SPRITE_ID = 'jetpack-blaze-gridicons-sprite';

/**
 * Inject the gridicons sprite the remote DSP widget's icons point at, once.
 */
function useGridiconsSprite() {
	useEffect( () => {
		if ( document.getElementById( SPRITE_ID ) ) {
			return;
		}
		window
			.fetch( GRIDICONS_SPRITE )
			.then( response => ( response.ok ? response.text() : '' ) )
			.then( svg => {
				if ( ! svg || document.getElementById( SPRITE_ID ) ) {
					return;
				}
				const doc = new window.DOMParser().parseFromString( svg, 'image/svg+xml' );
				const sprite = doc.documentElement;
				if ( sprite.nodeName.toLowerCase() !== 'svg' ) {
					return;
				}
				sprite.setAttribute( 'id', SPRITE_ID );
				sprite.style.display = 'none';
				document.body.prepend( document.importNode( sprite, true ) );
			} )
			.catch( () => {} );
	}, [] );
}

/**
 * Resolve the current path to an element or a redirect.
 *
 * @param pathname - Hash path.
 * @param query    - Hash query.
 * @return Route result.
 */
function resolve( pathname: string, query: Record< string, string > ): RouteResult {
	const fallback = getAdvertisingDashboardPath( `/${ config( 'hostname' ) }` );
	if ( ! pathname ) {
		return { redirect: fallback };
	}
	const fixed = fixPath( pathname );
	if ( fixed !== pathname ) {
		return { redirect: fixed };
	}
	const setupRedirect = getSetupRedirect( pathname );
	if ( setupRedirect ) {
		return { redirect: setupRedirect };
	}
	for ( const route of getRoutes() ) {
		const params = matchPath( route.pattern, pathname );
		if ( params ) {
			return route.render( params, query );
		}
	}
	return { redirect: fallback };
}

/**
 * Send clicks on in-app links (`/advertising/...`) through the hash router.
 *
 * @param event - Click event.
 */
function interceptLinks( event: MouseEvent< HTMLDivElement > ) {
	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey
	) {
		return;
	}
	const anchor = ( event.target as HTMLElement ).closest( 'a' );
	const href = anchor?.getAttribute( 'href' );
	if ( ! href || anchor?.target === '_blank' ) {
		return;
	}
	if ( href.startsWith( config( 'advertising_dashboard_path_prefix' ) ) ) {
		event.preventDefault();
		page( href );
	}
}

/**
 * The dashboard.
 *
 * @return Dashboard tree.
 */
export default function BlazeDashboard() {
	const { pathname, query, active } = useRoute();
	const result = useMemo( () => resolve( pathname, query ), [ pathname, query ] );
	const redirect = active && 'redirect' in result ? result.redirect : null;

	useGridiconsSprite();

	useEffect( () => {
		if ( redirect ) {
			page.redirect( redirect );
		}
	}, [ redirect ] );

	return (
		<QueryClientProvider client={ queryClient }>
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Delegated link handling; the anchors stay keyboard-operable. */ }
			<div
				className={ `${ config( 'css_prefix' ) || 'jp-blaze' }-dashboard` }
				onClick={ interceptLinks }
			>
				{ 'element' in result ? result.element : null }
			</div>
		</QueryClientProvider>
	);
}
