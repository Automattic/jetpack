import { aggregateDownloadRows, downloadsToTimeSeries } from './aggregate';
import type {
	StatsFileDownloadsItem,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

const report: StatsNormalizedReport< StatsFileDownloadsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-01',
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-01T23:59:59+00:00',
			items: [
				{
					label: '/files/report.pdf',
					shortLabel: 'report.pdf',
					link: 'https://example.com/files/report.pdf',
					downloads: 4,
					linkTitle: '/files/report.pdf',
					labelIcon: 'external',
					children: null,
				},
			],
		},
		{
			time_interval: '2026-06-02',
			date_start: '2026-06-02T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
			items: [
				{
					label: '/files/report.pdf',
					shortLabel: 'report.pdf',
					link: 'https://example.com/files/report.pdf',
					downloads: 6,
					linkTitle: '/files/report.pdf',
					labelIcon: 'external',
					children: null,
				},
				{
					label: '/files/guide.zip',
					shortLabel: 'guide.zip',
					link: 'https://example.com/files/guide.zip',
					downloads: 3,
					linkTitle: '/files/guide.zip',
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

describe( 'downloads report aggregate', () => {
	it( 'builds the downloads time series from every bucket row', () => {
		const series = downloadsToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.downloads ) ).toEqual( [ 4, 9 ] );
	} );

	it( 'groups daily totals into ISO weeks for the chart', () => {
		const series = downloadsToTimeSeries( report, 'week' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-02T23:59:59+00:00',
				downloads: 13,
			} ),
		] );
	} );

	it( 'groups daily totals into calendar months for the chart', () => {
		const series = downloadsToTimeSeries( report, 'month' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-02T23:59:59+00:00',
				downloads: 13,
			} ),
		] );
	} );

	it( 'aggregates matching files across buckets without mutating the report', () => {
		const rows = aggregateDownloadRows( report );

		expect( rows.map( row => ( { label: row.shortLabel, downloads: row.downloads } ) ) ).toEqual( [
			{ label: 'report.pdf', downloads: 10 },
			{ label: 'guide.zip', downloads: 3 },
		] );
		expect( report.data[ 0 ].items[ 0 ].downloads ).toBe( 4 );
	} );
} );
