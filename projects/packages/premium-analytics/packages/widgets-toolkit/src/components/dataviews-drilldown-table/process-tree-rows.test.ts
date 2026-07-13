import { processTreeRows } from './process-tree-rows';
import type { Field, View } from '@wordpress/dataviews';

type Row = {
	id: string;
	parentId?: string;
	referrer: string;
	category: string;
	medium: string;
	views: number;
};

const rows: Row[] = [
	{
		id: 'search',
		referrer: 'Search Engines',
		category: 'channel',
		medium: 'channel',
		views: 625,
	},
	{
		id: 'google',
		parentId: 'search',
		referrer: 'Google',
		category: 'search',
		medium: 'organic',
		views: 485,
	},
	{
		id: 'bing',
		parentId: 'search',
		referrer: 'Bing',
		category: 'search',
		medium: 'organic',
		views: 86,
	},
	{
		id: 'duckduckgo',
		parentId: 'search',
		referrer: 'DuckDuckGo',
		category: 'search',
		medium: 'organic',
		views: 39,
	},
	{
		id: 'yahoo',
		parentId: 'search',
		referrer: 'Yahoo',
		category: 'search',
		medium: 'organic',
		views: 14,
	},
	{
		id: 'social',
		referrer: 'Social',
		category: 'channel',
		medium: 'social',
		views: 345,
	},
	{
		id: 'facebook',
		parentId: 'social',
		referrer: 'Facebook',
		category: 'social network',
		medium: 'social',
		views: 210,
	},
	{
		id: 'linkedin',
		parentId: 'social',
		referrer: 'LinkedIn',
		category: 'social network',
		medium: 'social',
		views: 58,
	},
	{
		id: 'direct',
		referrer: 'Direct',
		category: 'channel',
		medium: 'direct',
		views: 251,
	},
];

const fields: Field< Row >[] = [
	{
		id: 'referrer',
		label: 'Referrer',
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.referrer,
	},
	{
		id: 'views',
		label: 'Views',
		getValue: ( { item } ) => item.views,
	},
	{
		id: 'category',
		label: 'Category',
		getValue: ( { item } ) => item.category,
	},
	{
		id: 'medium',
		label: 'Medium',
		getValue: ( { item } ) => item.medium,
		filterBy: { operators: [ 'isAny' ] },
	},
];

/**
 * Build a DataViews table view for processor tests.
 *
 * @param overrides - View fields to override.
 * @return The DataViews view.
 */
function view( overrides: Partial< View > = {} ): View {
	return {
		type: 'table',
		page: 1,
		perPage: 10,
		search: '',
		sort: { field: 'views', direction: 'desc' },
		fields: [ 'referrer', 'views' ],
		...overrides,
	} as View;
}

/**
 * Process rows with common accessors.
 *
 * @param dataRows    - Rows to process.
 * @param overrides   - View fields to override.
 * @param expandedIds - Expanded parent row ids.
 * @param fieldConfig - Field config to use for processing.
 * @return The processor result.
 */
function process(
	dataRows: Row[],
	overrides: Partial< View > = {},
	expandedIds: string[] = [],
	fieldConfig: Field< Row >[] = fields
) {
	return processTreeRows( dataRows, view( overrides ), new Set( expandedIds ), {
		getItemId: item => item.id,
		getItemParentId: item => item.parentId,
		fields: fieldConfig,
	} );
}

/**
 * Process the fixture rows and return the visible row ids.
 *
 * @param overrides   - View fields to override.
 * @param expandedIds - Expanded parent row ids.
 * @param fieldConfig - Field config to use for processing.
 * @return The processed row ids.
 */
function getProcessedIds(
	overrides: Partial< View > = {},
	expandedIds: string[] = [],
	fieldConfig: Field< Row >[] = fields
): string[] {
	return process( rows, overrides, expandedIds, fieldConfig ).data.map( row => row.id );
}

