import { sanitizeStatsFileDownloadsResponse } from '..';
import { fileDownloadsFixture, fileDownloadsSummaryFixture } from '../__fixtures__/file-downloads';

describe( 'Stats file downloads normalizer', () => {
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
} );
