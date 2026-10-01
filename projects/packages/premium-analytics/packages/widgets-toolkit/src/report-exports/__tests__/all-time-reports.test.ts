/**
 * External dependencies
 */
import {
	fetchStatsComments,
	fetchStatsEmailSummaryRows,
	fetchStatsInsightsYears,
	fetchStatsTagsRows,
	type StatsCommentsResponse,
	type StatsEmailSummaryItem,
	type StatsInsightsYear,
	type StatsTagsItem,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { annualInsightsCsvExporter } from '../annual-insights';
import {
	commentsAuthorsCsvExporter,
	commentsPostsCsvExporter,
	toCommentRows,
	type CommentRow,
} from '../comments';
import { EMAILS_REPORT_ROW_LIMIT, emailsCsvExporter } from '../emails';
import { TAGS_REPORT_ROW_LIMIT, tagsCsvExporter } from '../tags';
import type { ReportCsvExporter } from '../types';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	fetchStatsComments: jest.fn(),
	fetchStatsEmailSummaryRows: jest.fn(),
	fetchStatsInsightsYears: jest.fn(),
	fetchStatsTagsRows: jest.fn(),
} ) );

function toCsvTable< TItem, TRow >( exporter: ReportCsvExporter< TItem, TRow >, items: TItem[] ) {
	const columns = exporter.getColumns();
	return [
		columns.map( column => column.label ),
		...exporter.toCsvRows( items ).map( row => columns.map( column => column.getValue( row ) ) ),
	];
}

const COMMENTS_REPORT = {
	data: [
		{
			items: [
				{
					label: 'authors',
					children: [
						{ label: 'Ana', value: 2, link: 'edit-comments.php?user_id=7' },
						{ label: 'Bo', value: 5, link: 'edit-comments.php?user_id=8' },
					],
				},
				{
					label: 'posts',
					children: [
						{ id: 9, label: 'Hello', value: 3, link: 'https://example.com/hello/' },
						{ id: 10, label: 'Bad link', value: 1, link: 'javascript:alert(1)' },
					],
				},
			],
		},
	],
} as unknown as StatsCommentsResponse;

