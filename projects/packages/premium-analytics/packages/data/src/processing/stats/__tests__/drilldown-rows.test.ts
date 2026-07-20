import { aggregateStatsDrilldownRows } from '../drilldown-rows';
import type { StatsDrilldownSourceItem, StatsDrilldownSourceReport } from '../drilldown-rows';

type Item = StatsDrilldownSourceItem;

function makeReport( days: Item[][] ): StatsDrilldownSourceReport< Item > {
	return {
		data: days.map( items => ( { items } ) ),
	};
}

describe( 'aggregateStatsDrilldownRows', () => {
	it( 'nests grouped records under a parent row and aggregates across buckets', () => {
		const day = ( views: number ): Item => ( {
			label: 'wordpress.org',
			views,
			link: null,
			children: [
				{
					label: '/plugins/jetpack-search',
					views,
					link: 'https://wordpress.org/plugins/jetpack-search',
					children: null,
				},
			],
		} );

		expect( aggregateStatsDrilldownRows( makeReport( [ [ day( 8 ) ], [ day( 5 ) ] ] ) ) ).toEqual( [
			{ id: 'wordpress.org', label: 'wordpress.org', isGroup: true, value: 13 },
			{
				id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
				parentId: 'wordpress.org',
				label: '/plugins/jetpack-search',
				href: 'https://wordpress.org/plugins/jetpack-search',
				value: 13,
			},
		] );
	} );

	it( 'keeps a single-record group as one flat row', () => {
		const report = makeReport( [
			[ { label: 'jetpack.com', views: 4, link: 'https://jetpack.com/', children: null } ],
		] );

		expect( aggregateStatsDrilldownRows( report ) ).toEqual( [
			{
				id: 'jetpack.com|https://jetpack.com/',
				label: 'jetpack.com',
				href: 'https://jetpack.com/',
				value: 4,
			},
		] );
	} );

	it( 'folds a single-record group into the nested group that lists the same URL', () => {
		const report = makeReport( [
			[
				{
					label: 'github.com',
					views: 5,
					link: null,
					children: [
						{
							label: 'github.com/Automattic/jetpack',
							views: 3,
							link: 'https://github.com/Automattic/jetpack',
							children: null,
						},
						{
							label: 'github.com/Automattic/themes',
							views: 2,
							link: 'https://github.com/Automattic/themes',
							children: null,
						},
					],
				},
			],
			[
				// The only github.com record clicked this day, so Stats
				// reports it as its own top-level group.
				{
					label: 'github.com/Automattic/themes',
					views: 5,
					link: 'https://github.com/Automattic/themes',
					children: null,
				},
			],
		] );

		expect( aggregateStatsDrilldownRows( report ) ).toEqual( [
			{ id: 'github.com', label: 'github.com', isGroup: true, value: 10 },
			{
				id: 'github.com|https://github.com/Automattic/themes',
				parentId: 'github.com',
				label: 'github.com/Automattic/themes',
				href: 'https://github.com/Automattic/themes',
				value: 7,
			},
			{
				id: 'github.com|https://github.com/Automattic/jetpack',
				parentId: 'github.com',
				label: 'github.com/Automattic/jetpack',
				href: 'https://github.com/Automattic/jetpack',
				value: 3,
			},
		] );
	} );

	it( 'orders groups and records by value descending', () => {
		const report = makeReport( [
			[
				{ label: 'small.com', views: 2, link: 'https://small.com/', children: null },
				{
					label: 'big.com',
					views: 9,
					link: null,
					children: [
						{ label: 'big.com/a', views: 4, link: 'https://big.com/a', children: null },
						{ label: 'big.com/b', views: 5, link: 'https://big.com/b', children: null },
					],
				},
			],
		] );

		expect( aggregateStatsDrilldownRows( report ).map( row => row.id ) ).toEqual( [
			'big.com',
			'big.com|https://big.com/b',
			'big.com|https://big.com/a',
			'small.com|https://small.com/',
		] );
	} );

	it( 'drops leaves without a link', () => {
		const report = makeReport( [ [ { label: 'no-link', views: 3, link: null, children: null } ] ] );

		expect( aggregateStatsDrilldownRows( report ) ).toEqual( [] );
	} );
} );
