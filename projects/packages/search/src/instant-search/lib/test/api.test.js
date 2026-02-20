import { buildFilterAggregations, generateDateRangeFilter, setDocumentCountsToZero } from '../api';

describe( 'buildFilterAggregations', () => {
	test( 'generates aggregations for product_attribute filters', () => {
		const widgets = [
			{
				filters: [
					{
						type: 'product_attribute',
						attribute: 'pa_color',
						count: 10,
						filter_id: 'product_attribute_color',
					},
				],
			},
		];
		expect( buildFilterAggregations( widgets ) ).toEqual( {
			product_attribute_color: {
				terms: {
					field: 'taxonomy.pa_color.slug_slash_name',
					size: 10,
				},
			},
		} );
	} );

	test( 'generates aggregations for multiple product_attribute filters', () => {
		const widgets = [
			{
				filters: [
					{
						type: 'product_attribute',
						attribute: 'pa_color',
						count: 10,
						filter_id: 'product_attribute_color',
					},
					{
						type: 'product_attribute',
						attribute: 'pa_size',
						count: 5,
						filter_id: 'product_attribute_size',
					},
				],
			},
		];
		expect( buildFilterAggregations( widgets ) ).toEqual( {
			product_attribute_color: {
				terms: {
					field: 'taxonomy.pa_color.slug_slash_name',
					size: 10,
				},
			},
			product_attribute_size: {
				terms: {
					field: 'taxonomy.pa_size.slug_slash_name',
					size: 5,
				},
			},
		} );
	} );

	test( 'generates aggregations for mixed filter types including product_attribute', () => {
		const widgets = [
			{
				filters: [
					{
						type: 'taxonomy',
						taxonomy: 'category',
						count: 5,
						filter_id: 'category_filter',
					},
					{
						type: 'product_attribute',
						attribute: 'pa_color',
						count: 10,
						filter_id: 'product_attribute_color',
					},
				],
			},
		];
		const result = buildFilterAggregations( widgets );
		expect( result ).toHaveProperty( 'category_filter' );
		expect( result ).toHaveProperty( 'product_attribute_color' );
		expect( result.product_attribute_color ).toEqual( {
			terms: {
				field: 'taxonomy.pa_color.slug_slash_name',
				size: 10,
			},
		} );
	} );
} );

describe( 'generateDateRangeFilter', () => {
	test( 'generates correct ranges for yearly date ranges', () => {
		expect( generateDateRangeFilter( 'something', '2020-01-01 00:00:00', 'year' ) ).toEqual( {
			range: { something: { gte: '2020-01-01', lt: '2021-01-01' } },
		} );
	} );
	test( 'generates correct ranges for monthly date ranges', () => {
		// Note that the next month value has been left padded; it's "02" instead of "2".
		expect( generateDateRangeFilter( 'something', '2020-01-01 00:00:00', 'month' ) ).toEqual( {
			range: { something: { gte: '2020-01-01', lt: '2020-02-01' } },
		} );
		// Note that the LT value is in 2021.
		expect( generateDateRangeFilter( 'something', '2020-12-01 00:00:00', 'month' ) ).toEqual( {
			range: { something: { gte: '2020-12-01', lt: '2021-01-01' } },
		} );
	} );
} );

describe( 'setDocumentCountsToZero', () => {
	test( 'Can set doc_count of every new aggregation to 0', () => {
		expect(
			setDocumentCountsToZero( {
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
		expect( setDocumentCountsToZero( null ) ).toEqual( {} );
		expect( setDocumentCountsToZero( undefined ) ).toEqual( {} );
		expect( setDocumentCountsToZero( {} ) ).toEqual( {} );
	} );
} );
