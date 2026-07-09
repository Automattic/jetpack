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
 * Process the fixture rows with common accessors.
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
	return processTreeRows( rows, view( overrides ), new Set( expandedIds ), {
		getItemId: item => item.id,
		getItemParentId: item => item.parentId,
		fields: fieldConfig,
	} ).data.map( row => row.id );
}

describe( 'processTreeRows', () => {
	it( 'returns only collapsed parents by default', () => {
		const result = processTreeRows( rows, view(), new Set(), {
			getItemId: item => item.id,
			getItemParentId: item => item.parentId,
			fields,
		} );

		expect( result.data.map( row => row.id ) ).toEqual( [ 'search', 'social', 'direct' ] );
		expect( result.paginationInfo ).toEqual( { totalItems: 3, totalPages: 1 } );
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

	it( 'force-expands child matches and filters to matching children', () => {
		expect( getProcessedIds( { search: 'duck' } ) ).toEqual( [ 'search', 'duckduckgo' ] );
	} );

	it( 'respects normal expansion for parent matches', () => {
		expect( getProcessedIds( { search: 'search engines' } ) ).toEqual( [ 'search' ] );
		expect( getProcessedIds( { search: 'search engines' }, [ 'search' ] ) ).toEqual( [
			'search',
			'google',
			'bing',
			'duckduckgo',
			'yahoo',
		] );
	} );

	it( 'force-expands child matches for isAny filters', () => {
		expect(
			getProcessedIds( {
				filters: [ { field: 'medium', operator: 'isAny', value: [ 'organic' ] } ],
			} )
		).toEqual( [ 'search', 'google', 'bing', 'duckduckgo', 'yahoo' ] );
	} );

	it( 'respects normal expansion for parent isAny filter matches', () => {
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

	it( 'requires child rows to match all active isAny filters', () => {
		expect(
			getProcessedIds( {
				filters: [
					{ field: 'medium', operator: 'isAny', value: [ 'social' ] },
					{ field: 'category', operator: 'isAny', value: [ 'social network' ] },
				],
			} )
		).toEqual( [ 'social', 'facebook', 'linkedin' ] );
	} );

	it( 'applies isNone filters when resolving matching children', () => {
		expect(
			getProcessedIds( {
				search: 'google',
				filters: [ { field: 'medium', operator: 'isNone', value: [ 'organic' ] } ],
			} )
		).toEqual( [] );
		expect(
			getProcessedIds( {
				search: 'facebook',
				filters: [ { field: 'medium', operator: 'isNone', value: [ 'organic' ] } ],
			} )
		).toEqual( [ 'social', 'facebook' ] );
	} );

	it( 'paginates by parent units and keeps children with the parent page', () => {
		const result = processTreeRows(
			rows,
			view( { page: 1, perPage: 2 } ),
			new Set( [ 'social' ] ),
			{
				getItemId: item => item.id,
				getItemParentId: item => item.parentId,
				fields,
			}
		);

		expect( result.data.map( row => row.id ) ).toEqual( [
			'search',
			'social',
			'facebook',
			'linkedin',
		] );
		expect( result.paginationInfo ).toEqual( { totalItems: 3, totalPages: 2 } );
	} );

	it( 'uses only enableGlobalSearch fields when any are configured', () => {
		expect( getProcessedIds( { search: 'channel' } ) ).toEqual( [] );
		expect( getProcessedIds( { search: 'social' } ) ).toEqual( [ 'social' ] );
	} );

	it( 'matches nothing when no fields enable global search', () => {
		const fieldsWithoutSearch = fields.map( field => ( {
			...field,
			enableGlobalSearch: false,
		} ) );

		expect( getProcessedIds( { search: 'google' }, [], fieldsWithoutSearch ) ).toEqual( [] );
		expect( getProcessedIds( { search: 'channel' }, [], fieldsWithoutSearch ) ).toEqual( [] );
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

		const result = processTreeRows( accentedRows, view( { search: 'cafe' } ), new Set(), {
			getItemId: item => item.id,
			getItemParentId: item => item.parentId,
			fields,
		} );

		expect( result.data.map( row => row.id ) ).toEqual( [ 'cafe' ] );
	} );

	it( 'preserves parent input order when no sort is set', () => {
		expect( getProcessedIds( { sort: undefined } ) ).toEqual( [ 'search', 'social', 'direct' ] );
	} );
} );
