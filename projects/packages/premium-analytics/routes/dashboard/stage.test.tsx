/**
 * External dependencies
 */
import {
	DASHBOARD_PREFERENCES_SCOPE,
	PERIOD_CHANGE_ATTENTION_MS,
	queryClient,
	useRaisePeriodChange,
	useReportScope,
} from '@jetpack-premium-analytics/data';
import { createTZDateFromParts, endOfDayTZ } from '@jetpack-premium-analytics/datetime';
import { useDashboardOriginSearch } from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useStatsDateLimits } from '../use-stats-date-limits';
import { useWidgetTypesWithI18n } from '../widget-module-i18n';
import { onboardingTourSteps } from './components';
import { DATE_FILTER_RANGE, DATE_FILTER_YEAR } from './config';
import {
	useActiveSection,
	useDashboardPolicy,
	useDashboardSectionLayout,
	useDashboardSections,
	useLockedSectionLayout,
	useOnboarding,
	useSectionDateFilter,
} from './hooks';
import { stage as Dashboard } from './stage';
import type { LockedSectionGate } from '@jetpack-premium-analytics/data';
import type { SyncStatus } from '@jetpack-premium-analytics/site-sync';
import type { ForwardedRef, ReactNode } from 'react';

// Read inside the mocked functions, never at factory time — the factories run
// while `./stage` is still importing, so these are in the temporal dead zone.
// Base UI's `Tabs.Panel` defaults to `keepMounted={false}`, so only the active
// section is ever in the DOM; `mockMountedSectionSlugs` keeps extras for one frame.
let mockActiveSectionSlug = 'insights';
const JULY_2026 = {
	from: createTZDateFromParts( [ 2026, 6, 1 ], 'UTC' ),
	to: endOfDayTZ( createTZDateFromParts( [ 2026, 6, 31 ], 'UTC' ), 'UTC' ),
};
let mockAppliedRange: Partial< typeof JULY_2026 > = { from: undefined, to: undefined };
let mockMountedSectionSlugs: string[] | null = null;
let mockSyncState: { data?: SyncStatus; error: Error | null; isComplete: boolean };
let mockIsSyncFinished: boolean;
let mockSyncOptions: { enabled?: boolean; autoStart?: boolean } | undefined;
let mockIsAdmin: boolean;
let mockCanSendFeedback: boolean;
const mockResetLayout = jest.fn();
const mockChangeComparison = jest.fn();
const mockStepDateRange = jest.fn();
let mockDateFiltersPanelProps: {
	onChange: ( ...args: unknown[] ) => void;
	onComparisonChange: ( ...args: unknown[] ) => void;
	onApply: () => void;
	onStep: ( direction: 'previous' | 'next' ) => unknown;
};
const mockTriggerSync = jest.fn( () => Promise.resolve() );
const mockUseTrackedDateRangeApply = jest.fn<
	{ trackedOnChange: () => void; trackedOnApply: () => void },
	unknown[]
>( () => ( { trackedOnChange: () => {}, trackedOnApply: () => {} } ) );

jest.mock( '@jetpack-premium-analytics/site-sync', () => ( {
	useSyncStatus: ( options: typeof mockSyncOptions ) => {
		mockSyncOptions = options;
		return { ...mockSyncState, triggerSync: mockTriggerSync };
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	currentUserCan: () => mockIsAdmin,
} ) );

jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsInitialSyncFinished: () => mockIsSyncFinished,
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
} ) );

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const { forwardRef } = jest.requireActual( 'react' );
	// The stage hands a ref to the actions wrapper, so the stand-in must take one.
	const Stack = forwardRef( ( { children }: { children: ReactNode }, ref: never ) => (
		<div ref={ ref }>{ children }</div>
	) );
	Stack.displayName = 'Stack';
	const VisuallyHidden = ( { children, role }: { children: ReactNode; role?: string } ) => (
		<div role={ role }>{ children }</div>
	);

	const JetpackFooter = () => <footer>Jetpack footer</footer>;

	return { JetpackFooter, Stack, VisuallyHidden };
} );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useReportDateFilters: () => ( {
		appliedRange: mockAppliedRange,
		range: { from: undefined, to: undefined },
		timeZone: 'UTC',
		intervalOptions: [],
		onChange: jest.fn(),
		onComparisonChange: mockChangeComparison,
		onApply: jest.fn(),
		onIntervalChange: jest.fn(),
		onStep: mockStepDateRange,
	} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: (
		props: typeof mockDateFiltersPanelProps & {
			attentionId?: number;
			withIntervalControl?: boolean;
		}
	) => {
		mockDateFiltersPanelProps = props;
		return (
			<>
				<MockHeaderScopeProbe />
				<MockAttentionProbe { ...props } />
				{ props.withIntervalControl && <span>header interval</span> }
			</>
		);
	},
	PeriodChangeStatus: jest.requireActual( '../../packages/ui/src/period-change-status' )
		.PeriodChangeStatus,
	DateIntervalDropdown: () => <span>interval control</span>,
	DateYearFilter: ( { containerElement }: { containerElement?: HTMLElement | null } ) => (
		<>
			<span>year surface</span>
			<span>{ containerElement ? 'measuring header' : 'measuring body' }</span>
		</>
	),
	OnboardingWelcomeModal: ( { open }: { open: boolean } ) =>
		open ? <div data-testid="onboarding-welcome-modal" /> : null,
	// Forwards the ref, which feeds the year surface's measurement.
	SectionHeader: jest
		.requireActual< typeof import( 'react' ) >( 'react' )
		.forwardRef( ( { children }: { children: ReactNode }, ref: ForwardedRef< HTMLDivElement > ) => (
			<div ref={ ref }>{ children }</div>
		) ),
	SectionTabPanel: ( { value, children }: { value: string; children: ReactNode } ) =>
		( mockMountedSectionSlugs ?? [ mockActiveSectionSlug ] ).includes( value ) ? (
			<div>{ children }</div>
		) : null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

const mockTrackCustomize = {
	start: jest.fn(),
	layoutChange: jest.fn(),
	exit: jest.fn(),
	reset: jest.fn(),
};

jest.mock( '@wordpress/route', () => ( {
	...jest.requireActual( '@wordpress/route' ),
	useNavigate: () => jest.fn(),
	useSearch: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '../../packages/widgets-toolkit/src/hooks/use-dashboard-origin-search' ),
	useTrackCustomize: () => mockTrackCustomize,
	canSendFeedback: () => mockCanSendFeedback,
	PageOptionsMenu: ( { onCustomize }: { onCustomize?: () => void } ) => (
		<div data-testid="page-options-menu">
			{ onCustomize && (
				<button type="button" onClick={ onCustomize }>
					Customize
				</button>
			) }
		</div>
	),
	ResetLayoutAction: ( { onReset }: { onReset: () => void } ) => (
		<button type="button" onClick={ onReset }>
			Reset to default
		</button>
	),
	useTrackedDateRangeApply: ( ...args: unknown[] ) => mockUseTrackedDateRangeApply( ...args ),
} ) );

