import { aggregateUtmRows } from './aggregate';
import type {
	StatsUtmComparisonItem,
	StatsUtmComparisonTopPostItem,
} from '@jetpack-premium-analytics/data';

/**
 * Build a nested post fixture.
 *
 * @param overrides - Post properties to override.
 * @return The post fixture.
 */
function makePost(
	overrides: Partial< StatsUtmComparisonTopPostItem > = {}
): StatsUtmComparisonTopPostItem {
	return {
		id: 41,
		label: 'Landing page',
		value: 12,
		href: 'https://example.com/landing/',
		page: '/stats/post/41',
		actions: [],
		children: null,
		...overrides,
	};
}

/**
 * Build a UTM comparison-row fixture.
 *
 * @param overrides - UTM properties to override.
 * @return The UTM fixture.
 */
function makeUtmItem( overrides: Partial< StatsUtmComparisonItem > = {} ): StatsUtmComparisonItem {
	return {
		label: 'newsletter / email',
		value: 18,
		paramValues: '["newsletter","email"]',
		children: [ makePost() ],
		...overrides,
	};
}

describe( 'UTM report aggregate', () => {
	it( 'groups posts under their UTM parent', () => {
		const rows = aggregateUtmRows( [ makeUtmItem() ] );
		const [ parent, post ] = rows;

		expect( parent ).toEqual( {
			id: JSON.stringify( [ 'utm', '["newsletter","email"]' ] ),
			label: 'newsletter / email',
			views: 18,
			previousViews: undefined,
			isGroup: true,
		} );
		expect( post ).toEqual(
			expect.objectContaining( {
				parentId: parent.id,
				label: 'Landing page',
				groupLabel: 'newsletter / email',
				postId: 41,
				views: 12,
			} )
		);
	} );

	it( 'preserves comparison values for UTM parents and posts', () => {
		const rows = aggregateUtmRows( [
			makeUtmItem( {
				previousValue: 10,
				children: [ makePost( { previousValue: 8 } ) ],
			} ),
		] );

		expect( rows.map( row => row.previousViews ) ).toEqual( [ 10, 8 ] );
	} );

	it( 'keeps distinct UTM tuples separate when their labels collide', () => {
		const rows = aggregateUtmRows( [
			makeUtmItem( {
				label: 'a / b / c',
				paramValues: '["a / b","c"]',
				children: null,
			} ),
			makeUtmItem( {
				label: 'a / b / c',
				paramValues: '["a","b / c"]',
				children: null,
			} ),
		] );

		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ].id ).not.toBe( rows[ 1 ].id );
	} );

	it( 'keeps UTM parents that have no posts', () => {
		expect( aggregateUtmRows( [ makeUtmItem( { children: null } ) ] ) ).toEqual( [
			expect.objectContaining( {
				label: 'newsletter / email',
				views: 18,
				isGroup: true,
			} ),
		] );
	} );
} );
