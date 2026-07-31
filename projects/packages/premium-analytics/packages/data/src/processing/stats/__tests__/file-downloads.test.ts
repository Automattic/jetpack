import { mergeStatsFileDownloadsComparisonRows, sanitizeStatsFileDownloadsResponse } from '..';
import { fileDownloadsFixture, fileDownloadsSummaryFixture } from '../__fixtures__/file-downloads';
import type { StatsFileDownloadsItem, StatsNormalizedReport } from '..';

/**
 * Build a normalized report containing one range-level file list.
 *
 * @param items - File-download rows for the range.
 * @return A normalized file-downloads report.
 */
function makeReport(
	items: StatsFileDownloadsItem[]
): StatsNormalizedReport< StatsFileDownloadsItem > {
	return {
		summary: {},
		data: [
			{
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
				items,
			},
		],
	};
}

/**
 * Build one normalized file-download row.
 *
 * @param filename  - Display filename.
 * @param link      - Stable download URL.
 * @param downloads - Download count.
 * @return A normalized file-download row.
 */
function makeDownload( filename: string, link: string, downloads: number ): StatsFileDownloadsItem {
	return {
		label: `/files/${ filename }`,
		shortLabel: filename,
		link,
		downloads,
		linkTitle: `/files/${ filename }`,
		labelIcon: 'external',
		children: null,
	};
}

describe( 'Stats file downloads processing', () => {
	it( 'normalizes file downloads with numeric values', () => {
		expect(
			sanitizeStatsFileDownloadsResponse( fileDownloadsFixture, {
				period: 'day',
				end_date: '2026-06-16',
			} ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: '/download.pdf',
				downloads: 5,
				shortLabel: 'download.pdf',
			} )
		);
	} );

	it( 'normalizes summarized file downloads into range data', () => {
		const result = sanitizeStatsFileDownloadsResponse( fileDownloadsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_downloads: 8,
				other_downloads: 0,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: '/guide.pdf',
				downloads: 8,
				shortLabel: 'guide.pdf',
				link: 'https://example.com/guide.pdf',
			} )
		);
	} );

	it( 'matches comparison downloads by URL instead of row order', () => {
		const reportUrl = 'https://example.com/files/report.pdf';
		const guideUrl = 'https://example.com/files/guide.pdf';
		const primary = makeReport( [
			makeDownload( 'report.pdf', reportUrl, 12 ),
			makeDownload( 'guide.pdf', guideUrl, 8 ),
		] );
		const comparison = makeReport( [
			makeDownload( 'guide.pdf', guideUrl, 4 ),
			makeDownload( 'report.pdf', reportUrl, 6 ),
		] );

		const result = mergeStatsFileDownloadsComparisonRows( primary, comparison );

		expect( result.hasComparison ).toBe( true );
		expect(
			result.rows.map( row => ( {
				link: row.link,
				previousDownloads: row.previousDownloads,
			} ) )
		).toEqual( [
			{ link: reportUrl, previousDownloads: 6 },
			{ link: guideUrl, previousDownloads: 4 },
		] );
	} );

	it( 'keeps a missing comparison row unknown because the API may truncate results', () => {
		const reportUrl = 'https://example.com/files/report.pdf';
		const primary = makeReport( [ makeDownload( 'report.pdf', reportUrl, 12 ) ] );
		const comparison = makeReport( [] );

		const result = mergeStatsFileDownloadsComparisonRows( primary, comparison );

		expect( result.hasComparison ).toBe( false );
		expect( result.rows[ 0 ].previousDownloads ).toBeUndefined();
	} );

	it( 'preserves an explicitly matched zero comparison value', () => {
		const reportUrl = 'https://example.com/files/report.pdf';
		const primary = makeReport( [ makeDownload( 'report.pdf', reportUrl, 12 ) ] );
		const comparison = makeReport( [ makeDownload( 'report.pdf', reportUrl, 0 ) ] );

		const result = mergeStatsFileDownloadsComparisonRows( primary, comparison );

		expect( result.hasComparison ).toBe( true );
		expect( result.rows[ 0 ].previousDownloads ).toBe( 0 );
	} );
} );
