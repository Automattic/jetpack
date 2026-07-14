import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useSiteLaunchGatingVariant } from '../../../common/hooks';

import './style.scss';

const queryClient = new QueryClient();

/**
 * Set the href base of all relative links to the wordpress.com.
 *
 * @return {Function} A ref callback.
 */
function useSetHrefBase() {
	return useRefEffect( element => {
		const observer = new MutationObserver( () => {
			element.querySelectorAll( 'a' ).forEach( a => {
				const href = a.getAttribute( 'href' );
				if ( ! href || ! href.startsWith( '/' ) ) {
					return;
				}
				a.setAttribute( 'href', new URL( href, 'https://wordpress.com' ) );
			} );
		} );
		observer.observe( element, {
			attributes: true,
			childList: true,
			subtree: true,
		} );
		return () => {
			observer.unobserve( element );
		};
	}, [] );
}

const LaunchpadWidget = ( { siteDomain, siteIntent } ) => {
	const [ , variant ] = useSiteLaunchGatingVariant();

	const onTaskClick = task => {
		if ( ! task.isLaunchTask ) {
			return;
		}

		// Site launch gating: 'semi_gated_site_launch' is the shipped default. The other
		// branches are scaffolding for future experiments; see useSiteLaunchGatingVariant.
		switch ( variant ) {
			case 'semi_gated_site_launch':
			case null:
			default:
				window.location.assign(
					addQueryArgs( 'https://wordpress.com/start/launch-site', {
						siteSlug: siteDomain,
						ref: 'wp-admin',
					} )
				);
				return false;
		}
	};

	return (
		<div ref={ useSetHrefBase() }>
			<Launchpad
				siteSlug={ siteDomain }
				checklistSlug={ siteIntent }
				launchpadContext="wpadmin-dashboard-widget"
				onTaskClick={ onTaskClick }
			/>
		</div>
	);
};

export default ( { siteDomain, siteIntent } ) => {
	return (
		<QueryClientProvider client={ queryClient }>
			<LaunchpadWidget siteDomain={ siteDomain } siteIntent={ siteIntent } />
		</QueryClientProvider>
	);
};
