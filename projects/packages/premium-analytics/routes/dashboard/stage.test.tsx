/**
 * External dependencies
 */
import { queryClient, useReportScope } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { DATE_FILTER_RANGE, DATE_FILTER_YEAR } from './config';
import { useActiveSection, useDashboardSections, useSectionDateFilter } from './hooks';
import { stage as Dashboard } from './stage';
import type { SyncStatus } from '@jetpack-premium-analytics/site-sync';
import type { ReactNode } from 'react';

// Read inside the mocked functions, never at factory time: the factories run
// while `./stage` is still being imported, when these are in the temporal dead
// zone.
let mockSyncState: { data?: SyncStatus; error: Error | null; isComplete: boolean };
let mockIsSyncFinished: boolean;
const mockTriggerSync = jest.fn( () => Promise.resolve() );

jest.mock( '@jetpack-premium-analytics/site-sync', () => ( {
	useSyncStatus: () => ( { ...mockSyncState, triggerSync: mockTriggerSync } ),
} ) );

jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsInitialSyncFinished: () => mockIsSyncFinished,
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	Stack: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useReportDateFilters: () => ( {
		appliedRange: { from: undefined, to: undefined },
		range: { from: undefined, to: undefined },
		timeZone: 'UTC',
		intervalOptions: [],
		onChange: jest.fn(),
		onApply: jest.fn(),
		onIntervalChange: jest.fn(),
	} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => <MockHeaderScopeProbe />,
	DateIntervalDropdown: () => null,
	DateYearFilter: () => null,
	SectionHeader: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	SectionTabPanel: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
	getSectionSubtitle: () => '',
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

jest.mock( '@wordpress/data', () => ( { useSelect: () => [] } ) );

/**
 * Reads the scope the dashboard declares, from where the header's date controls
 * render. Both halves derive from the one declaration, so the header reads it
 * rather than being handed a prop.
 *
 * @return The declared scope, as text.
 */
function MockHeaderScopeProbe() {
	const { offersComparison } = useReportScope();

	return (
		<span>{ offersComparison ? 'header offers comparison' : 'header offers no comparison' }</span>
	);
}

/**
 * Reads the scope the dashboard declares, from where the widgets actually render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return <span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>;
}

jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children }: { children: ReactNode } ) => <div>{ children }</div>;
	WidgetDashboard.Actions = () => null;
	WidgetDashboard.NoWidgetsState = () => null;
	WidgetDashboard.Widgets = () => <MockScopeProbe />;
	WidgetDashboard.Commands = () => null;

	return { WidgetDashboard };
} );

jest.mock( './components', () => ( {
	DashboardSections: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	// Reads the shared query cache, which these tests don't stand up; the notice
	// has its own coverage in `use-refresh-failure` and `stale-data-notice`.
	RefreshFailureNotice: () => null,
	SectionSyncNotice: ( {
		percentage,
		hasError,
		isRetrying,
		onRetry,
	}: {
		percentage: number;
		hasError: boolean;
		isRetrying: boolean;
		onRetry: () => void;
	} ) => (
		<div>
			<span>{ `notice ${ percentage }% ${ hasError ? 'error' : 'syncing' }${
				isRetrying ? ' retrying' : ''
			}` }</span>
			<button type="button" onClick={ onRetry }>
				Try again
			</button>
		</div>
	),
} ) );

jest.mock( '../widget-module-i18n', () => ( {
	resolveWidgetModuleWithI18n: jest.fn(),
	useWidgetTypesWithI18n: () => [ [], false ],
} ) );

jest.mock( './hooks', () => ( {
	useActiveSection: jest.fn(),
	useDashboardGridSettings: () => [ {} ],
	useDashboardSectionLayout: () => [ [], jest.fn(), jest.fn() ],
	useDashboardSections: jest.fn(),
	useSectionDateFilter: jest.fn(),
} ) );

beforeEach( () => {
	mockSyncState = { data: undefined, error: null, isComplete: false };
	mockIsSyncFinished = false;
	mockTriggerSync.mockImplementation( () => Promise.resolve() );
} );

const useDashboardSectionsMock = jest.mocked( useDashboardSections );
const useSectionDateFilterMock = jest.mocked( useSectionDateFilter );
const useActiveSectionMock = jest.mocked( useActiveSection );

/**
 * Resolve the sections entity with one active section.
 *
 * @param overrides - Fields to override on that section.
 */
function mockSection( overrides: Record< string, unknown > = {} ) {
	useDashboardSectionsMock.mockReturnValue( {
		sections: [
			{
				slug: 'insights',
				label: 'Insights',
				title: 'Activity insights',
				date_filter: DATE_FILTER_YEAR,
				...overrides,
			},
		],
		hasResolved: true,
	} as unknown as ReturnType< typeof useDashboardSections > );
}

describe( 'Dashboard report scope', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn() ] );
	} );

	it( 'declares no comparison for a section whose header offers none', () => {
		mockSection();
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );

		render( <Dashboard /> );

		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();
	} );

	it( 'declares a comparison for a section whose header offers one', () => {
		mockSection( { date_filter: DATE_FILTER_RANGE } );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );

		render( <Dashboard /> );

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'declares no comparison for a range section that opted out', () => {
		mockSection( {
			date_filter: DATE_FILTER_RANGE,
			date_filter_options: { with_date_comparison: false },
		} );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );

		render( <Dashboard /> );

		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();
		expect( screen.getByText( 'header offers no comparison' ) ).toBeInTheDocument();
	} );

	it( 'updates the scope when switching between sections', () => {
		useDashboardSectionsMock.mockReturnValue( {
			sections: [
				{
					slug: 'traffic',
					label: 'Traffic',
					title: 'Traffic',
					date_filter: DATE_FILTER_RANGE,
				},
				{
					slug: 'insights',
					label: 'Insights',
					title: 'Activity insights',
					date_filter: DATE_FILTER_YEAR,
				},
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		const { rerender } = render( <Dashboard /> );

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		rerender( <Dashboard /> );
		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		rerender( <Dashboard /> );
		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );
} );

describe( 'Dashboard sync notice', () => {
	beforeEach( () => {
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
	} );

	it( 'annotates a section whose data is still syncing', () => {
		mockSection( { requires_sync: true } );
		mockSyncState = { data: { percentage: 40 } as SyncStatus, error: null, isComplete: false };

		render( <Dashboard /> );

		expect( screen.getByText( 'notice 40% syncing' ) ).toBeInTheDocument();
	} );

	it( 'leaves a section that does not depend on the sync unannotated', () => {
		mockSection();

		render( <Dashboard /> );

		expect( screen.queryByText( /^notice/ ) ).not.toBeInTheDocument();
	} );

	it( 'drops the notice once the sync has finished', () => {
		mockSection( { requires_sync: true } );
		mockIsSyncFinished = true;

		render( <Dashboard /> );

		expect( screen.queryByText( /^notice/ ) ).not.toBeInTheDocument();
	} );

	it( 'reports the retry as in flight until it settles', async () => {
		mockSection( { requires_sync: true } );
		mockSyncState = { data: undefined, error: new Error( 'nope' ), isComplete: false };

		let settleTrigger: () => void = () => {};
		mockTriggerSync.mockImplementation(
			() =>
				new Promise< void >( resolve => {
					settleTrigger = resolve;
				} )
		);

		render( <Dashboard /> );
		expect( screen.getByText( 'notice 0% error' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( mockTriggerSync ).toHaveBeenCalledTimes( 1 );
		// The notice derives its failure layout from these two together, so the
		// stage's job is to report the retry as in flight for as long as it runs.
		expect( screen.getByText( 'notice 0% error retrying' ) ).toBeInTheDocument();

		await act( async () => {
			settleTrigger();
		} );
		expect( screen.getByText( 'notice 0% error' ) ).toBeInTheDocument();
	} );

	it( 'refetches the reports once the sync completes', () => {
		const invalidate = jest.spyOn( queryClient, 'invalidateQueries' ).mockImplementation();
		mockSection( { requires_sync: true } );
		mockSyncState = { data: undefined, error: null, isComplete: true };

		render( <Dashboard /> );

		// Widgets that rendered mid-sync are holding numbers the sync has since
		// filled in.
		expect( invalidate ).toHaveBeenCalledWith( { queryKey: [ 'reports' ] } );
		invalidate.mockRestore();
	} );
} );
