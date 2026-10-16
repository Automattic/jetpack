/**
 * Internal dependencies
 */
import {
	archivesCsvExporter,
	buildArchiveCsvRows,
	buildArchiveRows,
	getPostsReportQueryParams,
	postsPagesCsvExporter,
} from '../posts';
import type {
	ReportParams,
	StatsArchivesComparisonItem,
	StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';

describe( 'posts report exports', () => {
	it( 'requests every row of the summarized report window', () => {
		expect(
			getPostsReportQueryParams( {
				from: '2026-03-01',
				to: '2026-03-10',
				interval: 'day',
			} as ReportParams )
		).toEqual( {
			from: '2026-03-01',
			to: '2026-03-10',
			interval: 'day',
			max: 0,
			period: 'day',
			summarize: 1,
			skip_archives: 1,
		} );
	} );

	it( 'orders Posts & pages rows by views without mutating the input', () => {
		const items = [
			{ id: 2, label: 'About Page', views: 7, link: 'https://example.com/about/' },
			{ id: 1, label: 'Hello World Post', views: 42, link: 'https://example.com/hello-world/' },
		] as StatsTopPostsComparisonItem[];

		const rows = postsPagesCsvExporter.toCsvRows( items );

		expect( rows.map( row => row.label ) ).toEqual( [ 'Hello World Post', 'About Page' ] );
		expect( items[ 0 ].label ).toBe( 'About Page' );
	} );

	it( 'exports Title, Views, and URL', () => {
		const columns = postsPagesCsvExporter.getColumns();
		const row = {
			id: 1,
			label: 'Hello World Post',
			views: 42,
			link: 'https://example.com/hello-world/',
		} as StatsTopPostsComparisonItem;

		expect( columns.map( column => column.label ) ).toEqual( [ 'Title', 'Views', 'URL' ] );
		expect( columns.map( column => column.getValue( row ) ) ).toEqual( [
			'Hello World Post',
			42,
			'https://example.com/hello-world/',
		] );
	} );

	it( 'keeps the archives export depth-first instead of sorting by views', () => {
		const items = [
			{
				label: 'tag',
				value: 80,
				children: [
					{ label: 'video', value: 80, link: 'https://example.com/tag/video/', children: null },
				],
			},
			{ label: 'cat', value: 201, children: null },
		] as StatsArchivesComparisonItem[];

		expect( archivesCsvExporter.toCsvRows( items ).map( row => row.label ) ).toEqual( [
			'Tags',
			'Tags > video',
			'Categories',
		] );
	} );

	it( 'falls back to Untitled for an archive row with an empty label', () => {
		expect( buildArchiveRows( [ { label: '', value: 5, children: null } ] )[ 0 ].label ).toBe(
			'Untitled'
		);
	} );

	it( 'gives every archive type the API returns a human-readable group label', () => {
		const archiveTypes = [
			'author',
			'cat',
			'date',
			'err',
			'home',
			'multiple',
			'other',
			'post_type',
			'search',
			'tag',
			'tax',
			// An archive type added after this ships falls back to its key,
			// capitalized — the API sends some of these shouty.
			'FEED',
		];

		expect(
			buildArchiveRows(
				archiveTypes.map( archiveType => ( { label: archiveType, value: 5, children: null } ) )
			).map( row => row.label )
		).toEqual( [
			'Authors',
			'Categories',
			'Dates',
			'Error',
			'Homepage (Latest posts)',
			'Aggregated',
			'Others',
			'Post types',
			'Searches',
			'Tags',
			'Taxonomies',
			'Feed',
		] );
	} );

	it( 'qualifies a nested archive row with its full ancestor path for export', () => {
		const rows = buildArchiveRows( [
			{
				label: 'tax',
				value: 30,
				children: [
					{
						label: 'post_tag',
						value: 30,
						children: [
							{
								label: 'Analytics',
								value: 30,
								link: 'https://example.com/tag/analytics/',
								children: null,
							},
						],
					},
				],
			},
		] );

		expect( buildArchiveCsvRows( rows ).map( row => row.label ) ).toEqual( [
			'Taxonomies',
			'Taxonomies > Post tag',
			'Taxonomies > Post tag > Analytics',
		] );
	} );

	it( 'preserves the archive hierarchy and uses standard archive labels', () => {
		expect(
			buildArchiveRows( [
				{
					label: 'tax',
					value: 30,
					children: [
						{
							label: 'post_tag',
							value: 30,
							children: [
								{
									label: 'Analytics',
									value: 30,
									link: 'https://example.com/tag/analytics/',
									children: null,
								},
							],
						},
					],
				},
			] )
		).toEqual( [
			{
				id: 'tax-0',
				label: 'Taxonomies',
				views: 30,
				isGroup: true,
			},
			{
				id: 'tax-0-0',
				parentId: 'tax-0',
				label: 'Post tag',
				views: 30,
				isGroup: true,
			},
			{
				id: 'tax-0-0-0',
				parentId: 'tax-0-0',
				label: 'Analytics',
				views: 30,
				link: 'https://example.com/tag/analytics/',
				isGroup: false,
			},
		] );
	} );
} );
