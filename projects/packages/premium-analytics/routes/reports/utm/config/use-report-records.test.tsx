import {
	useStatsUtm,
	type ReportParams,
	type StatsUtmParam,
} from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useUtmReportRecords } from './use-report-records';
import type { UtmReportTabId } from './tabs';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsUtm: jest.fn(),
} ) );

const mockUseStatsUtm = useStatsUtm as jest.MockedFunction< typeof useStatsUtm >;

const REPORT_PARAMS = {
	from: '2026-06-01',
	to: '2026-06-07',
	interval: 'day',
} as ReportParams;

const TABS = [
	[ 'source-medium', 'utm_source,utm_medium' ],
	[ 'campaign-source-medium', 'utm_campaign,utm_source,utm_medium' ],
	[ 'source', 'utm_source' ],
	[ 'medium', 'utm_medium' ],
	[ 'campaign', 'utm_campaign' ],
] as const satisfies ReadonlyArray< readonly [ UtmReportTabId, StatsUtmParam ] >;

describe( 'useUtmReportRecords', () => {
	beforeEach( () => {
		mockUseStatsUtm.mockReset();
		mockUseStatsUtm.mockReturnValue( {
			primary: { data: undefined },
			isLoading: false,
		} as never );
	} );

	it.each( TABS )( 'only enables the %s request', ( activeTab, activeUtmParam ) => {
		renderHook( () => useUtmReportRecords( activeTab, REPORT_PARAMS ) );

		expect( mockUseStatsUtm ).toHaveBeenCalledTimes( TABS.length );
		TABS.forEach( ( [ , utmParam ], index ) => {
			const [ params, options ] = mockUseStatsUtm.mock.calls[ index ];

			expect( params ).toMatchObject( {
				utmParam,
				max: 0,
				summarize: 0,
				query_top_posts: false,
			} );
			expect( options ).toEqual( { enabled: utmParam === activeUtmParam } );
		} );
	} );
} );