describe( 'all-time report exporters', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exports Annual insights newest year first, keeping fractional averages', async () => {
		const years = [
			{
				year: '2025',
				total_posts: 10,
				total_comments: 20,
				avg_comments: 2,
				total_likes: 30,
				avg_likes: 3,
				total_words: 1000,
				avg_words: 100.4,
				total_images: 4,
				avg_images: 1,
			},
			{
				year: '2026',
				total_posts: 12,
				total_comments: 24,
				avg_comments: 2,
				total_likes: 36,
				avg_likes: 3,
				total_words: 1200,
				avg_words: 120.6,
				total_images: 5,
				avg_images: 1,
			},
		] as StatsInsightsYear[];
		jest.mocked( fetchStatsInsightsYears ).mockResolvedValue( years );

		await expect( annualInsightsCsvExporter.fetchItems() ).resolves.toBe( years );
		expect( toCsvTable( annualInsightsCsvExporter, years ) ).toEqual( [
			[
				'Year',
				'Total posts',
				'Total comments',
				'Avg comments per post',
				'Total likes',
				'Avg likes per post',
				'Total words',
				'Avg words per post',
				'Total images',
				'Avg images per post',
			],
			[ '2026', 12, 24, 2, 36, 3, 1200, 120.6, 5, 1 ],
			[ '2025', 10, 20, 2, 30, 3, 1000, 100.4, 4, 1 ],
		] );
		expect( annualInsightsCsvExporter ).toMatchObject( {
			filenamePrefix: 'annual-insights',
			hasDateRange: false,
		} );
	} );

	it( 'keeps relative author links and drops unsafe post links', () => {
		expect( toCommentRows( COMMENTS_REPORT, 'authors' ).map( row => row.link ) ).toEqual( [
			'edit-comments.php?user_id=8',
			'edit-comments.php?user_id=7',
		] );
		expect( toCommentRows( COMMENTS_REPORT, 'posts' ).map( row => row.link ) ).toEqual( [
			'https://example.com/hello/',
			undefined,
		] );
	} );

	it.each( [
		[ 'authors', commentsAuthorsCsvExporter, [ 'Bo', 5, 'edit-comments.php?user_id=8' ] ],
		[ 'posts', commentsPostsCsvExporter, [ 'Hello', 3, 'https://example.com/hello/' ] ],
	] as const )( 'exports the Comments %s tab by comments', async ( group, exporter, firstRow ) => {
		jest.mocked( fetchStatsComments ).mockResolvedValue( COMMENTS_REPORT );

		const items: CommentRow[] = await exporter.fetchItems();

		expect( fetchStatsComments ).toHaveBeenCalledWith();
		expect( toCsvTable( exporter, items ).slice( 0, 2 ) ).toEqual( [
			[ 'Name', 'Comments', 'URL' ],
			firstRow,
		] );
		expect( exporter ).toMatchObject( {
			filenamePrefix: `comments-${ group }`,
			hasDateRange: false,
		} );
	} );

	it( 'exports Tags and categories by views from the report-sized request', async () => {
		const items = [
			{ label: [], labelText: 'First tag', value: 2, link: '/first' },
			{ label: [], labelText: 'Second tag', value: 5, link: null },
		] as unknown as StatsTagsItem[];
		jest.mocked( fetchStatsTagsRows ).mockResolvedValue( items );

		await expect( tagsCsvExporter.fetchItems() ).resolves.toBe( items );
		expect( fetchStatsTagsRows ).toHaveBeenCalledWith( { max: TAGS_REPORT_ROW_LIMIT } );
		expect( toCsvTable( tagsCsvExporter, items ) ).toEqual( [
			[ 'Tag or category', 'Views', 'URL' ],
			[ 'Second tag', 5, '' ],
			[ 'First tag', 2, '/first' ],
		] );
		expect( tagsCsvExporter ).toMatchObject( {
			filenamePrefix: 'tags-and-categories',
			hasDateRange: false,
		} );
	} );

	it( 'exports Emails newest first, leaving unknown rates blank', async () => {
		const items = [
			{
				id: 1,
				label: 'First email',
				date: '2026-01-01',
				opens: 10,
				opens_rate: 20,
				clicks: 2,
				clicks_rate: 4,
				unique_opens: 8,
				unique_clicks: 2,
				total_sends: 40,
			},
			// Clicks with no attributable recipient: the click rate alone is unknown.
			{
				id: 2,
				label: 'Second email',
				date: '2026-02-01',
				opens: 20,
				opens_rate: 40,
				clicks: 4,
				clicks_rate: 0,
				unique_opens: 16,
				unique_clicks: 0,
				total_sends: 40,
			},
			// The summary collapses an unrecorded send to 0, so both rates are unknown.
			{
				id: 3,
				label: 'Legacy email',
				date: '2025-12-01',
				opens: 120,
				opens_rate: 0,
				clicks: 5,
				clicks_rate: 0,
				unique_opens: 0,
				unique_clicks: 0,
				total_sends: 0,
			},
		] as unknown as StatsEmailSummaryItem[];
		jest.mocked( fetchStatsEmailSummaryRows ).mockResolvedValue( items );

		await expect( emailsCsvExporter.fetchItems() ).resolves.toBe( items );
		expect( fetchStatsEmailSummaryRows ).toHaveBeenCalledWith( {
			quantity: EMAILS_REPORT_ROW_LIMIT,
		} );
		expect( toCsvTable( emailsCsvExporter, items ) ).toEqual( [
			[ 'Email', 'Sent', 'Opens', 'Open rate', 'Clicks', 'Click rate' ],
			[ 'Second email', '2026-02-01', 20, 40, 4, undefined ],
			[ 'First email', '2026-01-01', 10, 20, 2, 4 ],
			[ 'Legacy email', '2025-12-01', 120, undefined, 5, undefined ],
		] );
		expect( emailsCsvExporter ).toMatchObject( { filenamePrefix: 'emails', hasDateRange: false } );
	} );
} );
