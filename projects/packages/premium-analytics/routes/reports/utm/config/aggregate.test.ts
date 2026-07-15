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
						{ label: 'newsletter', value: 10, children: null },
						{ label: 'social', value: 5, children: null },
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
		const item = { label: 'newsletter', value: 7, children: null } satisfies StatsUtmItem;
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
					items: [ { label: 'newsletter', value: 8, children: null } ],
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
					items: [ { label: 'google / cpc', value: 10, children: null } ],
				},
			],
		};

		expect( aggregateUtmRows( report ) ).toEqual( [
			{ id: 'google / cpc', label: 'google / cpc', views: 10 },
		] );
	} );
} );
