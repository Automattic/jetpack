import { Launchpad } from '@automattic/launchpad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRefEffect } from '@wordpress/compose';

import './style.scss';

const queryClient = new QueryClient();

const LAUNCHPAD_ENTREPRENEUR_SITE_SETUP = 'home-launchpad-entrepreneur-site-setup';
const LAUNCHPAD_INTENT_BUILD = 'home-launchpad-intent-build';
const LAUNCHPAD_INTENT_HOSTING = 'home-launchpad-intent-hosting';
const LAUNCHPAD_INTENT_WRITE = 'home-launchpad-intent-write';
const LAUNCHPAD_INTENT_FREE_NEWSLETTER = 'home-launchpad-intent-free-newsletter';
const LAUNCHPAD_INTENT_PAID_NEWSLETTER = 'home-launchpad-intent-paid-newsletter';
const LAUNCHPAD_INTENT_NEWSLETTER_GOAL = 'home-launchpad-intent-newsletter-goal';
const LAUNCHPAD_PRE_LAUNCH = 'home-launchpad-pre-launch';
const LAUNCHPAD_LEGACY_SITE_SETUP = 'home-launchpad-legacy-site-setup';
const LAUNCHPAD_POST_MIGRATION = 'home-launchpad-post-migration';

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

export default ( { siteDomain, siteIntent, launchpadId } ) => {
	const checklistSlugMap = {
		[ LAUNCHPAD_ENTREPRENEUR_SITE_SETUP ]: 'entrepreneur-site-setup',
		[ LAUNCHPAD_INTENT_BUILD ]: 'intent-build',
		[ LAUNCHPAD_INTENT_HOSTING ]: 'host-site',
		[ LAUNCHPAD_INTENT_WRITE ]: 'intent-write',
		[ LAUNCHPAD_INTENT_FREE_NEWSLETTER ]: 'intent-free-newsletter',
		[ LAUNCHPAD_INTENT_PAID_NEWSLETTER ]: 'intent-paid-newsletter',
		[ LAUNCHPAD_INTENT_NEWSLETTER_GOAL ]: 'intent-newsletter-goal',
		[ LAUNCHPAD_PRE_LAUNCH ]: siteIntent,
		[ LAUNCHPAD_LEGACY_SITE_SETUP ]: 'legacy-site-setup',
		[ LAUNCHPAD_POST_MIGRATION ]: 'post-migration',
	};
	return (
		<QueryClientProvider client={ queryClient }>
			<div ref={ useSetHrefBase() }>
				<Launchpad
					siteSlug={ siteDomain }
					checklistSlug={ checklistSlugMap[ launchpadId ] }
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
