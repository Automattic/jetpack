import apiFetch from '@wordpress/api-fetch';
import { getScan, resetScan } from '../../scan/store';
import { loadHistory, resetHistory } from '../store';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const threat = ( id: number, status: string ) => ( { id, status, title: `Threat ${ id }` } );

describe( 'loadHistory', () => {
	afterEach( () => {
		delete window.jetpackProtectDashboard;
		resetScan();
		resetHistory();
	} );

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

	it.each( [
		[ 'fills the ignored list on a first load', { threats: [] }, [ 4, 5, 6 ] ],
		[
			'adds threats history ignored to the client-held list, skipping ones the client moved',
			{ threats: [ threat( 6, 'current' ) ], ignored: [ threat( 5, 'ignored' ) ] },
			[ 5, 4 ],
		],
	] )( '%s', async ( _name, scan, expected ) => {
		window.jetpackProtectDashboard = { scan };
		mockApiFetch.mockResolvedValue( [
			...[ 4, 5, 6 ].map( id => threat( id, 'ignored' ) ),
			threat( 7, 'fixed' ),
		] );

		await loadHistory( true );

		expect( getScan()?.ignored?.map( item => item.id ) ).toEqual( expected );
	} );
} );
