import { useEffect, useState, useCallback } from 'react';

/**
 * Extract the pathname from the hash (without search params)
 * @param hash - The hash string (without the leading #)
 * @return The pathname portion
 */
function getPathnameFromHash( hash: string ): string {
	// If hash is completely empty, return '/'
	if ( ! hash ) {
		return '/';
	}
	// Otherwise, extract pathname (may be empty string if hash starts with '?')
	const [ pathname ] = hash.split( '?' );
	return pathname;
}

/**
 * Extract search params from the hash
 * @param hash - The hash string (without the leading #)
 * @return URLSearchParams object
 */
function getSearchParamsFromHash( hash: string ): URLSearchParams {
	const [ , search ] = hash.split( '?' );
	return new URLSearchParams( search || '' );
}

/**
 * Custom hook to get the current hash-based pathname
 * @return Object with pathname property
 */
export function useLocation() {
	const [ pathname, setPathname ] = useState( () => {
		const hash = window.location.hash.slice( 1 ); // Remove the '#'
		return getPathnameFromHash( hash );
	} );

	useEffect( () => {
		const handleHashChange = () => {
			const hash = window.location.hash.slice( 1 );
			setPathname( getPathnameFromHash( hash ) );
		};

		window.addEventListener( 'hashchange', handleHashChange );
		return () => window.removeEventListener( 'hashchange', handleHashChange );
	}, [] );

	return { pathname };
}

/**
 * Custom hook to navigate between routes
 * @return Navigate function
 */
export function useNavigate() {
	return useCallback( ( to: string ) => {
		window.location.hash = to;
	}, [] );
}

/**
 * Custom hook to manage URL search parameters
 * @return Tuple of [searchParams, setSearchParams]
 */
export function useSearchParams(): [
	URLSearchParams,
	(
		params:
			| URLSearchParams
			| Record< string, string | null | undefined >
			| ( ( prev: URLSearchParams ) => URLSearchParams )
	) => void,
] {
	const [ searchParams, setSearchParamsState ] = useState( () => {
		const hash = window.location.hash.slice( 1 );
		return getSearchParamsFromHash( hash );
	} );

	useEffect( () => {
		const handleUrlChange = () => {
			const hash = window.location.hash.slice( 1 );
			setSearchParamsState( getSearchParamsFromHash( hash ) );
		};

		// Listen for hash changes (which may include search params)
		window.addEventListener( 'hashchange', handleUrlChange );
		// Listen for popstate (browser back/forward)
		window.addEventListener( 'popstate', handleUrlChange );

		return () => {
			window.removeEventListener( 'hashchange', handleUrlChange );
			window.removeEventListener( 'popstate', handleUrlChange );
		};
	}, [] );

	const setSearchParams = useCallback(
		(
			params:
				| URLSearchParams
				| Record< string, string | null | undefined >
				| ( ( prev: URLSearchParams ) => URLSearchParams )
		) => {
			// Get current search params
			const currentHash = window.location.hash.slice( 1 );
			const currentParams = getSearchParamsFromHash( currentHash );

			// Handle function form (like setState)
			let newParams: URLSearchParams;
			if ( typeof params === 'function' ) {
				newParams = params( currentParams );
			} else if ( params instanceof URLSearchParams ) {
				newParams = params;
			} else {
				// Plain object form
				newParams = new URLSearchParams( currentParams );
				Object.entries( params ).forEach( ( [ key, value ] ) => {
					if ( value === null || value === undefined ) {
						newParams.delete( key );
					} else {
						newParams.set( key, value );
					}
				} );
			}

			const newSearch = newParams.toString();
			const pathname = getPathnameFromHash( currentHash );
			const newUrl = `${ pathname }${ newSearch ? '?' + newSearch : '' }`;

			window.location.hash = newUrl;
			setSearchParamsState( newParams );
		},
		[]
	);

	return [ searchParams, setSearchParams ];
}

/**
 * Hook to get the current route from hash
 * @return Current route path
 */
export function useHashRoute() {
	const { pathname } = useLocation();
	return pathname;
}