jest.mock( '../use-stats-date-limits', () => ( {
	useStatsDateLimits: jest.fn( () => ( { offersComparison: true } ) ),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<div>
			<div data-testid="page-actions">{ actions }</div>
			{ children }
		</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	...jest.requireActual( '@wordpress/components' ),
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

jest.mock( '../use-widget-modules', () => ( { useWidgetModules: () => [] } ) );

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
 * Reads the dashboard origin a widget's links carry, from where the widgets render.
 *
 * @return The origin, as text.
 */
function MockOriginProbe() {
	const origin = useDashboardOriginSearch();
	return <span>origin: { origin.ds ?? 'none' }</span>;
}

/**
 * Reads the scope the dashboard declares, from where the widgets actually render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison, openPeriod, dateLimits } = useReportScope();
	const raisePeriodChange = useRaisePeriodChange();
	const openJuly = useCallback(
		() => raisePeriodChange( 'traffic', JULY_2026 ),
		[ raisePeriodChange ]
	);
	const setJuly = useCallback( () => openPeriod?.( JULY_2026 ), [ openPeriod ] );

	return (
		<>
			<span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>
			<span>locked: { dateLimits?.lockedPresetIds.join( ', ' ) || 'none' }</span>
			<button type="button" onClick={ openJuly }>
				Open July from a widget
			</button>
			<button type="button" onClick={ setJuly }>
				Set July from a chart on this section
			</button>
		</>
	);
}

// Stands in for the period trigger: shows the id it was handed.
const MockAttentionProbe = ( { attentionId }: { attentionId?: number } ) => (
	<span data-testid="attention">{ attentionId ?? 'no attention' }</span>
);

// What the stand-in's Done commits, so a test can name the layout the stage was handed.
const mockCommittedLayout = [ { uuid: 'moved', type: 'jpa/moved' } ];
// The layout and save handler the stage last handed the dashboard.
let mockDashboardProps: { layout?: unknown; onLayoutChange?: unknown } = {};

jest.mock( '@wordpress/widget-dashboard', () => {
	const React = jest.requireActual( 'react' );

	const EditModeContext = React.createContext( {
		editMode: false,
		onEditChange: () => {},
		onLayoutChange: () => {},
	} );

	const WidgetDashboard = ( {
		editMode = false,
		onEditChange = () => {},
		onLayoutChange = () => {},
		layout,
		children,
	}: {
		editMode?: boolean;
		onEditChange?: ( next: boolean ) => void;
		onLayoutChange?: ( layout: unknown ) => void;
		layout?: unknown;
		children: ReactNode;
	} ) => {
		mockDashboardProps = { layout, onLayoutChange };
		const value = React.useMemo(
			() => ( { editMode, onEditChange, onLayoutChange } ),
			[ editMode, onEditChange, onLayoutChange ]
		);

		return (
			<EditModeContext.Provider value={ value }>
				<div>{ children }</div>
			</EditModeContext.Provider>
		);
	};

	/**
	 * The real dashboard hands `editMode` and `onEditChange` to `Actions` through its
	 * context; the stand-in does the same so Done and Cancel round-trip. Customize is
	 * the page options menu's, and the stage mounts this while customizing only.
	 *
	 * @return The stand-in edit toolbar.
	 */
	function Actions() {
		const { editMode, onEditChange, onLayoutChange } = React.useContext( EditModeContext );
		const cancel = React.useCallback( () => onEditChange( false ), [ onEditChange ] );
		// Done commits the layout and leaves edit mode in one call, as the real `commit()` does.
		const done = React.useCallback( () => {
			onLayoutChange( mockCommittedLayout );
			onEditChange( false );
		}, [ onEditChange, onLayoutChange ] );

		return (
			<div data-testid="widget-dashboard-actions">
				{ editMode ? (
					<>
						<button type="button" onClick={ cancel }>
							Cancel
						</button>
						<button type="button" onClick={ done }>
							Done
						</button>
					</>
				) : null }
			</div>
		);
	}
	WidgetDashboard.Actions = Actions;
	WidgetDashboard.NoWidgetsState = () => <div data-testid="no-widgets-state" />;
	WidgetDashboard.Widgets = () => (
		<div data-testid="widgets">
			<MockScopeProbe />
			<MockOriginProbe />
		</div>
	);
	WidgetDashboard.Commands = () => null;
	WidgetDashboard.Policy = ( {
		canPerform,
		children,
	}: {
		canPerform: ( request: { operation: string } ) => boolean;
		children: ReactNode;
	} ) => (
		<div
			data-testid="dashboard-policy"
			data-can-customize={ String( canPerform( { operation: 'customize' } ) ) }
		>
			{ children }
		</div>
	);

	return { WidgetDashboard };
} );

jest.mock( './components', () => ( {
	DashboardSections: ( {
		children,
		withSettingsTab,
		isSettingsTabDisabled,
	}: {
		children: ReactNode;
		withSettingsTab?: boolean;
		isSettingsTabDisabled?: boolean;
	} ) => (
		<div
			data-testid="dashboard-sections"
			data-settings-tab={
				withSettingsTab ? ( isSettingsTabDisabled && 'disabled' ) || 'enabled' : 'none'
			}
		>
			{ children }
		</div>
	),
	StatsSettingsPanel: () => null,
	// A marker, not the real banner, which owns its own preference. Covered
	// here: which section the stage offers it on, and when.
	FeedbackBanner: ( { enabled }: { enabled: boolean } ) =>
		enabled ? <div data-testid="feedback-banner" /> : null,
	LockedSection: ( { section }: { section: string } ) => (
		<div data-testid="locked-section">{ section }</div>
	),
	OnboardingTour: () => <div data-testid="onboarding-tour" />,
	onboardingTourSteps: jest.fn( () => [] ),
	DashboardNotices: () => <div data-testid="dashboard-notices" />,
	// A marker, not the real notice, which reads a query cache these tests do not
	// stand up. Covered here: where the stage puts it.
	RefreshFailureNotice: () => <div data-testid="refresh-failure-notice" />,
	SectionNotice: ( { message }: { message: string } ) => (
		<div>{ `section notice: ${ message }` }</div>
	),
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
	useWidgetModuleResolver: () => jest.fn(),
	useWidgetTypesWithI18n: jest.fn( () => [ [], false ] ),
} ) );

jest.mock( './config', () => {
	const actual = jest.requireActual( './config' );

	return {
		...actual,
		// Most section fixtures here carry no default layout.
		getInsertableWidgetTypeNames: ( sections: Array< Record< string, unknown > > ) =>
			actual.getInsertableWidgetTypeNames(
				sections.map( section => ( { default_layout: [], ...section } ) )
			),
	};
} );

jest.mock( './hooks', () => ( {
	useActiveSection: jest.fn(),
	useDashboardGridSettings: () => [ {} ],
	useDashboardPolicy: jest.fn( () => () => true ),
	useDashboardSectionLayout: jest.fn( () => [ [], jest.fn(), mockResetLayout ] ),
	useDashboardSections: jest.fn(),
	useLockedSectionLayout: jest.fn(),
	useOnboarding: jest.fn(),
	useRememberAppliedPreset: jest.requireActual( './hooks/use-remember-applied-preset' )
		.useRememberAppliedPreset,
	useSectionDateFilter: jest.fn(),
} ) );

beforeEach( () => {
	mockSyncState = { data: undefined, error: null, isComplete: false };
	mockIsSyncFinished = false;
	mockSyncOptions = undefined;
	mockIsAdmin = true;
	mockCanSendFeedback = true;
	delete window.JetpackScriptData;
	mockMountedSectionSlugs = null;
	mockTriggerSync.mockImplementation( () => Promise.resolve() );
	useOnboardingMock.mockReturnValue( closedOnboarding );
	useLockedSectionLayoutMock.mockImplementation( passThroughLockedLayout );
	useDashboardPolicyMock.mockImplementation( () => () => true );
	useDashboardSectionLayoutMock.mockImplementation( () => [ [], jest.fn(), mockResetLayout ] );
	mockUseTrackedDateRangeApply.mockImplementation( () => ( {
		trackedOnChange: () => {},
		trackedOnApply: () => {},
	} ) );
	mockStepDateRange.mockReturnValue( undefined );
	mockDashboardProps = {};
} );

const useDashboardSectionsMock = jest.mocked( useDashboardSections );
const useSectionDateFilterMock = jest.mocked( useSectionDateFilter );
const useActiveSectionMock = jest.mocked( useActiveSection );
const useDashboardPolicyMock = jest.mocked( useDashboardPolicy );
const useOnboardingMock = jest.mocked( useOnboarding );
const useLockedSectionLayoutMock = jest.mocked( useLockedSectionLayout );
const useDashboardSectionLayoutMock = jest.mocked( useDashboardSectionLayout );

/**
 * What the hook returns for a section the plan leaves open.
 *
 * @param _section       - The section slug.
 * @param layout         - The stored layout.
 * @param onLayoutChange - Stores a layout.
 * @return The open section's layout and save handler, unchanged.
 */
const passThroughLockedLayout: typeof useLockedSectionLayout = (
	_section,
	layout,
	onLayoutChange
) => ( {
	lockedSection: undefined,
	visibleLayout: layout,
	onVisibleLayoutChange: onLayoutChange,
	isHiddenWidget: undefined,
} );

const closedOnboarding = {
	phase: 'closed' as const,
	step: 0,
	flow: 'stats' as const,
	start: jest.fn(),
	next: jest.fn(),
	dismiss: jest.fn(),
};

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
				title: 'Site insights',
				date_filter: DATE_FILTER_YEAR,
				...overrides,
			},
		],
		hasResolved: true,
	} as unknown as ReturnType< typeof useDashboardSections > );
}

