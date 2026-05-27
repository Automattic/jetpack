import apiFetch from '@wordpress/api-fetch';

type Body = Record< string, unknown > | undefined;

/**
 *
 * @param endpoint
 */
function buildPath( endpoint: string ): string {
	return `/akismet/v1/${ endpoint.replace( /^\//, '' ) }`;
}

/**
 * Typed wrapper over `@wordpress/api-fetch` for the `akismet/v1` REST namespace.
 *
 * All requests share the WordPress nonce (set by wp_localize_script) and use
 * fetch under the hood. Endpoint paths are relative to `akismet/v1/`.
 */
export const apiClient = {
	get< T = unknown >( endpoint: string ): Promise< T > {
		return apiFetch< T >( { path: buildPath( endpoint ), method: 'GET' } );
	},
	post< T = unknown >( endpoint: string, data: Body ): Promise< T > {
		return apiFetch< T >( { path: buildPath( endpoint ), method: 'POST', data } );
	},
	put< T = unknown >( endpoint: string, data: Body ): Promise< T > {
		return apiFetch< T >( { path: buildPath( endpoint ), method: 'PUT', data } );
	},
	delete< T = unknown >( endpoint: string ): Promise< T > {
		return apiFetch< T >( { path: buildPath( endpoint ), method: 'DELETE' } );
	},
};
