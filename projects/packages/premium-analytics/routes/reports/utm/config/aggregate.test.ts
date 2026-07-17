import { aggregateUtmRows } from './aggregate';
import type { StatsNormalizedReport, StatsUtmItem } from '@jetpack-premium-analytics/data';

describe( 'UTM report aggregate', () => {
	it( 'maps UTM values to report rows', () => {
		const report: StatsNormalizedReport< StatsUtmItem > = {
			summary: { total: 15 },
			data: [
				{
					time_interval: '2026-06-01:2026-06-07',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-07T23:59:59+00:00',
					items: [
						{ label: 'newsletter', value: 10, paramValues: 'newsletter', children: null },
						{ label: 'social', value: 5, paramValues: 'social', children: null },
					],
				},
			],
		};

		expect( aggregateUtmRows( report ) ).toEqual( [
			{ id: 'newsletter', label: 'newsletter', views: 10 },
			{ id: 'social', label: 'social', views: 5 },
		] );
	} );

	it( 'sums matching values without mutating the report', () => {
		const item = {
			label: 'newsletter',
			value: 7,
			paramValues: 'newsletter',
			children: null,
		} satisfies StatsUtmItem;
		const report: StatsNormalizedReport< StatsUtmItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [ item ],
				},
				{
					time_interval: '2026-06-02',
					date_start: '2026-06-02T00:00:00+00:00',
					date_end: '2026-06-02T23:59:59+00:00',
					items: [ { label: 'newsletter', value: 8, paramValues: 'newsletter', children: null } ],
				},
			],
		};

		expect( aggregateUtmRows( report ) ).toEqual( [
			{ id: 'newsletter', label: 'newsletter', views: 15 },
		] );
		expect( item.value ).toBe( 7 );
	} );

	it( 'preserves normalized combined-dimension labels', () => {
		const report: StatsNormalizedReport< StatsUtmItem > = {
			summary: { total: 10 },
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [
						{ label: 'google / cpc', value: 10, paramValues: '["google","cpc"]', children: null },
					],
				},
			],
		};

		expect( aggregateUtmRows( report ) ).toEqual( [
			{ id: '["google","cpc"]', label: 'google / cpc', views: 10 },
		] );
	} );

	it( 'keeps distinct UTM tuples separate even when their labels collide', () => {
		const report: StatsNormalizedReport< StatsUtmItem > = {
			summary: { total: 9 },
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [
						{ label: 'a / b / c', value: 6, paramValues: '["a / b","c"]', children: null },
						{ label: 'a / b / c', value: 3, paramValues: '["a","b / c"]', children: null },
					],
				},
			],
		};

		expect( aggregateUtmRows( report ) ).toEqual( [
			{ id: '["a / b","c"]', label: 'a / b / c', views: 6 },
			{ id: '["a","b / c"]', label: 'a / b / c', views: 3 },
		] );
	} );

	it( 'falls back to the label when param values are missing', () => {
		const report: StatsNormalizedReport< StatsUtmItem > = {
			summary: { total: 4 },
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [ { label: 'direct', value: 4, children: null } ],
				},
			],
		};

		expect( aggregateUtmRows( report ) ).toEqual( [ { id: 'direct', label: 'direct', views: 4 } ] );
	} );
} );
