/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

type FetchHandler = ( options: {
	path?: string;
	method?: string;
	data?: unknown;
	parse?: boolean;
	headers?: Record< string, string >;
} ) => Promise< unknown > | unknown;

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mocked = apiFetch as jest.MockedFunction< typeof apiFetch >;

/**
 * Reset the apiFetch mock and install a new handler for the current test.
 *
 * @param handler - A function that receives the apiFetch options object and
 *                returns the desired response (or throws to simulate errors).
 * @return The jest mock function for further assertions.
 */
export function mockApiFetch( handler: FetchHandler ): jest.MockedFunction< typeof apiFetch > {
	mocked.mockReset();
	mocked.mockImplementation( handler as never );
	return mocked;
}

/**
 * Return the jest mock function for `@wordpress/api-fetch` so tests can
 * inspect calls without installing a new handler.
 *
 * @return The current jest mock for apiFetch.
 */
export function getApiFetchMock(): jest.MockedFunction< typeof apiFetch > {
	return mocked;
}
