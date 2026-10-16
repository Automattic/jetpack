/**
 * External dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { productImagesQuery } from '../../queries/product-images-query';
import { useProductImages } from '../use-product-images';
import type { ReportParams } from '../../utils/types';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );
jest.mock( '../../queries/product-images-query', () => ( {
	productImagesQuery: jest.fn( ( ids: number[] ) => ( { queryKey: [ 'images', ids ] } ) ),
} ) );

const mockUseReport = useReport as jest.Mock;
const mockImagesQuery = productImagesQuery as jest.Mock;

const PERIOD = { from: '2026-06-01', to: '2026-06-07', interval: 'day' };
const COMPARED: ReportParams = { ...PERIOD, compare_from: '2026-05-25', compare_to: '2026-05-31' };

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'useProductImages', () => {
	it( 'asks the images once, for the selected period, and parks the comparison slot', () => {
		useProductImages( [ 7, 9 ], COMPARED );
		const factory = mockUseReport.mock.calls.at( -1 )[ 0 ];

		expect( factory( PERIOD, 'primary' ) ).toEqual( { queryKey: [ 'images', [ 7, 9 ] ] } );
		expect( factory( PERIOD, 'comparison' ) ).toMatchObject( { enabled: false } );
		expect( mockImagesQuery ).toHaveBeenCalledTimes( 1 );
	} );
} );
