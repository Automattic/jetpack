/**
 * External dependencies
 */
import { fetchStatsTopAuthorsRows, type ReportParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { authorPostsCsvExporter } from '../authors';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	fetchStatsTopAuthorsRows: jest.fn(),
} ) );

const fetchStatsTopAuthorsRowsMock = jest.mocked( fetchStatsTopAuthorsRows );

const REPORT_PARAMS = { from: '2026-07-01', to: '2026-07-07', author_id: 7 } as ReportParams;

const post = ( id: number, label: string, views: number ) => ( {
	id,
	label,
	views,
	link: `https://example.com/${ id }/`,
	children: null,
} );

describe( 'authorPostsCsvExporter', () => {
	beforeEach( () => {
		fetchStatsTopAuthorsRowsMock.mockReset();
		fetchStatsTopAuthorsRowsMock.mockResolvedValue( [
			{
				key: 'id:3',
				id: 3,
				label: 'Other',
				views: 90,
				icon: null,
				children: [ post( 9, 'Not hers', 90 ) ],
			},
			{
				key: 'id:7',
				id: 7,
				label: 'José Núñez',
				views: 30,
				icon: null,
				children: [ post( 1, 'Top post', 20 ), post( 2, 'Second post', 10 ) ],
			},
		] as Awaited< ReturnType< typeof fetchStatsTopAuthorsRows > > );
	} );

	it( 'exports every post by the author, in the report’s order', async () => {
		const exporter = authorPostsCsvExporter( 7, 'José Núñez' );
		const rows = exporter.toCsvRows( await exporter.fetchItems( REPORT_PARAMS ) );

		expect( fetchStatsTopAuthorsRowsMock ).toHaveBeenCalledWith( { ...REPORT_PARAMS, max: 0 } );
		expect( exporter.getColumns().map( column => column.label ) ).toEqual( [
			'Title',
			'Views',
			'URL',
		] );
		expect(
			rows.map( row => exporter.getColumns().map( column => column.getValue( row ) ) )
		).toEqual( [
			[ 'Top post', 20, 'https://example.com/1/' ],
			[ 'Second post', 10, 'https://example.com/2/' ],
		] );
	} );

	it( 'names the file after the author', () => {
		expect( authorPostsCsvExporter( 7, 'José Núñez' ).filenamePrefix ).toBe(
			'author-jose-nunez-posts'
		);
		expect( authorPostsCsvExporter( 7, '' ).filenamePrefix ).toBe( 'author-7-posts' );
		expect( authorPostsCsvExporter( 7, 'José Núñez' ).hasDateRange ).toBe( true );
	} );

	it( 'exports nothing for an author missing from the window', async () => {
		await expect(
			authorPostsCsvExporter( 42, 'Gone' ).fetchItems( REPORT_PARAMS )
		).resolves.toEqual( [] );
	} );
} );
