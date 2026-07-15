/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useCallback } from 'react';

/**
 * Build browser hrefs for the analytics post-detail route (`/post/{postId}`),
 * carrying the shared report window (date range + comparison) from the
 * current URL.
 *
 * Returns a plain href rather than router navigation so widgets stay
 * renderable outside a router (Storybook, tests): the app's history encodes
 * the SPA path in the `p` query param (see `@wordpress/boot`'s path history),
 * so a regular anchor pointing at the same admin page with an updated `p`
 * lands on the detail route.
 *
 * @return A builder mapping a post ID to a post-detail href.
 */
export function usePostDetailHrefBuilder(): ( postId: number | string ) => string {
	let search: Record< string, unknown > | undefined;
	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks -- useSearch may throw outside a matched route
		search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	} catch {
		// Rendered outside a router (Storybook, tests): fall back to no params.
	}

	return useCallback(
		( postId: number | string ) => {
			const params = pickReportDateParams( search );
			const query = new URLSearchParams(
				Object.entries( params ).map( ( [ key, value ] ) => [ key, String( value ) ] )
			).toString();
			const to = `/post/${ postId }${ query ? `?${ query }` : '' }`;

			// Outside a browser (SSR, bare test environments) the SPA path is
			// still a usable href.
			if ( typeof window === 'undefined' ) {
				return to;
			}

			const browserParams = new URLSearchParams( window.location.search );
			browserParams.set( 'p', to );

			return `${ window.location.pathname }?${ browserParams.toString() }`;
		},
		[ search ]
	);
}
