import { aggregateStatsDrilldownRows } from '../drilldown-rows';
import type {
	AggregateStatsDrilldownRowsOptions,
	StatsDrilldownSourceReport,
} from '../drilldown-rows';

type Item = {
	key?: string;
	label: string;
	value: number;
	isGroup?: boolean;
	href?: string;
	imageUrl?: string;
	children?: Item[] | null;
};

type RowMetadata = {
	href?: string;
	imageUrl?: string;
};

const options: AggregateStatsDrilldownRowsOptions< Item, RowMetadata > = {
	getChildren: item => item.children,
	getId: ( item, { parentId } ) => {
		if ( ! item.key ) {
			return null;
		}

		return parentId ? `${ parentId }|${ item.key }` : item.key;
	},
	getLabel: item => item.label,
	getValue: item => item.value,
	isGroup: ( item, { hasChildren } ) => item.isGroup === true || hasChildren,
	getRowMetadata: item => ( {
		...( item.href ? { href: item.href } : {} ),
		...( item.imageUrl ? { imageUrl: item.imageUrl } : {} ),
	} ),
};

function makeReport( days: Item[][] ): StatsDrilldownSourceReport< Item > {
	return {
		data: days.map( items => ( { items } ) ),
	};
}

describe( 'aggregateStatsDrilldownRows', () => {
	it( 'aggregates nested rows across buckets and preserves report metadata', () => {
		const day = ( authorValue: number, postValue: number ): Item => ( {
			key: 'author:42',
			label: 'Ada Lovelace',
			value: authorValue,
			isGroup: true,
			imageUrl: 'https://example.com/ada.png',
			children: [
				{
					key: 'post:1',
					label: 'Analytical Engine',
					value: postValue,
					href: '/post/1',
				},
			],
		} );

		expect(
			aggregateStatsDrilldownRows( makeReport( [ [ day( 10, 6 ) ], [ day( 12, 5 ) ] ] ), options )
		).toEqual( [
			{
				id: 'author:42',
				label: 'Ada Lovelace',
				isGroup: true,
				value: 22,
				imageUrl: 'https://example.com/ada.png',
			},
			{
				id: 'author:42|post:1',
				parentId: 'author:42',
				label: 'Analytical Engine',
				value: 11,
				href: '/post/1',
			},
		] );
	} );

	it( 'keeps a semantic group when it has no children', () => {
		const report = makeReport( [
			[ { key: 'author:guest', label: 'Guest Author', value: 3, isGroup: true } ],
		] );

		expect( aggregateStatsDrilldownRows( report, options ) ).toEqual( [
			{
				id: 'author:guest',
				label: 'Guest Author',
				isGroup: true,
				value: 3,
			},
		] );
	} );

	it( 'keeps a non-group root as one flat row', () => {
		const report = makeReport( [
			[ { key: 'page', label: 'Example', value: 4, href: 'https://example.com/' } ],
		] );

		expect( aggregateStatsDrilldownRows( report, options ) ).toEqual( [
			{
				id: 'page',
				label: 'Example',
				value: 4,
				href: 'https://example.com/',
			},
		] );
	} );

	it( 'orders siblings by value descending at every level', () => {
		const report = makeReport( [
			[
				{ key: 'small', label: 'Small', value: 2, isGroup: true },
				{
					key: 'big',
					label: 'Big',
					value: 9,
					children: [
						{ key: 'a', label: 'A', value: 4 },
						{ key: 'b', label: 'B', value: 5 },
					],
				},
			],
		] );

		expect( aggregateStatsDrilldownRows( report, options ).map( row => row.id ) ).toEqual( [
			'big',
			'big|b',
			'big|a',
			'small',
		] );
	} );

	it( 'omits items without an id selected by the report adapter', () => {
		const report = makeReport( [ [ { label: 'No identity', value: 3 } ] ] );

		expect( aggregateStatsDrilldownRows( report, options ) ).toEqual( [] );
	} );
} );
