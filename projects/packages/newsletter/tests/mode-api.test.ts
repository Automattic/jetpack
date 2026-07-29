const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

import { updateNewsletterMode } from '../src/settings/mode-api';

describe( 'Newsletter Mode API', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'posts the requested enabled state to the package-owned route', async () => {
		mockApiFetch.mockResolvedValue( { enabled: true } );

		await expect( updateNewsletterMode( true ) ).resolves.toBe( true );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-newsletter/v1/mode',
			method: 'POST',
			data: { enabled: true },
		} );
	} );

	it( 'returns false when the response does not report an enabled state', async () => {
		mockApiFetch.mockResolvedValue( {} );

		await expect( updateNewsletterMode( false ) ).resolves.toBe( false );
	} );
} );
