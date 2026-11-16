import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { GoogleAnalyticsSettings } from '../google-analytics';

const mockRecordEvent = jest.fn();

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { createErrorNotice: jest.fn(), createSuccessNotice: jest.fn() } ),
} ) );
jest.mock( '../../my-jetpack-tab-panel/features/use-main-features', () => ( {
	QUERY_KEY: [ 'my-jetpack-main-features' ],
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

const mockFetch = apiFetch as unknown as jest.Mock;

const renderPanel = () =>
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<GoogleAnalyticsSettings />
		</QueryClientProvider>
	);

const posts = () => mockFetch.mock.calls.filter( ( [ options ] ) => options.method === 'POST' );

beforeEach( () => {
	jest.clearAllMocks();
	mockFetch.mockImplementation( ( { method, data } ) =>
		Promise.resolve( {
			is_active: true,
			code: 'G-OLD',
			anonymize_ip: false,
			...( method === 'POST' ? data : {} ),
		} )
	);
} );

describe( 'GoogleAnalyticsSettings', () => {
	it( 'saves only a valid Measurement ID, on blur, and never records it', async () => {
		renderPanel();
		const input = await screen.findByRole( 'textbox', { name: 'Google Analytics Measurement ID' } );

		await userEvent.clear( input );
		await userEvent.type( input, 'not-an-id' );
		await userEvent.tab();
		expect( posts() ).toHaveLength( 0 );

		await userEvent.clear( input );
		await userEvent.type( input, 'G-NEW123' );
		await userEvent.tab();

		await waitFor( () => expect( posts() ).toHaveLength( 1 ) );
		expect( posts()[ 0 ][ 0 ].data ).toEqual( { code: 'G-NEW123' } );
		expect( JSON.stringify( mockRecordEvent.mock.calls ) ).not.toContain( 'G-NEW123' );
	} );

	it( 'keeps a switch click made while the ID saves, and saves one at a time', async () => {
		let finishIdSave: () => void = () => undefined;
		mockFetch.mockImplementation( ( { method, data } ) => {
			const stored = { is_active: true, code: 'G-OLD', anonymize_ip: false, ...data };
			if ( method === 'POST' && 'code' in data ) {
				return new Promise( resolve => {
					finishIdSave = () => resolve( stored );
				} );
			}
			return Promise.resolve( stored );
		} );
		renderPanel();
		const input = await screen.findByRole( 'textbox', { name: 'Google Analytics Measurement ID' } );

		await userEvent.clear( input );
		await userEvent.type( input, 'G-NEW123' );
		// The click blurs the field first, which starts the ID save.
		const anonymize = screen.getByRole( 'switch', { name: 'Anonymize IP addresses' } );
		await userEvent.click( anonymize );

		expect( anonymize ).toBeChecked();
		expect( posts().map( ( [ options ] ) => options.data ) ).toEqual( [ { code: 'G-NEW123' } ] );

		finishIdSave();
		await waitFor( () => expect( posts() ).toHaveLength( 2 ) );
		expect( posts()[ 1 ][ 0 ].data ).toEqual( { anonymize_ip: true } );
	} );

	it( 'saves a switch on its own and records it as a settings toggle', async () => {
		renderPanel();

		await userEvent.click(
			await screen.findByRole( 'switch', { name: 'Anonymize IP addresses' } )
		);

		await waitFor( () => expect( posts() ).toHaveLength( 1 ) );
		expect( posts()[ 0 ][ 0 ].data ).toEqual( { anonymize_ip: true } );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_settings_toggle', {
			module: 'google-analytics',
			setting: 'anonymize_ip',
			toggled: 'on',
			origin: 'my-jetpack-settings-panel',
		} );
	} );
} );
