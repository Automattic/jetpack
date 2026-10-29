/**
 * External dependencies
 */
import {
	isStatsFeatureLocked,
	ReportScopeProvider,
	useReportScope,
	useScopeLockedIntervals,
} from '@jetpack-premium-analytics/data';
import { render, renderHook, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useDateWindowNotice } from '../date-window-notice';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { stage as ReportStage } from './stage';
import { useReportParams } from './use-report-params';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	isStatsFeatureLocked: jest.fn( () => false ),
} ) );

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	Stack: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => jest.fn(),
	ChartsProvider: ( { children }: { children: ReactNode } ) => (
		<div data-testid="charts-provider">{ children }</div>
	),
} ) );

jest.mock( '../use-stats-date-limits', () => ( {
	useStatsDateLimits: jest.fn( () => ( { offersComparison: true } ) ),
} ) );

jest.mock( '../date-window-notice', () => ( {
	...jest.requireActual( '../date-window-notice' ),
	useDateWindowNotice: jest.fn(),
} ) );

jest.mock( './locked-report-page', () => ( {
	LockedReportPage: ( { feature }: { feature: string } ) => <span>{ `locked: ${ feature }` }</span>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useParams: () => ( { report: 'posts' } ),
	useSearch: () => ( {
		from: '2026-06-01T00:00:00+00:00',
		to: '2026-06-30T23:59:59+00:00',
		interval: 'day',
		preset: 'custom',
		comp: '1',
		compare_from: '2026-05-02T00:00:00+00:00',
		compare_to: '2026-05-31T23:59:59+00:00',
		compare_preset: 'previous-period',
	} ),
} ) );

/**
 * Reads the scope from where a report page renders.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();
	const lockedIntervals = useScopeLockedIntervals();

	return (
		<>
			<span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>
			<span>{ `locked: ${ lockedIntervals.join( ',' ) || 'none' }` }</span>
		</>
	);
}

const mockLoad = jest.fn( () => Promise.resolve( { default: MockScopeProbe } ) );
const mockGetReportDefinition = jest.fn(
	() => ( { load: mockLoad } ) as Record< string, unknown >
);

jest.mock( './registry', () => ( {
	getReportDefinition: () => mockGetReportDefinition(),
} ) );

describe( 'Report stage report scope', () => {
	afterEach( () => {
		jest.mocked( isStatsFeatureLocked ).mockReturnValue( false );
		jest.mocked( useStatsDateLimits ).mockReturnValue( { offersComparison: true } );
		mockGetReportDefinition.mockReturnValue( { load: mockLoad } );
		mockLoad.mockClear();
		delete window.JetpackScriptData;
	} );

	it( 'shows the locked page instead of loading a report the plan lacks', async () => {
		jest.mocked( isStatsFeatureLocked ).mockReturnValue( true );
		mockGetReportDefinition.mockReturnValue( {
			load: mockLoad,
			feature: 'utm',
			getLabel: () => 'UTM',
		} );

		render( <ReportStage /> );

		await expect( screen.findByText( 'locked: utm' ) ).resolves.toBeInTheDocument();
		expect( mockLoad ).not.toHaveBeenCalled();
	} );

	it( 'renders the report inside the charts provider, with no comparison', async () => {
		render( <ReportStage /> );

		const provider = await screen.findByTestId( 'charts-provider' );

		expect( provider ).toContainElement( await screen.findByText( 'no comparison' ) );
	} );

	it.each( [
		[ 'traffic', true ],
		[ 'ads', false ],
	] )( 'follows the plan’s date limits on a %s report: %p', async ( section, isLimited ) => {
		window.JetpackScriptData = {
			premium_analytics: { plan_date_limited_sections: [ 'traffic' ] },
		} as typeof window.JetpackScriptData;
		mockGetReportDefinition.mockReturnValue( { load: mockLoad, dashboardSection: section } );
		jest.mocked( useStatsDateLimits ).mockImplementation( limited =>
			limited
				? {
						offersComparison: true,
						dateLimits: { lockedPresetIds: [], lockedIntervals: [ 'week' ] },
					}
				: { offersComparison: true }
		);

		render( <ReportStage /> );

		await expect(
			screen.findByText( `locked: ${ isLimited ? 'week' : 'none' }` )
		).resolves.toBeInTheDocument();
		expect( useDateWindowNotice ).toHaveBeenCalled();
	} );
} );

describe( 'useReportParams', () => {
	/*
	 * A report offers no comparison control and its header names no compared
	 * period, so a delta in the table would have no baseline the reader can see.
	 */
	it( 'drops the comparison the URL carries in and keeps the window', () => {
		const { result } = renderHook( () => useReportParams(), {
			wrapper: ( { children } ) => (
				<ReportScopeProvider offersComparison={ false }>{ children }</ReportScopeProvider>
			),
		} );

		expect( result.current ).not.toHaveProperty( 'comp' );
		expect( result.current ).toMatchObject( {
			from: '2026-06-01T00:00:00+00:00',
			to: '2026-06-30T23:59:59+00:00',
			interval: 'day',
		} );
	} );

	// Guards the hook against re-hardcoding the strip: the surface decides, so a
	// surface that offers a comparison must get one.
	it( 'keeps the comparison where the surface offers one', () => {
		const { result } = renderHook( () => useReportParams() );

		expect( result.current ).toMatchObject( {
			comp: '1',
			compare_from: '2026-05-02T00:00:00+00:00',
		} );
	} );
} );
