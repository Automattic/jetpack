/**
 * URL parameter utilities for the responses routes.
 * These utilities handle URL parsing in both standard Jetpack and external admin contexts.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * View parameter extracted from URL pathname.
 */
const VIEW_PATTERN = /(?:\/responses\/|\/marketing\/forms\/|\/forms\/)([^/?#]+)/;

/**
 * Parse URL to get the effective pathname.
 * In external admin contexts, the pathname may be embedded in the ?p= parameter.
 *
 * @return The effective pathname.
 */
function getEffectivePathname(): string {
	const url = new URL( window.location.href );
	return url.searchParams.get( 'p' ) || url.pathname;
}

/**
 * Extract the view parameter from a pathname.
 *
 * @param pathname - The pathname to extract from.
 * @return The view parameter or 'inbox' as default.
 */
function extractViewFromPathname( pathname: string ): string {
	const match = pathname.match( VIEW_PATTERN );
	return match?.[ 1 ] || 'inbox';
}

/**
 * Extract the view parameter from the current URL.
 * Works in both standard Jetpack and external admin contexts.
 *
 * @return The current view parameter.
 */
export function useViewParam(): string {
	const [ view, setView ] = useState( () => extractViewFromPathname( getEffectivePathname() ) );

	useEffect( () => {
		/**
		 * Updates view state when URL changes via browser navigation.
		 */
		function handleUrlChange() {
			setView( extractViewFromPathname( getEffectivePathname() ) );
		}

		window.addEventListener( 'popstate', handleUrlChange );
		return () => window.removeEventListener( 'popstate', handleUrlChange );
	}, [] );

	return view;
}

export type SearchParamsResult = {
	responseIds?: string[];
	search?: string;
};

/**
 * Convert a view parameter to the corresponding post status.
 *
 * @param view - The view parameter (inbox, spam, or trash).
 * @return The corresponding post status.
 */
export function viewToStatus( view: string ): string {
	if ( view === 'spam' ) {
		return 'spam';
	}
	if ( view === 'trash' ) {
		return 'trash';
	}
	return 'publish';
}

/**
 * Parse responseIds from raw values, handling JSON-encoded arrays.
 * TanStack Router may encode array values as JSON strings like '["61416"]'.
 *
 * @param rawIds - Raw responseIds values from URL.
 * @return Parsed array of ID strings.
 */
function parseResponseIds( rawIds: string[] ): string[] {
	const result: string[] = [];

	for ( const raw of rawIds ) {
		if ( raw.startsWith( '[' ) ) {
			try {
				const parsed = JSON.parse( raw );
				if ( Array.isArray( parsed ) ) {
					result.push( ...parsed.map( String ) );
					continue;
				}
			} catch {
				// Not valid JSON, treat as regular value
			}
		}
		result.push( raw );
	}

	return result;
}

/**
 * Parse search parameters from the URL.
 * In external admin contexts, params may be embedded inside the ?p= value.
 *
 * @return Object with responseIds and search parameters.
 */
function parseSearchParams(): SearchParamsResult {
	const url = new URL( window.location.href );

	let rawResponseIds = url.searchParams.getAll( 'responseIds' );
	let search = url.searchParams.get( 'search' ) || undefined;

	// If not found in direct params, check inside the p parameter (external admin context)
	if ( rawResponseIds.length === 0 ) {
		const pValue = url.searchParams.get( 'p' );
		if ( pValue && pValue.includes( '?' ) ) {
			const pUrl = new URL( pValue, window.location.origin );
			rawResponseIds = pUrl.searchParams.getAll( 'responseIds' );
			if ( ! search ) {
				search = pUrl.searchParams.get( 'search' ) || undefined;
			}
		}
	}

	const responseIds = parseResponseIds( rawResponseIds );

	return {
		responseIds: responseIds.length > 0 ? responseIds : undefined,
		search,
	};
}

/**
 * Extract search parameters from the URL.
 * Works in both standard Jetpack and external admin contexts.
 * Updates automatically on browser navigation.
 *
 * @return Object with responseIds and search parameters.
 */
export function useSearchParams(): SearchParamsResult {
	const [ searchState, setSearchState ] = useState( parseSearchParams );

	useEffect( () => {
		/**
		 * Updates search params state when URL changes via browser navigation.
		 */
		function handleUrlChange() {
			setSearchState( parseSearchParams() );
		}

		window.addEventListener( 'popstate', handleUrlChange );
		return () => window.removeEventListener( 'popstate', handleUrlChange );
	}, [] );

	return searchState;
}
