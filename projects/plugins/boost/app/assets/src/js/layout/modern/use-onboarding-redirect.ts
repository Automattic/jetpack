import { useEffect } from 'react';
import { useGettingStarted } from '$lib/stores/getting-started';
import { navigateTo, subpageUrl } from '$lib/modern/routes';
import type { ModernRoute } from '$lib/modern/routes';

/**
 * Whether a route may only be reached once onboarding is done, matching the
 * legacy router's loader: Settings and two sub-pages, never Getting Started or
 * Purchase Success themselves.
 *
 * @param route - Route being shown.
 * @return Whether the route requires onboarding to be complete.
 */
function requiresOnboarding( route: ModernRoute ): boolean {
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
	const redirecting = shouldGetStarted && requiresOnboarding( route );

	useEffect( () => {
		if ( redirecting ) {
			navigateTo( subpageUrl( 'getting-started' ), { replace: true } );
		}
	}, [ redirecting ] );

	return redirecting;
}