describe( 'processTreeRows', () => {
	it( 'hides children of collapsed parents but counts every row for pagination', () => {
		const result = process( rows );

		expect( result.data.map( row => row.id ) ).toEqual( [ 'search', 'social', 'direct' ] );
		expect( result.paginationInfo ).toEqual( { totalItems: 9, totalPages: 1 } );
	} );

	it( 'splices expanded children directly after their parent', () => {
		expect( getProcessedIds( {}, [ 'social' ] ) ).toEqual( [
			'search',
			'social',
			'facebook',
			'linkedin',
			'direct',
		] );
	} );

	it( 'sorts parents and children by number field descending', () => {
		expect(
			getProcessedIds( { sort: { field: 'views', direction: 'desc' } }, [ 'search' ] )
		).toEqual( [ 'search', 'google', 'bing', 'duckduckgo', 'yahoo', 'social', 'direct' ] );
	} );

	it( 'sorts parents and children by number field ascending', () => {
		expect(
			getProcessedIds( { sort: { field: 'views', direction: 'asc' } }, [ 'search' ] )
		).toEqual( [ 'direct', 'social', 'search', 'yahoo', 'duckduckgo', 'bing', 'google' ] );
	} );

	it( 'sorts parents and children by string field', () => {
		expect(
			getProcessedIds( { sort: { field: 'referrer', direction: 'asc' } }, [ 'search' ] )
		).toEqual( [ 'direct', 'search', 'bing', 'duckduckgo', 'google', 'yahoo', 'social' ] );
	} );

	it( 'shows a matching child as a root when its parent is filtered out by search', () => {
		const result = process( rows, { search: 'duck' } );

		expect( result.data.map( row => row.id ) ).toEqual( [ 'duckduckgo' ] );
		expect( result.rows[ 0 ].depth ).toBe( 0 );
		expect( result.paginationInfo ).toEqual( { totalItems: 1, totalPages: 1 } );
	} );

	it( 'keeps a parent-only search match without its non-matching children', () => {
		expect( getProcessedIds( { search: 'search engines' } ) ).toEqual( [ 'search' ] );
		expect( getProcessedIds( { search: 'search engines' }, [ 'search' ] ) ).toEqual( [ 'search' ] );
	} );

	it( 'shows matching children as roots for isAny filters that exclude the parent', () => {
		const result = process( rows, {
			filters: [ { field: 'medium', operator: 'isAny', value: [ 'organic' ] } ],
		} );

		expect( result.data.map( row => row.id ) ).toEqual( [
			'google',
			'bing',
			'duckduckgo',
			'yahoo',
		] );
		expect( result.rows.every( row => row.depth === 0 ) ).toBe( true );
		expect( result.paginationInfo ).toEqual( { totalItems: 4, totalPages: 1 } );
	} );

	it( 'keeps the tree for filters matching parents and children alike', () => {
		const filterView: Partial< View > = {
			filters: [ { field: 'medium', operator: 'isAny', value: [ 'social' ] } ],
		};

		expect( getProcessedIds( filterView ) ).toEqual( [ 'social' ] );
		expect( getProcessedIds( filterView, [ 'social' ] ) ).toEqual( [
			'social',
			'facebook',
			'linkedin',
		] );
	} );

	it( 'paginates the flat row list, with children counting as items', () => {
		const collapsed = process( rows, { page: 1, perPage: 2 } );

		// Page 1 of the flat descending sort is [search, google]; google is
		// hidden under the collapsed search parent but still counted.
		expect( collapsed.data.map( row => row.id ) ).toEqual( [ 'search' ] );
		expect( collapsed.paginationInfo ).toEqual( { totalItems: 9, totalPages: 5 } );

		const expanded = process( rows, { page: 1, perPage: 2 }, [ 'search' ] );

		expect( expanded.data.map( row => row.id ) ).toEqual( [ 'search', 'google' ] );
	} );

	it( 'supports nested parents and resolves depth and child counts', () => {
		const nestedRows: Row[] = [
			{ id: 'a', referrer: 'A', category: 'x', medium: 'x', views: 30 },
			{ id: 'b', parentId: 'a', referrer: 'B', category: 'x', medium: 'x', views: 20 },
			{ id: 'c', parentId: 'b', referrer: 'C', category: 'x', medium: 'x', views: 10 },
		];

		expect( process( nestedRows ).data.map( row => row.id ) ).toEqual( [ 'a' ] );
		expect( process( nestedRows, {}, [ 'a' ] ).data.map( row => row.id ) ).toEqual( [ 'a', 'b' ] );

		const fullyExpanded = process( nestedRows, {}, [ 'a', 'b' ] );

		expect( fullyExpanded.data.map( row => row.id ) ).toEqual( [ 'a', 'b', 'c' ] );
		expect( fullyExpanded.rows.map( row => row.depth ) ).toEqual( [ 0, 1, 2 ] );
		expect( fullyExpanded.rows.map( row => row.childCount ) ).toEqual( [ 1, 1, 0 ] );
	} );

	it( 'treats rows with a missing parent as roots', () => {
		const orphanRows: Row[] = [
			{ id: 'a', referrer: 'A', category: 'x', medium: 'x', views: 20 },
			{
				id: 'orphan',
				parentId: 'missing',
				referrer: 'Orphan',
				category: 'x',
				medium: 'x',
				views: 10,
			},
		];
		const result = process( orphanRows );

		expect( result.data.map( row => row.id ) ).toEqual( [ 'a', 'orphan' ] );
		expect( result.rows.map( row => row.depth ) ).toEqual( [ 0, 0 ] );
	} );

	it( 'uses only enableGlobalSearch fields when any are configured', () => {
		expect( getProcessedIds( { search: 'channel' } ) ).toEqual( [] );
		expect( getProcessedIds( { search: 'social' } ) ).toEqual( [ 'social' ] );
	} );

	it( 'matches accented search values with unaccented queries', () => {
		const accentedRows: Row[] = [
			{
				id: 'cafe',
				referrer: 'Café Referrals',
				category: 'channel',
				medium: 'referral',
				views: 20,
			},
		];
		const result = process( accentedRows, { search: 'cafe' } );

		expect( result.data.map( row => row.id ) ).toEqual( [ 'cafe' ] );
	} );

	it( 'preserves parent input order when no sort is set', () => {
		expect( getProcessedIds( { sort: undefined } ) ).toEqual( [ 'search', 'social', 'direct' ] );
	} );
} );
