import { act, renderHook } from '@testing-library/react';
import restApi from '../../../../../../js-packages/api';
import useStartFresh from '../../../../../../js-packages/idc/hooks/use-start-fresh';
import navigate from '../../../../../../js-packages/idc/tools/navigate';
import trackAndBumpMCStats from '../../../../../../js-packages/idc/tools/tracking';

let mockIsBusy = false;
const mockSetIsActionInProgress = jest.fn();
const mockClearErrorType = jest.fn();
const mockSetErrorType = jest.fn();

jest.mock( '../../../../../../js-packages/api', () => ( { startIDCFresh: jest.fn() } ) );
jest.mock( '@wordpress/data', () => ( {
	useSelect: () => mockIsBusy,
	useDispatch: () => ( {
		setIsActionInProgress: mockSetIsActionInProgress,
		clearErrorType: mockClearErrorType,
		setErrorType: mockSetErrorType,
	} ),
} ) );
jest.mock( '../../../../../../js-packages/idc/state/store', () => ( { STORE_ID: 'test-idc' } ) );
jest.mock( '../../../../../../js-packages/idc/tools/navigate', () => jest.fn() );
jest.mock( '../../../../../../js-packages/idc/tools/tracking', () => jest.fn() );

describe( 'legacy Safe Mode fresh connection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsBusy = false;
	} );

	it.each( [
		[ undefined, 'idc-notice' ],
		[ '', 'idc-notice' ],
		[ 'woocommerce-payments', 'woocommerce-payments' ],
	] )( 'keeps one authorization source for %s', async ( from, expected ) => {
		restApi.startIDCFresh.mockResolvedValue(
			'https://example.org/authorize?client_id=42&from=old-source&skip_pricing=true&scope=administrator%3Asignature%2Bvalue%2F%3D&redirect_uri=https%3A%2F%2Fexample.org%2Fshop%2Fwp-admin%2Fadmin.php%3Fredirect%3D%252Fwoo-ads#finish'
		);
		const { result } = renderHook( () => useStartFresh( '/shop/plugins.php', from ) );
		await act( async () => result.current.startFreshCallback() );

		expect( restApi.startIDCFresh ).toHaveBeenCalledWith( '/shop/plugins.php', from );
		expect( navigate ).toHaveBeenCalledTimes( 1 );
		const url = new URL( navigate.mock.calls[ 0 ][ 0 ] );
		expect( url.searchParams.getAll( 'from' ) ).toEqual( [ expected ] );
		expect( url.searchParams.get( 'client_id' ) ).toBe( '42' );
		expect( url.searchParams.get( 'skip_pricing' ) ).toBe( 'true' );
		expect( url.searchParams.get( 'scope' ) ).toBe( 'administrator:signature+value/=' );
		expect( url.searchParams.get( 'redirect_uri' ) ).toBe(
			'https://example.org/shop/wp-admin/admin.php?redirect=%2Fwoo-ads'
		);
		expect( url.hash ).toBe( '#finish' );
		expect( trackAndBumpMCStats ).toHaveBeenCalledWith( 'start_fresh' );
		expect( mockSetIsActionInProgress ).toHaveBeenCalledWith( true );
		expect( mockClearErrorType ).toHaveBeenCalledTimes( 1 );
		expect( result.current.isStartingFresh ).toBe( true );
	} );

	it( 'uses a changed source after the host rerenders', async () => {
		restApi.startIDCFresh.mockResolvedValue( 'https://example.org/authorize' );
		const { result, rerender } = renderHook( ( { from } ) => useStartFresh( '/', from ), {
			initialProps: { from: undefined },
		} );
		rerender( { from: 'woocommerce-payments' } );
		await act( async () => result.current.startFreshCallback() );
		expect( restApi.startIDCFresh ).toHaveBeenCalledWith( '/', 'woocommerce-payments' );
		expect( new URL( navigate.mock.calls[ 0 ][ 0 ] ).searchParams.get( 'from' ) ).toBe(
			'woocommerce-payments'
		);
	} );

	it( 'does not start another action while busy', () => {
		mockIsBusy = true;
		const { result } = renderHook( () => useStartFresh( '/', 'woocommerce-payments' ) );
		act( () => result.current.startFreshCallback() );
		expect( restApi.startIDCFresh ).not.toHaveBeenCalled();
		expect( navigate ).not.toHaveBeenCalled();
		expect( trackAndBumpMCStats ).not.toHaveBeenCalled();
	} );
} );
