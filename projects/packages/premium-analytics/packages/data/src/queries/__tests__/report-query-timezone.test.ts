/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { resolveReportTimeZone } from '../../utils/report-timezone';
import { reportVisitorsQuery } from '../report-visitors-query';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../utils/report-timezone', () => ( {
	resolveReportTimeZone: jest.fn(),
} ) );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;
const mockResolveZone = resolveReportTimeZone as jest.MockedFunction<
	typeof resolveReportTimeZone
>;

const PARAMS = { from: '2026-06-01', to: '2026-06-07', interval: 'day' as const };

beforeEach( () => {
	mockResolveZone.mockReturnValue( 'Asia/Taipei' );
	mockApiFetch.mockResolvedValue( {
		data: [
			{
				time_interval: '2026-06-15',
				date_start: '2026-06-15T00:00:00Z',
				date_end: '2026-06-15T23:59:59Z',
				active_sessions: '3',
				visitors: '2',
			},
		],
		summary: { date_start: '', date_end: '', active_sessions: '3', visitors: '2' },
	} );
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'reportVisitorsQuery', () => {
	it( 'carries the reporting zone in the query key', () => {
		expect( reportVisitorsQuery( PARAMS ).queryKey ).toContain( 'Asia/Taipei' );
	} );

	// The key has to change with the zone, or a report normalized under the old one
	// is served after a change.
	it( 'keys a different zone separately', () => {
		const taipei = reportVisitorsQuery( PARAMS ).queryKey;

		mockResolveZone.mockReturnValue( 'America/New_York' );

		expect( reportVisitorsQuery( PARAMS ).queryKey ).not.toEqual( taipei );
	} );

	it( 'normalizes the response under that same zone', async () => {
		const queryFn = reportVisitorsQuery( PARAMS ).queryFn as () => Promise< unknown >;

		await expect( queryFn() ).resolves.toMatchObject( {
			data: [ { date_start: '2026-06-15T08:00:00' } ],
		} );
	} );
} );
