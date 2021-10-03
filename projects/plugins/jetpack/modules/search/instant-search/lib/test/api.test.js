/**
 * @jest-environment jsdom
 */
/**
 * Internal dependencies
 */
import { generateDateRangeFilter, setAggregationCountToZero } from '../api';

describe( 'generateDateRangeFilter', () => {
	test( 'generates correct ranges for yearly date ranges', () => {
		expect( generateDateRangeFilter( 'something', '2020-01-01 00:00:00', 'year' ) ).toEqual( {
			range: { [ 'something' ]: { gte: '2020-01-01', lt: '2021-01-01' } },
		} );
	} );
	test( 'generates correct ranges for monthly date ranges', () => {
		// Note that the next month value has been left padded; it's "02" instead of "2".
		expect( generateDateRangeFilter( 'something', '2020-01-01 00:00:00', 'month' ) ).toEqual( {
			range: { [ 'something' ]: { gte: '2020-01-01', lt: '2020-02-01' } },
		} );
		// Note that the LT value is in 2021.
		expect( generateDateRangeFilter( 'something', '2020-12-01 00:00:00', 'month' ) ).toEqual( {
			range: { [ 'something' ]: { gte: '2020-12-01', lt: '2021-01-01' } },
		} );
	} );
} );

describe( 'setAggregationCountToZero', () => {
	test( 'Can set doc_count of every new aggregation to 0', () => {
		expect(
			setAggregationCountToZero( {
				date_histogram_2: {
					buckets: [
						{
							doc_count: 10,
						},
					],
				},
			} )
		).toEqual( {
			date_histogram_2: {
				buckets: [
					{
						doc_count: 0,
					},
				],
			},
		} );
	} );

	test( 'Can deal with in empty parameter and return an object', () => {
		expect( setAggregationCountToZero( null ) ).toEqual( {} );
		expect( setAggregationCountToZero( undefined ) ).toEqual( {} );
		expect( setAggregationCountToZero( {} ) ).toEqual( {} );
	} );
} );
