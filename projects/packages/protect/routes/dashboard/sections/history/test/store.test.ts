import apiFetch from '@wordpress/api-fetch';
import { loadHistory } from '../store';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'loadHistory', () => {
	it( 'fetches again after the running request when a refresh is asked for mid-request', async () => {
		const responses: ( ( threats: unknown[] ) => void )[] = [];
		mockApiFetch.mockImplementation( () => new Promise( resolve => responses.push( resolve ) ) );

		const flush = () => new Promise( resolve => setTimeout( resolve, 0 ) );
		let refreshed = false;
		loadHistory();
		loadHistory( true ).then( () => ( refreshed = true ) );

		responses[ 0 ]( [] );
		await flush();
		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		expect( refreshed ).toBe( false );

		responses[ 1 ]( [] );
		await flush();
		expect( refreshed ).toBe( true );
	} );
} );
