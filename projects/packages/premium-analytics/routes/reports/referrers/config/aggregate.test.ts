import { flattenReferrerRows } from './aggregate';
import type { StatsReferrersComparisonItem } from '@jetpack-premium-analytics/data';

const searchEngines: StatsReferrersComparisonItem = {
	label: 'Search Engines',
	views: 12,
	previousValue: 10,
	link: null,
	icon: null,
	labelIcon: null,
	children: [
		{
			label: 'Google Search',
			views: 12,
			previousValue: 8,
			link: null,
			icon: 'https://icons.example/google.png',
			labelIcon: null,
			children: [
				{
					label: 'google.com',
					views: 12,
					previousValue: 8,
					link: 'https://www.google.com/',
					icon: null,
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

describe( 'report referrers hierarchy', () => {
	it( 'emits every hierarchy level with stable parent ids and inherited icons', () => {
		expect( flattenReferrerRows( [ searchEngines ] ) ).toEqual( [
			{
				id: '["Search Engines"]',
				label: 'Search Engines',
				views: 12,
				previousValue: 10,
				hasChildren: true,
			},
			{
				id: '["Search Engines","Google Search"]',
				parentId: '["Search Engines"]',
				parentLabel: 'Search Engines',
				label: 'Google Search',
				views: 12,
				previousValue: 8,
				icon: 'https://icons.example/google.png',
				hasChildren: true,
			},
			{
				id: '["Search Engines","Google Search","https://www.google.com/"]',
				parentId: '["Search Engines","Google Search"]',
				parentLabel: 'Google Search',
				label: 'google.com',
				views: 12,
				previousValue: 8,
				link: 'https://www.google.com/',
				icon: 'https://icons.example/google.png',
			},
		] );
	} );

	it( 'keeps ungrouped referrers as top-level rows', () => {
		const direct: StatsReferrersComparisonItem = {
			label: 'jetpack.com',
			views: 4,
			link: 'https://jetpack.com/',
			icon: 'https://icons.example/jetpack.png',
			labelIcon: 'external',
			children: null,
		};

		expect( flattenReferrerRows( [ direct ] ) ).toEqual( [
			{
				id: '["https://jetpack.com/"]',
				label: 'jetpack.com',
				views: 4,
				previousValue: undefined,
				link: 'https://jetpack.com/',
				icon: 'https://icons.example/jetpack.png',
			},
		] );
	} );
} );
