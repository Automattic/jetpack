import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { FixerStatus } from '..';

/** Errors thrown by @wordpress/api-fetch. */
export type ApiError = {
	code: 'fetch_error' | 'invalid_json' | 'unknown_error';
	message: string;
};

type APIOptions = {
	/** The WPCOM Site ID. */
	siteId?: number;
	/** The API key to use in requests to the WPCOM API. */
	authToken?: string;
	/** Additional headers to send with requests. */
	authHeaders?: Record< string, string >;
};

/**
 * Jetpack Scan API client.
 *
 * @todo Add response types for all API endpoints.
 */
class API {
	// The API class uses a singleton pattern to support "global" configuration options.
	private static instance: API;

	/** The WPCOM Site ID. */
	public siteId?: APIOptions[ 'siteId' ];

	/** The API key to use in requests to the WPCOM API. */
	public authToken?: APIOptions[ 'authToken' ];

	/** Additional headers to send with requests. */
	public authHeaders?: APIOptions[ 'authHeaders' ];

	/**
	 * Get the static instance of the API client.
	 *
	 * @returns {API} The singleton instance.
	 */
	static getInstance(): API {
		if ( ! API.instance ) {
			API.instance = new API();
		}
		return API.instance;
	}

	/**
	 * Reset the static instance of the API client.
	 *
	 * @returns {void}
	 */
	static destroyInstance(): void {
		API.instance = undefined;
	}

	/**
	 * Initialize the API client.
	 *
	 * @param {APIOptions} options - The options to use to initialize the API client.
	 */
	static initialize( options: APIOptions ) {
		const api = API.getInstance();
		api.siteId = options?.siteId ?? undefined;
		api.authToken = options?.authToken ?? undefined;
		api.authHeaders = options?.authHeaders ?? {};
	}

	/**
	 * Wrapper for @wordpress/api-fetch for interacting with the Jetpack Scan API.
	 *
	 * @param {object} args - The request arguments.
	 * @param {string} args.endpoint - The API endpoint to call i.e. "/wpcom/v2/sites/{siteId}/{endpoint}".
	 * @param {string} args.method - The HTTP method to use.
	 * @param {object} args.params - The query params to send with the request.
	 * @param {object} args.options - Additional options to send with the request.
	 * @param {object} args.options.headers - Additional headers to send with the request.
	 *
	 * @throws {Error} If the API is not initialized with a Site ID.
	 *
	 * @returns {Promise} The response from the Scan API.
	 */
	static fetch( {
		endpoint,
		method = 'GET',
		params = {},
		options = {},
	}: {
		endpoint: string;
		method?: string;
		params?: Record< string, unknown >;
		options?: {
			headers?: Record< string, string >;
		};
	} ): Promise< unknown > {
		const api = API.getInstance();
		const siteId = api.siteId || window.JP_CONNECTION_INITIAL_STATE.siteSuffix;
		if ( ! siteId ) {
			throw new Error( 'API must be initialized with a Site ID.' );
		}

		return apiFetch( {
			endpoint: addQueryArgs( `/wpcom/v2/sites/${ siteId }/${ endpoint }`, params ),
			method: method,
			...options,
			headers: {
				...( api.authToken ? { Authorization: `Bearer ${ api.authToken }` } : {} ),
				...api.authHeaders,
				...options?.headers,
			},
		} );
	}

	static getScan() {
		return API.fetch( { endpoint: 'scan' } );
	}

	static getScanHistory() {
		return API.fetch( { endpoint: 'scan/history' } );
	}

	static enqueueScan() {
		return API.fetch( { endpoint: 'scan/enqueue', method: 'POST' } );
	}

	static getThreatCounts() {
		return API.fetch( { endpoint: 'scan/counts', method: 'GET' } );
	}

	static getFixStatus( threatIds: number[] ) {
		return API.fetch( {
			endpoint: 'alerts/fix',
			method: 'GET',
			params: { threat_ids: threatIds },
		} ) as Promise< {
			threats: Record< number, { status: FixerStatus } >;
		} >;
	}

	static fixThreats( threatIds: Array< number > ) {
		return API.fetch( {
			endpoint: `alerts/fix`,
			method: 'POST',
			params: { threat_ids: threatIds },
		} );
	}

	static fixThreat( threatId: number ) {
		return API.fixThreats( [ threatId ] );
	}

	static ignoreThreat( threatId: number ) {
		return API.fetch( {
			endpoint: `alerts/${ threatId }`,
			method: 'POST',
			params: { ignore: true },
		} );
	}
}

export default API;
