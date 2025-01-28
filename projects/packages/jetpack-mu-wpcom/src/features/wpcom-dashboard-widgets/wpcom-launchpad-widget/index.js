import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';

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

export default ( { siteDomain, siteIntent } ) => {
	return (
		<QueryClientProvider client={ queryClient }>
			<div ref={ useSetHrefBase() }>
				<Launchpad
					siteSlug={ siteDomain }
					checklistSlug={ siteIntent }
					launchpadContext="customer-home"
					onSiteLaunched={ () => {
						const url = new URL( window.location.href );
						url.searchParams.set( 'celebrate-launch', 'true' );
						window.location.href = url.toString();
					} }
				/>
			</div>
		</QueryClientProvider>
	);
};
