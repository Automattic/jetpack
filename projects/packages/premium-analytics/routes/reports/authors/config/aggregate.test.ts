import { aggregateAuthorRows } from './aggregate';
import type {
	StatsDrilldownSourceReport,
	StatsNormalizedReport,
	StatsTopAuthorsComparisonItem,
	StatsTopAuthorsItem,
} from '@jetpack-premium-analytics/data';

const report: StatsNormalizedReport< StatsTopAuthorsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-01',
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-01T23:59:59+00:00',
			items: [
				{
					label: 'Guest Author',
					views: 3,
					icon: null,
				},
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 10,
					icon: 'https://example.com/ada.png',
					children: [
						{
							id: 1,
							label: 'Analytical Engine',
							views: 6,
							link: 'https://example.com/analytical-engine/',
						},
						{
							id: 2,
							label: 'Notes on computation',
							views: 4,
							link: 'https://example.com/notes/',
						},
					],
				},
			],
		},
		{
			time_interval: '2026-06-02',
			date_start: '2026-06-02T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
			items: [
				{
					label: 'Guest Author',
					views: 5,
					icon: null,
				},
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 12,
					icon: 'https://example.com/ada.png',
					children: [
						{
							id: 1,
							label: 'Analytical Engine',
							views: 5,
							link: 'https://example.com/analytical-engine/',
						},
						{
							id: 3,
							label: 'Early compiler ideas',
							views: 7,
							link: 'https://example.com/compiler/',
						},
					],
				},
			],
		},
	],
};

const comparisonReport: StatsDrilldownSourceReport< StatsTopAuthorsComparisonItem > = {
	data: [
		{
			items: [
				{
					key: '42',
					id: 42,
					label: 'Ada Lovelace',
					views: 10,
					previousViews: 8,
					icon: 'https://example.com/ada.png',
					children: [
						{
							id: 1,
							label: 'Analytical Engine',
							views: 6,
							previousViews: 4,
							link: 'https://example.com/analytical-engine/',
							children: null,
						},
						{
							id: 4,
							label: 'Earlier post',
							views: 0,
							previousViews: 3,
							link: null,
							children: null,
						},
					],
				},
			],
		},
	],
};

describe( 'report authors aggregate', () => {
	it( 'aggregates authors and nests their posts in descending views order', () => {
		expect( aggregateAuthorRows( report ) ).toEqual( [
			{
				id: 'id:42',
				label: 'Ada Lovelace',
				avatarUrl: 'https://example.com/ada.png',
				isGroup: true,
				views: 22,
			},
			{
				id: 'id:42|post:id:1',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Analytical Engine',
				avatarUrl: null,
				postId: '1',
				views: 11,
			},
			{
				id: 'id:42|post:id:3',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Early compiler ideas',
				avatarUrl: null,
				postId: '3',
				views: 7,
			},
			{
				id: 'id:42|post:id:2',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Notes on computation',
				avatarUrl: null,
				postId: '2',
				views: 4,
			},
			{
				id: 'label:Guest Author|',
				label: 'Guest Author',
				avatarUrl: null,
				isGroup: true,
				views: 8,
			},
		] );
	} );

	it( 'returns no rows before the report loads', () => {
		expect( aggregateAuthorRows( undefined ) ).toEqual( [] );
	} );

	it( 'preserves comparison views for authors and nested posts', () => {
		expect( aggregateAuthorRows( comparisonReport ) ).toEqual( [
			{
				id: 'id:42',
				label: 'Ada Lovelace',
				avatarUrl: 'https://example.com/ada.png',
				isGroup: true,
				views: 10,
				previousViews: 8,
			},
			{
				id: 'id:42|post:id:1',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Analytical Engine',
				avatarUrl: null,
				postId: '1',
				views: 6,
				previousViews: 4,
			},
			{
				id: 'id:42|post:id:4',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Earlier post',
				avatarUrl: null,
				postId: '4',
				views: 0,
				previousViews: 3,
			},
		] );
	} );
} );
