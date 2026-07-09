import { processDrilldownGroups } from './process-drilldown-groups';
import type { DataViewsDrilldownComposableGroup } from './dataviews-drilldown-composable';
import type { View } from '@wordpress/dataviews';

const groups: DataViewsDrilldownComposableGroup[] = [
	{
		id: 'group:category',
		label: 'Categories',
		value: 30,
		children: [
			{
				id: 'group:category:/category/news|https://example.com/category/news/',
				label: '/category/news',
				value: 20,
				href: 'https://example.com/category/news/',
			},
			{
				id: 'group:category:/category/features|https://example.com/category/features/',
				label: '/category/features',
				value: 10,
				href: 'https://example.com/category/features/',
			},
		],
	},
	{
		id: 'group:post_tag',
		label: 'Tags',
		value: 15,
		children: [
			{
				id: 'group:post_tag:/tag/react|https://example.com/tag/react/',
				label: '/tag/react',
				value: 9,
				href: 'https://example.com/tag/react/',
			},
			{
				id: 'group:post_tag:/tag/design|https://example.com/tag/design/',
				label: '/tag/design',
				value: 6,
				href: 'https://example.com/tag/design/',
			},
		],
	},
	{
		id: 'group:search',
		label: 'Searches',
		value: 5,
		children: [
			{
				id: 'group:search:/?s=analytics|https://example.com/?s=analytics',
				label: '/?s=analytics',
				value: 5,
				href: 'https://example.com/?s=analytics',
			},
		],
	},
];

/**
 * Build a table view for the processor with test overrides.
 *
 * @param overrides - View fields to override.
 * @return The DataViews view.
 */
function getView( overrides: Partial< View > = {} ): View {
	return {
		type: 'table',
		search: '',
		page: 1,
		perPage: 2,
		fields: [ 'label', 'value' ],
		...overrides,
	} as View;
}

/**
 * Resolve the test group filter value from its id.
 *
 * @param group - The drilldown group.
 * @return The group filter value.
 */
function getGroupFilterValue( group: DataViewsDrilldownComposableGroup ): string {
	if ( group.id === 'group:category' ) {
		return 'organic';
	}

	if ( group.id === 'group:post_tag' ) {
		return 'social';
	}

	return 'direct';
}

describe( 'processDrilldownGroups', () => {
	it( 'returns the first page of groups collapsed by default', () => {
		const result = processDrilldownGroups( groups, getView(), new Set() );

		expect( result.paginationInfo ).toEqual( { totalItems: 3, totalPages: 2 } );
		expect( result.groups.map( group => group.label ) ).toEqual( [ 'Categories', 'Tags' ] );
		expect( result.groups.map( group => group.children ) ).toEqual( [ [], [] ] );
	} );

	it( 'includes expanded child rows for expanded groups', () => {
		const result = processDrilldownGroups( groups, getView(), new Set( [ 'group:category' ] ) );

		expect( result.groups[ 0 ].children.map( child => child.label ) ).toEqual( [
			'/category/news',
			'/category/features',
		] );
		expect( result.groups[ 1 ].children ).toEqual( [] );
	} );

	it( 'force-expands child search matches and filters children', () => {
		const result = processDrilldownGroups( groups, getView( { search: 'react' } ), new Set() );

		expect( result.paginationInfo ).toEqual( { totalItems: 1, totalPages: 1 } );
		expect( result.groups ).toHaveLength( 1 );
		expect( result.groups[ 0 ].label ).toBe( 'Tags' );
		expect( result.groups[ 0 ].children.map( child => child.label ) ).toEqual( [ '/tag/react' ] );
	} );

	it( 'matches group labels without forcing child rows open', () => {
		const collapsed = processDrilldownGroups( groups, getView( { search: 'tags' } ), new Set() );
		const expanded = processDrilldownGroups(
			groups,
			getView( { search: 'tags' } ),
			new Set( [ 'group:post_tag' ] )
		);

		expect( collapsed.groups.map( group => group.label ) ).toEqual( [ 'Tags' ] );
		expect( collapsed.groups[ 0 ].children ).toEqual( [] );
		expect( expanded.groups[ 0 ].children.map( child => child.label ) ).toEqual( [
			'/tag/react',
			'/tag/design',
		] );
	} );

	it( 'paginates by groups only', () => {
		const result = processDrilldownGroups(
			groups,
			getView( { page: 2, perPage: 1 } ),
			new Set( [ 'group:post_tag' ] )
		);

		expect( result.paginationInfo ).toEqual( { totalItems: 3, totalPages: 3 } );
		expect( result.groups.map( group => group.label ) ).toEqual( [ 'Tags' ] );
		expect( result.groups[ 0 ].children.map( child => child.label ) ).toEqual( [
			'/tag/react',
			'/tag/design',
		] );
	} );

	it( 'filters groups by active type filter values', () => {
		const result = processDrilldownGroups(
			groups,
			getView( {
				filters: [
					{
						field: 'type',
						operator: 'isAny',
						value: [ 'organic', 'direct' ],
					},
				],
			} ),
			new Set(),
			getGroupFilterValue
		);

		expect( result.paginationInfo ).toEqual( { totalItems: 2, totalPages: 1 } );
		expect( result.groups.map( group => group.label ) ).toEqual( [ 'Categories', 'Searches' ] );
	} );

	it( 'combines active type filters with search matching', () => {
		const result = processDrilldownGroups(
			groups,
			getView( {
				search: 'react',
				filters: [
					{
						field: 'type',
						operator: 'isAny',
						value: [ 'organic', 'social' ],
					},
				],
			} ),
			new Set(),
			getGroupFilterValue
		);

		expect( result.paginationInfo ).toEqual( { totalItems: 1, totalPages: 1 } );
		expect( result.groups ).toHaveLength( 1 );
		expect( result.groups[ 0 ].label ).toBe( 'Tags' );
		expect( result.groups[ 0 ].children.map( child => child.label ) ).toEqual( [ '/tag/react' ] );
	} );

	it( 'treats an empty type filter selection as no filter', () => {
		const result = processDrilldownGroups(
			groups,
			getView( {
				filters: [
					{
						field: 'type',
						operator: 'isAny',
						value: [],
					},
				],
			} ),
			new Set(),
			getGroupFilterValue
		);

		expect( result.paginationInfo ).toEqual( { totalItems: 3, totalPages: 2 } );
		expect( result.groups.map( group => group.label ) ).toEqual( [ 'Categories', 'Tags' ] );
	} );

	it( 'ignores type filters when no filter value resolver is provided', () => {
		const result = processDrilldownGroups(
			groups,
			getView( {
				filters: [
					{
						field: 'type',
						operator: 'isAny',
						value: [ 'organic' ],
					},
				],
			} ),
			new Set()
		);

		expect( result.paginationInfo ).toEqual( { totalItems: 3, totalPages: 2 } );
		expect( result.groups.map( group => group.label ) ).toEqual( [ 'Categories', 'Tags' ] );
	} );
} );
