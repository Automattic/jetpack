import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import CelebrateLaunchModal from './celebrate-launch-modal';

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

export default ( { siteDomain, siteIntent, sitePlan, siteUrl, hasCustomDomain } ) => {
	const [ celebrateLaunchModalIsOpen, setCelebrateLaunchModalIsOpen ] = useState( false );
	useEffect( () => {
		const url = new URL( window.location.href );
		if ( url.searchParams.has( 'celebrate-launch' ) ) {
			setCelebrateLaunchModalIsOpen( true );
			url.searchParams.delete( 'celebrate-launch' );
			window.history.replaceState( null, '', url );
		}
	}, [] );
	return (
		<QueryClientProvider client={ queryClient }>
			<div ref={ useSetHrefBase() }>
				<Launchpad
					siteSlug={ siteDomain }
					checklistSlug={ siteIntent }
					launchpadContext="customer-home"
					onSiteLaunched={ () => {
						window.location.href = window.location.href + '?celebrate-launch';
					} }
				/>
			</div>
			{ celebrateLaunchModalIsOpen && (
				<CelebrateLaunchModal
					onRequestClose={ () => setCelebrateLaunchModalIsOpen( false ) }
					sitePlan={ sitePlan }
					siteUrl={ siteUrl }
					siteSlug={ siteDomain }
					hasCustomDomain={ hasCustomDomain }
				/>
			) }
		</QueryClientProvider>
	);
};
