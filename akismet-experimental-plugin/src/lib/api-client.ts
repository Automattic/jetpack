import apiFetch from '@wordpress/api-fetch';

/**
 * WordPress REST API error envelope.
 *
 * `@wordpress/api-fetch` throws responses matching this shape when the server
 * returns a non-2xx with the standard `WP_REST_Response` error format. Type
 * queries explicitly: `useQuery< TData, WpError >`.
 */
export type WpError = {
	code: string;
	message: string;
	data?: {
		status?: number;
		[ key: string ]: unknown;
	};
};

type Body = Record< string, unknown > | undefined;

/**
 * Resolve a relative endpoint name into the full `/akismet/v1/...` REST path.
 *
 * @param endpoint - Endpoint name, e.g. `key`, `settings`, `stats/30-days`.
 *                 A leading slash is stripped so callers may pass either form.
 * @return Fully qualified REST path.
 */
function buildPath( endpoint: string ): string {
	return `/akismet/v1/${ endpoint.replace( /^\//, '' ) }`;
}

/**
 * Typed wrapper over `@wordpress/api-fetch` for the `akismet/v1` REST namespace.
 *
 * All requests share the WordPress nonce (set by `wp_localize_script` + wired
 * via `apiFetch.createNonceMiddleware` on app boot in `src/index.tsx`). Errors
 * are thrown as `WpError` objects.
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
