/**
 * Jest-mocked `apiClient` that defers to the in-memory state in `handlers.ts`.
 *
 * Usage (matches the conventions doc §11 — mock at the apiFetch/apiClient
 * boundary):
 *
 *   jest.mock( '@/lib/api-client', () =>
 *     jest.requireActual( '../../tests/js/mocks/api-client' )
 *   );
 *
 * Failure paths override per-call:
 *
 *   ( apiClient.get as jest.Mock ).mockRejectedValueOnce( {
 *     code: 'akismet_unavailable', message: 'down', data: { status: 503 },
 *   } );
 *
 * `mockClear()` runs between tests via `tests/js/setup.ts` so the call history
 * is reset alongside the state store.
 */

import { getMockState, setMockState } from './handlers';
import type { WpError } from '../../../src/lib/api-client';
import type { AkismetSettings } from '../../../src/lib/types';

/**
 *
 * @param path
 */
function notFound( path: string ): WpError {
	return {
		code: 'rest_no_route',
		message: `Unhandled mock endpoint: ${ path }`,
		data: { status: 404 },
	};
}

/**
 *
 * @param code
 * @param message
 */
function badRequest( code: string, message: string ): WpError {
	return { code, message, data: { status: 400 } };
}

/**
 *
 * @param endpoint
 */
async function fakeGet< T >( endpoint: string ): Promise< T > {
	const state = getMockState();
	switch ( endpoint ) {
		case 'key':
			return { key: state.key, valid: state.keyValid } as unknown as T;
		case 'settings':
			return state.settings as unknown as T;
		case 'jetpack-key':
			// Default: Jetpack not active. Tests override per-call when they
			// need a different shape.
			throw {
				code: 'no_jetpack',
				message: 'Jetpack is not active.',
				data: { status: 400 },
			} satisfies WpError;
		default:
			throw notFound( endpoint );
	}
}

/**
 *
 * @param endpoint
 * @param body
 */
async function fakePost< T >(
	endpoint: string,
	body: Record< string, unknown > | undefined
): Promise< T > {
	if ( endpoint === 'key' ) {
		const key = String( body?.key ?? '' );
		if ( key.length < 6 ) {
			throw badRequest( 'akismet_invalid_key', 'Invalid key.' );
		}
		setMockState( { key, keyValid: true } );
		return { key, valid: true } as unknown as T;
	}
	throw notFound( endpoint );
}

/**
 *
 * @param endpoint
 * @param body
 */
async function fakePut< T >(
	endpoint: string,
	body: Record< string, unknown > | undefined
): Promise< T > {
	if ( endpoint === 'settings' ) {
		const patch = ( body ?? {} ) as Partial< AkismetSettings >;
		const next = { ...getMockState().settings, ...patch };
		setMockState( { settings: next } );
		return next as unknown as T;
	}
	throw notFound( endpoint );
}

/**
 *
 * @param endpoint
 */
async function fakeDelete< T >( endpoint: string ): Promise< T > {
	if ( endpoint === 'key' ) {
		setMockState( { key: '', keyValid: false } );
		return { success: true } as unknown as T;
	}
	throw notFound( endpoint );
}

export const apiClient = {
	get: jest.fn( fakeGet ) as jest.MockedFunction< typeof fakeGet > & {
		< T = unknown >( endpoint: string ): Promise< T >;
	},
	post: jest.fn( fakePost ) as jest.MockedFunction< typeof fakePost > & {
		< T = unknown >( endpoint: string, data?: Record< string, unknown > ): Promise< T >;
	},
	put: jest.fn( fakePut ) as jest.MockedFunction< typeof fakePut > & {
		< T = unknown >( endpoint: string, data?: Record< string, unknown > ): Promise< T >;
	},
	delete: jest.fn( fakeDelete ) as jest.MockedFunction< typeof fakeDelete > & {
		< T = unknown >( endpoint: string ): Promise< T >;
	},
};

export type { WpError };
export type { ApiKeyState, AkismetSettings } from '../../../src/lib/types';

/**
 * Reset all fake fn call history. Called from `tests/js/setup.ts`.
 *
 * The default fake implementations are reinstated after the clear so tests
 * that don't override get the state-aware defaults.
 */
export function __resetApiClientMocks(): void {
	apiClient.get.mockReset();
	apiClient.get.mockImplementation( fakeGet );
	apiClient.post.mockReset();
	apiClient.post.mockImplementation( fakePost );
	apiClient.put.mockReset();
	apiClient.put.mockImplementation( fakePut );
	apiClient.delete.mockReset();
	apiClient.delete.mockImplementation( fakeDelete );
}
