import { processTreeRows } from './process-tree-rows';
import type { Field, View } from '@wordpress/dataviews';

type Row = {
	id: string;
	parentId?: string;
	referrer: string;
	category: string;
	views: number;
};

const rows: Row[] = [
	{ id: 'search', referrer: 'Search Engines', category: 'channel', views: 625 },
	{ id: 'google', parentId: 'search', referrer: 'Google', category: 'search', views: 485 },
	{ id: 'bing', parentId: 'search', referrer: 'Bing', category: 'search', views: 86 },
	{ id: 'duckduckgo', parentId: 'search', referrer: 'DuckDuckGo', category: 'search', views: 39 },
	{ id: 'yahoo', parentId: 'search', referrer: 'Yahoo', category: 'search', views: 14 },
	{ id: 'social', referrer: 'Social', category: 'channel', views: 345 },
	{
		id: 'facebook',
		parentId: 'social',
		referrer: 'Facebook',
		category: 'social network',
		views: 210,
	},
	{
		id: 'linkedin',
		parentId: 'social',
		referrer: 'LinkedIn',
		category: 'social network',
		views: 58,
	},
	{ id: 'direct', referrer: 'Direct', category: 'channel', views: 251 },
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

	it( 'falls back to the first field when no fields enable global search', () => {
		const fieldsWithoutSearch = fields.map( field => ( {
			...field,
			enableGlobalSearch: false,
		} ) );

		expect( getProcessedIds( { search: 'google' }, [], fieldsWithoutSearch ) ).toEqual( [
			'search',
			'google',
		] );
		expect( getProcessedIds( { search: 'channel' }, [], fieldsWithoutSearch ) ).toEqual( [] );
	} );
} );
