import { useEffect } from 'react';
import { useGettingStarted } from '$lib/stores/getting-started';
import { navigateTo, subpageUrl } from '$lib/modern/routes';
import type { ModernRoute } from '$lib/modern/routes';

/**
 * Routes that send an onboarding user to Getting Started, matching the legacy
 * router's loader: Settings and the two sub-pages it guards, never the
 * onboarding or purchase pages themselves.
 *
 * @param route - Route being shown.
 * @return Whether the route is guarded.
 */
function isGuarded( route: ModernRoute ): boolean {
	return (
		route.subpage === null ||
		route.subpage === 'cache-debug-log' ||
		route.subpage === 'critical-css-advanced'
	);
}

/**
 * Send onboarding users to Getting Started, as today.
 *
 * @param route - Route being shown.
 * @return Whether a redirect is pending, so the caller can hold the page view.
 */
export function useOnboardingRedirect( route: ModernRoute ): boolean {
	const { shouldGetStarted } = useGettingStarted();
	const redirecting = shouldGetStarted && isGuarded( route );

	useEffect( () => {
		if ( redirecting ) {
			navigateTo( subpageUrl( 'getting-started' ), { replace: true } );
		}
	}, [ redirecting ] );

	return redirecting;
}