beforeEach( () => {
	jest.mocked( useStatsDateLimits ).mockReturnValue( { offersComparison: true } );
} );

describe( 'Dashboard page', () => {
	it( 'ends the page with the Jetpack footer', () => {
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		mockSection();

		render( <Dashboard /> );

		expect( screen.getByText( 'Jetpack footer' ) ).toBeInTheDocument();
	} );
} );

describe( 'Dashboard report scope', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
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
					title: 'Site insights',
					date_filter: DATE_FILTER_YEAR,
				},
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		const { rerender } = render( <Dashboard /> );

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		rerender( <Dashboard /> );
		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		rerender( <Dashboard /> );
		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'offers and tracks no comparison where the plan rules one out, though the section allows it', () => {
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		jest.mocked( useStatsDateLimits ).mockReturnValue( { offersComparison: false } );

		render( <Dashboard /> );

		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();
		expect( mockUseTrackedDateRangeApply ).toHaveBeenLastCalledWith(
			expect.any( Object ),
			expect.objectContaining( { offersComparison: false } )
		);
	} );

	it( "declares the plan's date limits to the widgets and the date tracking", () => {
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		jest.mocked( useStatsDateLimits ).mockReturnValue( {
			offersComparison: false,
			dateLimits: { lockedPresetIds: [ 'last-30-days' ], lockedIntervals: [ 'week' ] },
		} );

		render( <Dashboard /> );

		expect( screen.getByText( 'locked: last-30-days' ) ).toBeInTheDocument();
		expect( mockUseTrackedDateRangeApply ).toHaveBeenLastCalledWith(
			expect.any( Object ),
			expect.objectContaining( { lockedIntervals: [ 'week' ] } )
		);
	} );

	it.each( [
		[ 'traffic', DATE_FILTER_RANGE, true ],
		[ 'insights', DATE_FILTER_YEAR, false ],
	] as const )( 'applies the plan date limits on %s: %p', ( slug, dateFilter, isLimited ) => {
		window.JetpackScriptData = {
			premium_analytics: { plan_date_limited_sections: [ 'traffic' ] },
		} as typeof window.JetpackScriptData;
		mockSection( { slug, date_filter: dateFilter } );
		useActiveSectionMock.mockReturnValue( [ slug, jest.fn(), true ] );
		mockActiveSectionSlug = slug;
		useSectionDateFilterMock.mockReturnValue( dateFilter );

		render( <Dashboard /> );

		expect( useStatsDateLimits ).toHaveBeenLastCalledWith( isLimited );
	} );

	it( 'holds the next tab’s widgets until the URL carries the switch', () => {
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), false ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );

		render( <Dashboard /> );

		expect( screen.queryByText( 'offers comparison' ) ).not.toBeInTheDocument();
		expect( useSectionDateFilterMock ).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.anything(),
			false
		);
	} );

	it( 'names the active tab to the widgets, so their links can return to it', () => {
		useDashboardSectionsMock.mockReturnValue( {
			sections: [
				{ slug: 'traffic', label: 'Traffic', title: 'Traffic', date_filter: DATE_FILTER_RANGE },
				{
					slug: 'insights',
					label: 'Insights',
					title: 'Site insights',
					date_filter: DATE_FILTER_YEAR,
				},
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		const { rerender } = render( <Dashboard /> );

		expect( screen.getByText( 'origin: traffic' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		rerender( <Dashboard /> );
		expect( screen.getByText( 'origin: insights' ) ).toBeInTheDocument();
	} );
} );

describe( 'Dashboard period change signal', () => {
	const sections = [
		{ slug: 'traffic', label: 'Traffic', title: 'Traffic', date_filter: DATE_FILTER_RANGE },
		{
			slug: 'insights',
			label: 'Insights',
			title: 'Activity insights',
			date_filter: DATE_FILTER_YEAR,
		},
	];

	beforeEach( () => {
		jest.clearAllMocks();
		useDashboardSectionsMock.mockReturnValue( {
			sections,
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		mockAppliedRange = { from: undefined, to: undefined };
	} );

	it( 'draws attention to a period a widget set once the section shows it', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { rerender } = render( <Dashboard /> );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();

		await user.click( screen.getByRole( 'button', { name: 'Open July from a widget' } ) );

		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		mockAppliedRange = JULY_2026;
		rerender( <Dashboard /> );

		expect( screen.getByTestId( 'attention' ) ).toHaveTextContent( /^\d+$/ );
		await expect( screen.findByRole( 'status' ) ).resolves.toHaveTextContent(
			'Date range updated to July 2026.'
		);

		act( () => {
			jest.advanceTimersByTime( PERIOD_CHANGE_ATTENTION_MS );
		} );
		expect( screen.getByTestId( 'attention' ) ).toHaveTextContent( 'no attention' );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
		jest.useRealTimers();
	} );

	it( 'draws attention to a period a widget set on the section it sits in', async () => {
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		const user = userEvent.setup();
		const { rerender } = render( <Dashboard /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Set July from a chart on this section' } )
		);
		mockAppliedRange = JULY_2026;
		rerender( <Dashboard /> );

		expect( screen.getByTestId( 'attention' ) ).toHaveTextContent( /^\d+$/ );
	} );

	it( 'lets a signal go when the reader lands on another section instead', async () => {
		const user = userEvent.setup();
		const { rerender } = render( <Dashboard /> );

		await user.click( screen.getByRole( 'button', { name: 'Open July from a widget' } ) );

		useActiveSectionMock.mockReturnValue( [ 'store', jest.fn(), true ] );
		mockActiveSectionSlug = 'store';
		rerender( <Dashboard /> );

		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		mockAppliedRange = JULY_2026;
		rerender( <Dashboard /> );

		expect( screen.getByTestId( 'attention' ) ).toHaveTextContent( 'no attention' );
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );
} );

describe( 'Dashboard refresh-failure notice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
	} );

	it( 'renders one notice in the section body, however many sections there are', () => {
		useDashboardSectionsMock.mockReturnValue( {
			sections: [
				{ slug: 'traffic', label: 'Traffic', title: 'Traffic', date_filter: DATE_FILTER_RANGE },
				{ slug: 'insights', label: 'Insights', title: 'Insights', date_filter: DATE_FILTER_YEAR },
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );

		render( <Dashboard /> );

		// One page, one Retry: the notice speaks for the whole grid.
		const notices = screen.getAllByTestId( 'refresh-failure-notice' );
		expect( notices ).toHaveLength( 1 );

		// The page's notice, not the header's: it scrolls with the widgets.
		// eslint-disable-next-line testing-library/no-node-access -- The section body has no accessible query target.
		expect( screen.getByTestId( 'dashboard-notices' ).parentElement ).toContainElement(
			notices[ 0 ]
		);
	} );
} );

describe( 'Dashboard feedback banner', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
	} );

	it( 'stands above the widgets of the default section', () => {
		render( <Dashboard /> );

		// `offers comparison` is where the widgets render; the banner reads above them.
		const banner = screen.getByTestId( 'feedback-banner' );
		expect( banner.compareDocumentPosition( screen.getByText( 'offers comparison' ) ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	it( 'is not offered to a reader who cannot send feedback', () => {
		mockCanSendFeedback = false;

		render( <Dashboard /> );

		expect( screen.queryByTestId( 'feedback-banner' ) ).not.toBeInTheDocument();
	} );

	it( 'holds off on a section the copy does not speak for', () => {
		useDashboardSectionsMock.mockReturnValue( {
			sections: [
				{ slug: 'traffic', label: 'Traffic', title: 'Traffic', date_filter: DATE_FILTER_RANGE },
				{ slug: 'insights', label: 'Insights', title: 'Insights', date_filter: DATE_FILTER_YEAR },
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );

		render( <Dashboard /> );

		expect( screen.queryByTestId( 'feedback-banner' ) ).not.toBeInTheDocument();
	} );

	it( 'waits for the onboarding journey that introduces the tab', () => {
		useOnboardingMock.mockReturnValue( { ...closedOnboarding, phase: 'modal' } );

		render( <Dashboard /> );

		expect( screen.queryByTestId( 'feedback-banner' ) ).not.toBeInTheDocument();
	} );

	it( 'stands aside while the reader arranges the layout', async () => {
		render( <Dashboard /> );
		expect( screen.getByTestId( 'feedback-banner' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( screen.queryByTestId( 'feedback-banner' ) ).not.toBeInTheDocument();
	} );

	it( 'puts the Stats notices away while the reader arranges the layout', async () => {
		render( <Dashboard /> );
		expect( screen.getByTestId( 'dashboard-notices' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( screen.queryByTestId( 'dashboard-notices' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Dashboard options menu', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
	} );

	it( "follows the dashboard's own actions and Reset to default while customizing", async () => {
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		const menu = screen.getByTestId( 'page-options-menu' );

		expect( screen.queryByTestId( 'widget-dashboard-actions' ) ).not.toBeInTheDocument();

		await userEvent.click( within( menu ).getByRole( 'button', { name: 'Customize' } ) );

		const actions = screen.getByTestId( 'widget-dashboard-actions' );
		const reset = screen.getByRole( 'button', { name: 'Reset to default' } );

		// The menu's frame, the tour's anchor, comes last.
		// eslint-disable-next-line testing-library/no-node-access -- order within the actions slot is what this test is for.
		expect( actions.nextElementSibling ).toBe( reset );
		// eslint-disable-next-line testing-library/no-node-access -- same order check.
		expect( reset.nextElementSibling ).toContainElement( menu );
	} );

	it( 'tracks entering, leaving and resetting the customize mode', async () => {
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		const menu = screen.getByTestId( 'page-options-menu' );

		await userEvent.click( within( menu ).getByRole( 'button', { name: 'Customize' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( mockTrackCustomize.start ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackCustomize.exit ).toHaveBeenCalledTimes( 1 );

		await userEvent.click( within( menu ).getByRole( 'button', { name: 'Customize' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );

		expect( mockTrackCustomize.reset ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackCustomize.exit ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'hands the committed layout to the tracking before leaving edit mode', async () => {
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		const menu = screen.getByTestId( 'page-options-menu' );

		await userEvent.click( within( menu ).getByRole( 'button', { name: 'Customize' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( mockTrackCustomize.layoutChange ).toHaveBeenCalledWith( [], mockCommittedLayout );
		expect( mockTrackCustomize.layoutChange.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockTrackCustomize.exit.mock.invocationCallOrder[ 0 ]
		);
	} );
} );

describe( 'Dashboard onboarding', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		useOnboardingMock.mockReturnValue( closedOnboarding );
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
	} );

	it( 'runs the journey on the default section at rest', () => {
		render( <Dashboard /> );

		expect( useOnboardingMock ).toHaveBeenLastCalledWith(
			expect.objectContaining( { enabled: true } )
		);
	} );

	it( 'holds the journey while another section is active', () => {
		useActiveSectionMock.mockReturnValue( [ 'store', jest.fn(), true ] );
		mockActiveSectionSlug = 'store';

		render( <Dashboard /> );

		expect( useOnboardingMock ).toHaveBeenLastCalledWith(
			expect.objectContaining( { enabled: false } )
		);
	} );

	it( 'opens the welcome modal when the journey reaches it', () => {
		useOnboardingMock.mockReturnValue( { ...closedOnboarding, phase: 'modal' } );

		render( <Dashboard /> );

		expect( screen.getByTestId( 'onboarding-welcome-modal' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'onboarding-tour' ) ).not.toBeInTheDocument();
	} );

	it.each( [ true, false ] )(
		'tells the tour whether the plan offers a comparison (%s)',
		offersComparison => {
			jest.mocked( useStatsDateLimits ).mockReturnValue( { offersComparison } );

			render( <Dashboard /> );

			expect( jest.mocked( onboardingTourSteps ) ).toHaveBeenLastCalledWith(
				expect.anything(),
				expect.objectContaining( { withComparison: offersComparison } )
			);
		}
	);

	it( 'runs the tour once the modal hands over', () => {
		useOnboardingMock.mockReturnValue( { ...closedOnboarding, phase: 'tour' } );

		render( <Dashboard /> );

		expect( screen.getByTestId( 'onboarding-tour' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'onboarding-welcome-modal' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Dashboard sync notice', () => {
	beforeEach( () => {
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
	} );

	it( 'annotates a section whose data is still syncing', () => {
		mockSection( { requires_sync: true } );
		mockSyncState = { data: { percentage: 40 } as SyncStatus, error: null, isComplete: false };

		render( <Dashboard /> );

		expect( screen.getByText( 'notice 40% syncing' ) ).toBeInTheDocument();
	} );

	it( 'neither polls nor starts the sync for a reader who cannot run it', () => {
		mockSection( { requires_sync: true } );
		mockIsAdmin = false;

		render( <Dashboard /> );

		expect( mockSyncOptions?.enabled ).toBe( false );
	} );

	it( 'leaves a section that does not depend on the sync unannotated', () => {
		mockSection();

		render( <Dashboard /> );

		expect( screen.queryByText( /^notice/ ) ).not.toBeInTheDocument();
	} );

	it( "shows the registration's notice once the section is not waiting on the sync", () => {
		mockSection( { requires_sync: true, notice: 'No orders yet.' } );
		mockIsSyncFinished = true;

		render( <Dashboard /> );

		expect( screen.getByText( 'section notice: No orders yet.' ) ).toBeInTheDocument();
	} );

	it( "holds the registration's notice back while the sync notice shows", () => {
		mockSection( { requires_sync: true, notice: 'No orders yet.' } );
		mockSyncState = { data: { percentage: 40 } as SyncStatus, error: null, isComplete: false };

		render( <Dashboard /> );

		expect( screen.getByText( 'notice 40% syncing' ) ).toBeInTheDocument();
		expect( screen.queryByText( /^section notice/ ) ).not.toBeInTheDocument();
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

describe( 'Dashboard header date control', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
	} );

	afterEach( () => {
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', undefined );
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'comparison', undefined );
	} );

	it( 'renders the control by default', () => {
		mockSection( { date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );

		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();
		expect( screen.getByText( 'header interval' ) ).toBeInTheDocument();
	} );

	it( 'keeps the range but drops the interval for a section whose charts own it', () => {
		mockSection( {
			date_filter: DATE_FILTER_RANGE,
			date_filter_options: { with_date_comparison: true, with_header_interval_control: false },
		} );

		render( <Dashboard /> );

		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'header interval' ) ).not.toBeInTheDocument();
	} );

	it( 'remembers a preset applied from the header', () => {
		mockSection( { date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		act( () => {
			mockDateFiltersPanelProps.onChange( JULY_2026, 'last-30-days' );
			mockDateFiltersPanelProps.onApply();
		} );

		expect( select( preferencesStore ).get( DASHBOARD_PREFERENCES_SCOPE, 'datePreset' ) ).toBe(
			'last-30-days'
		);
	} );

	it( 'tracks a step from the header as an applied range and remembers the preset it lands on', () => {
		const trackedOnChange = jest.fn();
		const trackedOnApply = jest.fn();
		mockUseTrackedDateRangeApply.mockReturnValue( { trackedOnChange, trackedOnApply } );
		mockStepDateRange.mockReturnValue( { range: JULY_2026, presetId: 'last-month' } );
		mockSection( { date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		act( () => {
			mockDateFiltersPanelProps.onStep( 'previous' );
		} );

		expect( mockStepDateRange ).toHaveBeenCalledWith( 'previous' );
		expect( trackedOnChange ).toHaveBeenCalledWith( JULY_2026, 'last-month', { exactRange: true } );
		expect( trackedOnApply ).toHaveBeenCalledTimes( 1 );
		expect( select( preferencesStore ).get( DASHBOARD_PREFERENCES_SCOPE, 'datePreset' ) ).toBe(
			'last-month'
		);
	} );

	it( 'neither tracks nor remembers a step the filters refused', () => {
		const trackedOnChange = jest.fn();
		mockUseTrackedDateRangeApply.mockReturnValue( { trackedOnChange, trackedOnApply: jest.fn() } );
		mockStepDateRange.mockReturnValue( undefined );
		mockSection( { date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		act( () => {
			mockDateFiltersPanelProps.onStep( 'previous' );
		} );

		expect( trackedOnChange ).not.toHaveBeenCalled();
		expect(
			select( preferencesStore ).get( DASHBOARD_PREFERENCES_SCOPE, 'datePreset' )
		).toBeUndefined();
	} );

	it( 'applies and remembers No comparison picked from the header', () => {
		mockSection( { date_filter: DATE_FILTER_RANGE } );

		render( <Dashboard /> );
		act( () => {
			mockDateFiltersPanelProps.onComparisonChange( undefined, undefined );
		} );

		expect( mockChangeComparison ).toHaveBeenCalledWith( undefined, undefined );
		expect( select( preferencesStore ).get( DASHBOARD_PREFERENCES_SCOPE, 'comparison' ) ).toBe(
			'none'
		);
	} );

	it( 'renders no control for a section that hands it to its widgets', () => {
		mockSection( {
			date_filter: DATE_FILTER_RANGE,
			date_filter_options: { with_date_comparison: false, with_header_date_control: false },
		} );

		render( <Dashboard /> );

		// The probe `DateFiltersPanel` renders is how we see whether it mounted.
		expect( screen.queryByText( /^header offers/ ) ).not.toBeInTheDocument();
	} );

	// Moving the control must not strip the params the widgets fetch with.
	it( 'keeps the comparison scope when only the placement moves', () => {
		mockSection( {
			date_filter: DATE_FILTER_RANGE,
			date_filter_options: { with_date_comparison: true, with_header_date_control: false },
		} );

		render( <Dashboard /> );

		expect( screen.queryByText( /^header offers/ ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'renders neither the year surface nor the interval when a year section hands them over', () => {
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		mockSection( {
			date_filter_options: { with_date_comparison: false, with_header_date_control: false },
		} );

		render( <Dashboard /> );

		expect( screen.queryByText( /^year surface/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /^interval/ ) ).not.toBeInTheDocument();
	} );

	// A payload served before the field existed carries no placement.
	it( 'keeps the control for a section that carries no placement', () => {
		mockSection( {
			date_filter: DATE_FILTER_RANGE,
			date_filter_options: { with_date_comparison: true },
		} );

		render( <Dashboard /> );

		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'keeps measuring the header after a tab switch unmounts the previous panel', () => {
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
					title: 'Site insights',
					date_filter: DATE_FILTER_YEAR,
				},
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		mockMountedSectionSlugs = [ 'traffic' ];
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		const { rerender } = render( <Dashboard /> );

		// Tabs.Panel mounts the incoming panel a frame before the outgoing one
		// unmounts. Model that overlap, then the leave, or the null never fires.
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		mockMountedSectionSlugs = [ 'traffic', 'insights' ];
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		rerender( <Dashboard /> );

		mockMountedSectionSlugs = [ 'insights' ];
		rerender( <Dashboard /> );

		expect( screen.getByText( 'measuring header' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'measuring body' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Dashboard inserter', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		useDashboardSectionsMock.mockReturnValue( {
			sections: [
				{
					slug: 'traffic',
					label: 'Traffic',
					date_filter: DATE_FILTER_RANGE,
					default_layout: [ { uuid: 'default-traffic-chart', type: 'jpa/traffic-chart' } ],
					insertable_widget_types: [ 'jpa/devices' ],
				},
				{
					slug: 'insights',
					label: 'Insights',
					date_filter: DATE_FILTER_YEAR,
					default_layout: [ { uuid: 'default-latest-post', type: 'jpa/latest-post' } ],
				},
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
	} );

	it( 'offers the widget types the active section places by default or declares insertable', () => {
		const { rerender } = render( <Dashboard /> );

		expect( useDashboardPolicyMock ).toHaveBeenLastCalledWith( {
			insertableWidgetTypes: new Set( [ 'jpa/traffic-chart', 'jpa/devices' ] ),
		} );

		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		rerender( <Dashboard /> );

		expect( useDashboardPolicyMock ).toHaveBeenLastCalledWith( {
			insertableWidgetTypes: new Set( [ 'jpa/latest-post' ] ),
		} );
	} );

	it( 'hands the policy the same set while the active section stays', () => {
		const { rerender } = render( <Dashboard /> );
		const [ first ] = useDashboardPolicyMock.mock.lastCall ?? [];

		rerender( <Dashboard /> );
		const [ second ] = useDashboardPolicyMock.mock.lastCall ?? [];

		expect( second?.insertableWidgetTypes ).toBe( first?.insertableWidgetTypes );
	} );
} );

describe( 'Dashboard customizing', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
	} );

	it( 'hides the date controls while customizing', async () => {
		render( <Dashboard /> );
		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( screen.queryByText( /^header offers/ ) ).not.toBeInTheDocument();
		// The widgets keep reporting over the same range meanwhile.
		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'hides the year surface too', async () => {
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		mockSection();

		render( <Dashboard /> );
		expect( screen.getByText( 'year surface' ) ).toBeInTheDocument();
		expect( screen.getByText( 'interval control' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( screen.queryByText( 'year surface' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'interval control' ) ).not.toBeInTheDocument();
	} );

	it( 'offers Customize from the page options menu, and withdraws it while customizing', async () => {
		render( <Dashboard /> );
		const menu = screen.getByTestId( 'page-options-menu' );

		await userEvent.click( within( menu ).getByRole( 'button', { name: 'Customize' } ) );

		expect( within( menu ).queryByRole( 'button', { name: 'Customize' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Done' } ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( within( menu ).getByRole( 'button', { name: 'Customize' } ) ).toBeInTheDocument();
	} );

	it( "offers Reset to default beside the dashboard's own actions while customizing", async () => {
		render( <Dashboard /> );
		const menu = screen.getByTestId( 'page-options-menu' );
		expect( screen.queryByRole( 'button', { name: 'Reset to default' } ) ).not.toBeInTheDocument();

		await userEvent.click( within( menu ).getByRole( 'button', { name: 'Customize' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );

		expect( mockResetLayout ).toHaveBeenCalledTimes( 1 );
		expect( screen.queryByRole( 'button', { name: 'Done' } ) ).not.toBeInTheDocument();
		expect( within( menu ).getByRole( 'button', { name: 'Customize' } ) ).toBeInTheDocument();
	} );

	it.each( [ 'Done', 'Cancel' ] )( 'brings the date controls back on %s', async action => {
		render( <Dashboard /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );
		expect( screen.queryByText( /^header offers/ ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: action } ) );

		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();
	} );
} );

describe( 'Dashboard Settings tab', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSection( { slug: 'traffic', date_filter: DATE_FILTER_RANGE } );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn(), true ] );
		mockActiveSectionSlug = 'traffic';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		window.JetpackScriptData = {
			premium_analytics: { stats_settings: { roles: [], features_url: null } },
		} as typeof window.JetpackScriptData;
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'keeps the Settings tab in view but out of reach while the reader arranges the layout', async () => {
		render( <Dashboard /> );
		const sectionsBar = screen.getByTestId( 'dashboard-sections' );
		expect( sectionsBar ).toHaveAttribute( 'data-settings-tab', 'enabled' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect( sectionsBar ).toHaveAttribute( 'data-settings-tab', 'disabled' );
		// Without the slug, an edit mode entered on the Settings tab resolves to a widget section.
		expect( useActiveSectionMock ).toHaveBeenLastCalledWith(
			expect.anything(),
			[],
			expect.anything()
		);
	} );

	it( 'does not open Customize over an empty first section behind the Settings tab', () => {
		useActiveSectionMock.mockReturnValue( [ 'settings', jest.fn(), true ] );
		mockActiveSectionSlug = 'settings';

		render( <Dashboard /> );

		expect( screen.getByTestId( 'dashboard-policy' ) ).toHaveAttribute(
			'data-can-customize',
			'false'
		);
	} );
} );

describe( 'Dashboard locked section', () => {
	const visibleLayout = [ { uuid: 'chart', type: 'jpa/traffic-chart' as const } ];
	const onVisibleLayoutChange = jest.fn();
	const isHiddenWidget = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		mockSection();
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		useLockedSectionLayoutMock.mockImplementation( ( section, layout, onLayoutChange ) =>
			section === 'insights'
				? {
						lockedSection: { title: 'Unlock site insights' } as LockedSectionGate,
						visibleLayout: visibleLayout as typeof layout,
						onVisibleLayoutChange,
						isHiddenWidget,
					}
				: passThroughLockedLayout( section, layout, onLayoutChange )
		);
		useDashboardPolicyMock.mockImplementation(
			jest.requireActual( './hooks/use-dashboard-policy' ).useDashboardPolicy
		);
	} );

	const mockLockedLayout = ( shown: typeof visibleLayout | [] ) =>
		useLockedSectionLayoutMock.mockImplementation( ( section, layout, onLayoutChange ) =>
			section === 'insights'
				? {
						lockedSection: { open_widget_types: [ 'jpa/traffic-chart' ] } as LockedSectionGate,
						visibleLayout: shown,
						onVisibleLayoutChange,
						isHiddenWidget,
					}
				: passThroughLockedLayout( section, layout, onLayoutChange )
		);

	it( 'shows the upgrade prompt after the open widgets, without the empty state', () => {
		render( <Dashboard /> );

		expect( screen.getByTestId( 'locked-section' ) ).toHaveTextContent( 'insights' );
		// Matches come back in document order.
		expect(
			screen.getAllByTestId( /^(widgets|locked-section)$/ ).map( el => el.dataset.testid )
		).toEqual( [ 'widgets', 'locked-section' ] );
		expect( screen.queryByTestId( 'no-widgets-state' ) ).not.toBeInTheDocument();
	} );

	it( 'hands the dashboard only the open widgets, and saves an inline edit with the rest kept', () => {
		const chart = { uuid: 'chart', type: 'jpa/traffic-chart', attributes: { chartType: 'bar' } };
		const hidden = { uuid: 'referrers', type: 'jpa/referrers' };
		const setLayout = jest.fn();
		useDashboardSectionLayoutMock.mockReturnValue( [
			[ hidden, chart ],
			setLayout,
			mockResetLayout,
		] as unknown as ReturnType< typeof useDashboardSectionLayout > );
		useLockedSectionLayoutMock.mockImplementation(
			jest.requireActual( './hooks/use-locked-section-layout' ).useLockedSectionLayout
		);
		window.JetpackScriptData = {
			premium_analytics: {
				plan_gates: { locked_sections: { insights: { open_widget_types: [ chart.type ] } } },
			},
		} as unknown as typeof window.JetpackScriptData;

		render( <Dashboard /> );
		expect( mockDashboardProps.layout ).toEqual( [ chart ] );

		const edited = { ...chart, attributes: { chartType: 'line' } };
		act( () => ( mockDashboardProps.onLayoutChange as ( next: unknown ) => void )( [ edited ] ) );

		expect( setLayout ).toHaveBeenCalledWith( [ hidden, edited ] );
	} );

	it( 'leaves edit mode on arriving from a section being customized', async () => {
		mockLockedLayout( [] );
		mockSection( { slug: 'subscribers' } );
		useActiveSectionMock.mockReturnValue( [ 'subscribers', jest.fn(), true ] );
		mockActiveSectionSlug = 'subscribers';
		const { rerender } = render( <Dashboard /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );
		expect( screen.getByRole( 'button', { name: 'Done' } ) ).toBeInTheDocument();

		mockSection();
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn(), true ] );
		mockActiveSectionSlug = 'insights';
		rerender( <Dashboard /> );

		expect( screen.queryByRole( 'button', { name: 'Done' } ) ).not.toBeInTheDocument();
	} );

	it( 'loads only the open widgets at boot', () => {
		render( <Dashboard /> );

		expect( jest.mocked( useWidgetTypesWithI18n ) ).toHaveBeenLastCalledWith( expect.anything(), {
			visibleNames: [ 'jpa/traffic-chart' ],
			includeAll: false,
		} );
	} );

	it( 'offers no Customize on a locked section that shows no widget', () => {
		mockLockedLayout( [] );
		render( <Dashboard /> );

		expect(
			within( screen.getByTestId( 'page-options-menu' ) ).queryByRole( 'button', {
				name: 'Customize',
			} )
		).not.toBeInTheDocument();
		expect( screen.getByTestId( 'dashboard-policy' ) ).toHaveAttribute(
			'data-can-customize',
			'false'
		);
	} );

	it( 'offers Customize and its tour steps on a locked section that shows a widget, resetting only that', async () => {
		mockLockedLayout( visibleLayout );

		render( <Dashboard /> );

		expect( jest.mocked( onboardingTourSteps ) ).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.objectContaining( { withCustomize: true } )
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Customize' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );

		expect( mockResetLayout ).toHaveBeenLastCalledWith( isHiddenWidget );
	} );

	it( 'leaves an open section as it was', () => {
		mockSection( { slug: 'subscribers' } );
		useActiveSectionMock.mockReturnValue( [ 'subscribers', jest.fn(), true ] );
		mockActiveSectionSlug = 'subscribers';

		render( <Dashboard /> );

		expect( screen.queryByTestId( 'locked-section' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'no-widgets-state' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Customize' } ) ).toBeInTheDocument();
	} );

	it( 'locks the layout behind the Settings tab by the section it belongs to', () => {
		window.JetpackScriptData = {
			premium_analytics: { stats_settings: { roles: [], features_url: null } },
		} as typeof window.JetpackScriptData;
		useActiveSectionMock.mockReturnValue( [ 'settings', jest.fn(), true ] );
		mockActiveSectionSlug = 'settings';

		render( <Dashboard /> );

		expect( useLockedSectionLayoutMock ).toHaveBeenCalledWith(
			'insights',
			expect.anything(),
			expect.anything()
		);
	} );
} );
