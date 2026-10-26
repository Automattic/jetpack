/**
 * External dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { productDetailsQuery } from '../../queries/product-details-query';
import { useProductDetails } from '../use-product-details';
import type { ReportParams } from '../../utils/types';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );
jest.mock( '../../queries/product-details-query', () => ( {
	productDetailsQuery: jest.fn( ( ids: number[] ) => ( { queryKey: [ 'details', ids ] } ) ),
} ) );

const mockUseReport = useReport as jest.Mock;
const mockDetailsQuery = productDetailsQuery as jest.Mock;

const PERIOD = { from: '2026-06-01', to: '2026-06-07', interval: 'day' };
const COMPARED: ReportParams = { ...PERIOD, compare_from: '2026-05-25', compare_to: '2026-05-31' };

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'useProductDetails', () => {
	it( 'asks the product details once, for the selected period, and parks the comparison slot', () => {
		useProductDetails( [ 7, 9 ], COMPARED );
		const factory = mockUseReport.mock.calls.at( -1 )[ 0 ];

		expect( factory( PERIOD, 'primary' ) ).toEqual( { queryKey: [ 'details', [ 7, 9 ] ] } );
		expect( factory( PERIOD, 'comparison' ) ).toMatchObject( { enabled: false } );
		expect( mockDetailsQuery ).toHaveBeenCalledTimes( 1 );
		expect( mockUseReport.mock.calls.at( -1 )[ 2 ] ).toMatchObject( { refreshNotice: false } );
	} );
} );
