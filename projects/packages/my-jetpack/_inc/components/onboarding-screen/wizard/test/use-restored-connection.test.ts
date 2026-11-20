import { renderHook } from '@testing-library/react';
import { useRestoredConnection } from '../use-restored-connection';

const mockDispatch = {
	setConnectionStatus: jest.fn(),
	setSiteIsRegistering: jest.fn(),
	setUserIsConnecting: jest.fn(),
};

jest.mock( '@automattic/jetpack-connection', () => ( {
	__esModule: true,
	CONNECTION_STORE_ID: 'jetpack-connection',
} ) );

jest.mock( '@wordpress/data', () => ( {
	__esModule: true,
	useDispatch: () => mockDispatch,
} ) );

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

const status = { isRegistered: true, isUserConnected: false, hasConnectedOwner: false };

const loadedBy = ( type: string ) =>
	jest
		.spyOn( window.performance, 'getEntriesByType' )
		.mockReturnValue( [ { type } as unknown as PerformanceEntry ] );

const pageShow = ( persisted: boolean ) =>
	window.dispatchEvent( Object.assign( new Event( 'pageshow' ), { persisted } ) );

// jsdom has no Navigation Timing, so give it the one method the hook reads.
beforeAll( () => {
	window.performance.getEntriesByType = () => [];
} );

beforeEach( () => {
	jest.clearAllMocks();
	mockApiFetch.mockResolvedValue( status );
	loadedBy( 'navigate' );
} );

describe( 'useRestoredConnection', () => {
	it.each( [ 'navigate', 'reload' ] )( 'trusts the page on a %s', type => {
		const onRestore = jest.fn();

		loadedBy( type );
		renderHook( () => useRestoredConnection( onRestore ) );
		pageShow( false );

		expect( onRestore ).not.toHaveBeenCalled();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'Back re-runs the page from the HTTP cache', 'back_forward', false ],
		[ 'Back restores the page from bfcache', 'navigate', true ],
	] )(
		'clears the hand-off and re-reads the connection when %s',
		async ( _name, type, persisted ) => {
			const onRestore = jest.fn();

			loadedBy( type );
			renderHook( () => useRestoredConnection( onRestore ) );
			if ( persisted ) {
				pageShow( true );
			}

			expect( onRestore ).toHaveBeenCalledTimes( 1 );
			expect( mockDispatch.setSiteIsRegistering ).toHaveBeenCalledWith( false );
			expect( mockDispatch.setUserIsConnecting ).toHaveBeenCalledWith( false );
			expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/connection' } );
			await Promise.resolve();
			expect( mockDispatch.setConnectionStatus ).toHaveBeenCalledWith( status );
		}
	);
} );
