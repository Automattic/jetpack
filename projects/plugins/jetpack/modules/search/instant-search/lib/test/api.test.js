/**
 * @jest-environment jsdom
 */
/**
 * Internal dependencies
 */
import { generateDateRangeFilter, mergeCachedAggregations } from '../api';

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

describe( 'mergeCachedAggregations', () => {
	test( 'merge new aggregations to the cache and set doc_count to zero', () => {
		expect(
			mergeCachedAggregations(
				{
					date_histogram_2: {
						buckets: [
							{
								key_as_string: '2009-01-01 00:00:00',
								key: 1230768000000,
								doc_count: 0,
							},
						],
					},
					taxonomy_0: {
						doc_count_error_upper_bound: 0,
						sum_other_doc_count: 0,
						buckets: [
							{
								key: 'others/Others',
								doc_count: 0,
							},
						],
					},
				},
				{
					date_histogram_2: {
						buckets: [
							{
								key_as_string: '2010-01-01 00:00:00',
								key: 1262304000000,
								doc_count: 1,
							},
						],
					},
				}
			)
		).toEqual( {
			// keys with same name would be overridden.
			date_histogram_2: {
				buckets: [
					{
						key_as_string: '2010-01-01 00:00:00',
						key: 1262304000000,
						doc_count: 0, // doc_count set to zero.
					},
				],
			},
			// keys only from the old object is retained.
			taxonomy_0: {
				doc_count_error_upper_bound: 0,
				sum_other_doc_count: 0,
				buckets: [
					{
						key: 'others/Others',
						doc_count: 0,
					},
				],
			},
		} );
	} );
} );
