import { useReportScope, useStatsEmailClicksBreakdown } from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME, computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { useStoredDetailLayout } from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback } from '@wordpress/element';
import { getNoticeAnnouncement, getNoticeText } from '../../../tests/js/notice-test-utils';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../../widget-module-i18n';
import { stage } from '../stage';
import type { EntitySummary, SingleReportAdapter } from '../pages';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { ReactNode } from 'react';

let mockSearch: Record< string, unknown > = {};
let mockParams: Record< string, string > = {};
let mockDateFilterOverrides: Record< string, unknown > = {};
let mockPeriodHost: { openPeriod: () => void; attentionId?: number } | undefined;
let mockDashboardProps: {
	editMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	onLayoutChange?: ( next: unknown ) => void;
	onLayoutReset?: () => void;
} = {};
const mockNavigate = jest.fn();
type AnySummary = EntitySummary & Record< string, unknown >;
const mockUseSummary = jest.fn< AnySummary, [ string ] >();
let mockAdapters: Record< string, SingleReportAdapter > = {};

const VIDEO_PAGE = {
	id: 'analytics/video',
	path: 'video',
	label: 'Video',
	dashboard_section: 'traffic',
	feature: 'videos',
	scope_param: 'post_id',
	id_pattern: '^[1-9]\\d*$',
	icon: 'jpa/video',
	controls: null,
	reports_page: 'videos',
	preferences_scope: 'jetpack-premium-analytics/video-detail',
	default_layout: [
		{ uuid: 'views', type: 'jpa/video-detail-views-performance', attributes: { chartType: 'bar' } },
		{ uuid: 'embeds', type: 'jpa/video-detail-embeds' },
	],
	sections: [],
};

const POST_PAGE = {
	...VIDEO_PAGE,
	id: 'analytics/post',
	path: 'post',
	label: 'Post',
	feature: null,
	icon: 'jpa/post',
	reports_page: 'posts',
	preferences_scope: 'jetpack-premium-analytics/post-detail',
	default_layout: [],
	sections: [
		{
			slug: 'post-traffic',
			label: 'Post traffic',
			default_layout: [ { uuid: 'views', type: 'jpa/post-views' } ],
			controls: null,
		},
		{
			slug: 'email-opens',
			label: 'Email opens',
			default_layout: [
				{ uuid: 'opens', type: 'jpa/email-top-row', attributes: { metric: 'opens' } },
			],
			controls: false,
		},
		{
			slug: 'email-clicks',
			label: 'Email clicks',
			default_layout: [
				{ uuid: 'clicks', type: 'jpa/email-top-row', attributes: { metric: 'clicks' } },
			],
			controls: false,
		},
	],
};

// A page another plugin registered: no adapter in the route, no controls, no reports page.
const CLIP_PAGE = {
	...VIDEO_PAGE,
	id: 'demo/clip',
	path: 'clip',
	label: 'Clip',
	icon: null,
	controls: [],
	reports_page: null,
	preferences_scope: 'jetpack-premium-analytics/clip-detail',
};

// A page whose ids are slugs: the stage hands the adapter and the next URL the string as it came.
const RECAP_PAGE = {
	...VIDEO_PAGE,
	id: 'demo/recap',
	path: 'recap',
	label: 'Recap',
	id_pattern: '^[a-z-]+$',
	reports_page: null,
	preferences_scope: 'jetpack-premium-analytics/recap-detail',
};

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	useStatsEmailClicksBreakdown: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	usePeriodHost: ( ...args: unknown[] ) =>
		mockPeriodHost ??
		jest.requireActual( '@jetpack-premium-analytics/routing' ).usePeriodHost( ...args ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => {
		const filters: Record< string, unknown > = {
			appliedRange: {
				from: new Date( Date.UTC( 2026, 5, 1 ) ),
				to: new Date( Date.UTC( 2026, 5, 16 ) ),
			},
			replaceRange: () => {},
			timeZone: 'UTC',
			interval: 'day',
			intervalOptions: [ 'day', 'week' ],
			...mockDateFilterOverrides,
		};
		return { presetId: filters.appliedPresetId, range: filters.appliedRange, ...filters };
	},
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	SectionHeader: jest.requireActual( '../../../packages/ui/src/section-header' ).SectionHeader,
	StatsBreadcrumbs: jest.requireActual( '../../../packages/ui/src/stats-breadcrumbs' )
		.StatsBreadcrumbs,
	SectionTabs: jest.requireActual( '../../../packages/ui/src/section-tabs/section-tabs' )
		.SectionTabs,
	PeriodChangeStatus: jest.requireActual(
		'../../../packages/ui/src/period-change-status/period-change-status'
	).PeriodChangeStatus,
	StatsPageIcon: () => <svg data-testid="stats-icon" />,
	safeHttpUrl: jest.requireActual( '../../../packages/ui/src/utils/safe-http-url' ).safeHttpUrl,
} ) );

type ControlItem = { reportParams?: Record< string, unknown >; allTimeStart?: string };

/**
 * Stands in for the `jpa/report-params` control the record's controls resolve to.
 *
 * @param {DataFormControlProps< ControlItem >} props - The props.
 * @return The control.
 */
function MockDateControl( { data, onChange }: DataFormControlProps< ControlItem > ) {
	const { attentionId } = useReportScope();
	const applyLastSevenDays = useCallback(
		() =>
			onChange( {
				reportParams: { preset: 'last-7-days', from: '2026-06-10', to: '2026-06-16' },
			} ),
		[ onChange ]
	);

	return (
		<div>
			<div>Date filters</div>
			<div>{ `Window from ${ String( data.reportParams?.from ?? 'none' ) }` }</div>
			<div>{ `All time from ${ data.allTimeStart ?? 'none' }` }</div>
			<div>{ attentionId === undefined ? 'No attention' : `Attention ${ attentionId }` }</div>
			<button onClick={ applyLastSevenDays }>Apply last 7 days</button>
		</div>
	);
}

// The field type registry is the dashboard's; the test attaches the control itself.
jest.mock( '@jetpack-premium-analytics/fields', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/fields' ),
	resolveFieldTypes: ( fields: Array< Record< string, unknown > > ) =>
		fields.map( field => ( { ...field, Edit: MockDateControl } ) ),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{ useSelect: () => [] },
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);

/**
 * Reads the scope from where the page's widgets render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return (
		<>
			<div>Page widgets</div>
			<div>{ offersComparison ? 'Scope offers comparison' : 'Scope offers no comparison' }</div>
		</>
	);
}

// Captures each render's `layout` prop so tests can assert what the page hands the dashboard.
const mockDashboardLayouts: unknown[] = [];
jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( {
		children,
		layout,
		editMode,
		onEditChange,
		onLayoutChange,
		onLayoutReset,
	}: {
		children: ReactNode;
		layout?: unknown;
		editMode?: boolean;
		onEditChange?: ( next: boolean ) => void;
		onLayoutChange?: ( next: unknown ) => void;
		onLayoutReset?: () => void;
	} ) => {
		mockDashboardLayouts.push( layout );
		mockDashboardProps = { editMode, onEditChange, onLayoutChange, onLayoutReset };
		return <>{ children }</>;
	};
	WidgetDashboard.Widgets = () => <MockScopeProbe />;
	WidgetDashboard.Actions = () => <div data-testid="dashboard-actions" />;
	WidgetDashboard.Policy = ( { children }: { children: ReactNode } ) => <>{ children }</>;

	return { WidgetDashboard, DEFAULT_GRID: {}, ROW_HEIGHT_PRESETS: { small: 200 } };
} );

// The stored arrangement is the toolkit's; the rest of the toolkit stays real.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	useStoredDetailLayout: jest.fn( ( scope: string, layoutId: string, fixed: unknown ) => ( {
		layout: fixed,
		setLayout: () => {},
		resetLayout: () => {},
		hasCustomLayout: false,
	} ) ),
} ) );

const mockUseStoredLayout = useStoredDetailLayout as jest.Mock;

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: Array< { label: string; to?: string } > } ) => (
		<nav aria-label="Breadcrumbs">
			{ items.map( ( item, index ) => {
				let content: ReactNode = item.label;
				if ( item.to ) {
					content = <a href={ item.to }>{ item.label }</a>;
				} else if ( index === items.length - 1 ) {
					content = <h1>{ item.label }</h1>;
				}

				return (
					<span key={ index } role="listitem">
						{ content }
					</span>
				);
			} ) }
		</nav>
	),
	Page: ( {
		breadcrumbs,
		badges,
		actions,
		children,
	}: {
		breadcrumbs: ReactNode;
		badges?: ReactNode;
		actions?: ReactNode;
		children: ReactNode;
	} ) => (
		<main>
			{ breadcrumbs }
			{ badges }
			<div data-testid="page-actions">{ actions }</div>
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../tests/js/route-test-utils' );

	return {
		Link: mockWordPressRoute.Link,
		useParams: () => mockParams,
		useSearch: () => mockSearch,
		useNavigate: () => mockNavigate,
	};
} );

jest.mock( '../../use-widget-modules', () => ( {
	useWidgetModules: () => [],
} ) );

jest.mock( '../../widget-module-i18n', () => ( {
	useWidgetTypesWithI18n: jest.fn(),
	useWidgetModuleResolver: jest.fn(),
} ) );

// The video adapter's real header over a summary the test controls.
jest.mock( '../pages', () => ( {
	getSingleReportAdapter: ( path: string ) => mockAdapters[ path ],
} ) );

const refetch = jest.fn();

/**
 * Stubs the summary, defaulting to a resolved entity with no title.
 *
 * @param overrides - Fields to override on the default summary.
 */
function mockSummary( overrides: Partial< AnySummary > = {} ) {
	mockUseSummary.mockReturnValue( {
		isLoading: false,
		isError: false,
		error: undefined,
		isNotFound: false,
		refetch,
		...overrides,
	} );
}

/**
 * Find the summary heading. The breadcrumb's trailing crumb is the page's
 * `h1`; the header titles the section under it.
 *
 * @param name - The accessible heading name.
 * @return The summary heading.
 */
function getSummaryHeading( name: string ): HTMLElement {
	return screen.getByRole( 'heading', { level: 2, name } );
}

describe( 'single-report stage', () => {
	beforeAll( () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			// The Videos crumb reads VideoPress off it; the page options menu the reader's capabilities.
			value: {
				premium_analytics: {
					has_videopress: true,
					single_report_pages: [ VIDEO_PAGE, POST_PAGE, CLIP_PAGE, RECAP_PAGE ],
				},
				user: { current_user: { capabilities: {} } },
			},
		} );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		mockDashboardLayouts.length = 0;
		mockDateFilterOverrides = {};
		mockPeriodHost = undefined;
		mockParams = { kind: 'video', id: '42' };
		mockSearch = {
			from: '2026-06-01',
			to: '2026-06-16',
			post_id: '42',
		};
		mockAdapters = {
			video: {
				useSummary: mockUseSummary,
				headerSlots: jest.requireActual( '../pages/video/video-header-slots' ).videoHeaderSlots,
				notFoundDescription:
					jest.requireActual( '../pages/video' ).videoAdapter.notFoundDescription,
			},
		};
		jest.mocked( useWidgetTypesWithI18n ).mockReturnValue( [ [], false ] );
		jest
			.mocked( useWidgetModuleResolver )
			.mockReturnValue( ( () => Promise.resolve( {} ) ) as never );
	} );

	afterAll( () => {
		delete window.JetpackScriptData;
	} );

	it( 'shows a not-found state with a date-preserving link back to the reports page', () => {
		// A detail page carries the window it was opened from; the back link returns to it.
		mockSearch = { ...mockSearch, ref_from: '2026-05-01', ref_to: '2026-05-31' };
		mockSummary( { isNotFound: true } );

		render( stage() );

		expect( getNoticeText( "We couldn't find this video." ) ).toBeInTheDocument();
		expect( getNoticeAnnouncement( "We couldn't find this video.", 'polite' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Back to Videos' } ) ).toHaveAttribute(
			'href',
			'/reports/videos?from=2026-05-01&to=2026-05-31'
		);
		expect( getSummaryHeading( 'Video not found' ) ).toBeInTheDocument();
	} );

	it( 'offers Retry in place of the widgets when the summary fails to load', async () => {
		mockSummary( { isError: true, error: { status: 500 } } );

		render( stage() );

		expect(
			getNoticeAnnouncement(
				"We couldn't load this page. Please try again in a moment.",
				'assertive'
			)
		).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'offers no Retry when the entity is denied', () => {
		mockSummary( { isError: true, error: { code: 'rest_forbidden', status: 403 } } );

		render( stage() );

		expect( getNoticeText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders a page without an adapter from its record: label, widgets, no controls, no crumb', () => {
		mockParams = { kind: 'clip', id: '42' };

		render( stage() );

		expect( getSummaryHeading( 'Clip' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Page widgets' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Date filters' ) ).not.toBeInTheDocument();
		expect( mockUseSummary ).not.toHaveBeenCalled();
		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent ) ).toEqual( [
			'Stats',
			'Clip',
		] );
		expect( mockUseStoredLayout ).toHaveBeenCalledWith(
			'jetpack-premium-analytics/clip-detail',
			'clip',
			CLIP_PAGE.default_layout
		);
	} );

	it.each( [
		{ summary: { isLoading: true }, heading: 'Loading…' },
		{ summary: { isError: true }, heading: 'Video unavailable' },
		{ summary: { isNotFound: true }, heading: 'Video not found' },
	] )(
		'names the page and keeps the controls while no entity is available',
		( { summary, heading } ) => {
			mockSummary( summary );

			render( stage() );

			const nav = screen.getByRole( 'navigation', { name: 'Breadcrumbs' } );
			// The Stats and reports page crumbs render; the title crumb waits for a title.
			const crumbs = within( nav ).getAllByRole( 'listitem' );
			expect( crumbs.map( crumb => crumb.textContent ) ).toEqual( [ 'Stats', 'Videos' ] );
			expect( within( crumbs[ 0 ] ).getByRole( 'link', { name: 'Stats' } ) ).toHaveAttribute(
				'href',
				'/?from=2026-06-01&to=2026-06-16'
			);
			expect( getSummaryHeading( heading ) ).toBeInTheDocument();
			expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
			// No window is worth stating without an entity behind it.
			expect( screen.queryByText( /Performance from/ ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page widgets' ) ).not.toBeInTheDocument();
		}
	);

	it( 'keeps a long unbroken title single-line-ready: full text in markup plus the hover attr', () => {
		const longTitle = `VID_20260731_${ 'a'.repeat( 120 ) }.mp4`;
		mockSummary( { title: longTitle } );

		render( stage() );

		expect( getSummaryHeading( longTitle ) ).toHaveAttribute( 'title', longTitle );
	} );

	it( 'crumbs the reports page of the record and the resolved title when the URL carries no origin', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent ) ).toEqual( [
			'Stats',
			'Videos',
			'Launch recap',
		] );
		expect( breadcrumbs.getByRole( 'link', { name: 'Videos' } ) ).toHaveAttribute(
			'href',
			'/reports/videos'
		);
		expect(
			breadcrumbs.getByRole( 'heading', { level: 1, name: 'Launch recap' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Page widgets' ) ).toBeInTheDocument();
	} );

	it( 'crumbs the referring report instead when the URL names one', () => {
		mockSearch = { ...mockSearch, ref: 'authors' };
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent ) ).toEqual( [
			'Stats',
			'Top authors',
			'Launch recap',
		] );
	} );

	it( 'states the applied report range as the performance window under the title', () => {
		mockSummary( { title: 'Launch recap', publishedDate: '2026-01-10T08:00:00' } );

		render( stage() );

		expect(
			screen.getByText(
				'Video uploaded on Jan 10, 2026. Performance from Jun 1, 2026 to Jun 16, 2026'
			)
		).toBeInTheDocument();
	} );

	it( 'hands the control the applied window and the entity start as the All time anchor', () => {
		mockSummary( { title: 'Launch recap', allTimeStart: '2026-01-10 08:00:00' } );

		render( stage() );

		expect( screen.getByText( 'Window from 2026-06-01' ) ).toBeInTheDocument();
		expect( screen.getByText( 'All time from 2026-01-10 08:00:00' ) ).toBeInTheDocument();
	} );

	it( 'writes the window the control applies to the URL, replacing the old one', async () => {
		mockSearch = { ...mockSearch, comp: '1', compare_from: '2026-05-17', compare_to: '2026-05-31' };
		mockSummary( { title: 'Launch recap' } );

		render( stage() );
		await userEvent.click( screen.getByRole( 'button', { name: 'Apply last 7 days' } ) );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		const [ { to, params, search } ] = mockNavigate.mock.calls[ 0 ];
		expect( to ).toBe( '/report/$kind/$id' );
		expect( params ).toEqual( { kind: 'video', id: '42' } );
		expect( search( mockSearch ) ).toEqual( {
			post_id: '42',
			preset: 'last-7-days',
			from: '2026-06-10',
			to: '2026-06-16',
		} );
	} );

	it( 'keeps a non-numeric id as the URL carries it, for the adapter and the next URL', async () => {
		mockParams = { kind: 'recap', id: 'launch-recap' };
		mockSearch = { ...mockSearch, post_id: 'launch-recap' };
		mockAdapters = { recap: mockAdapters.video };
		mockSummary( { title: 'Launch recap' } );

		render( stage() );
		await userEvent.click( screen.getByRole( 'button', { name: 'Apply last 7 days' } ) );

		expect( mockUseSummary ).toHaveBeenCalledWith( 'launch-recap' );
		expect( mockNavigate.mock.calls[ 0 ][ 0 ].params ).toEqual( {
			kind: 'recap',
			id: 'launch-recap',
		} );
	} );

	// A single-report page offers no comparison: the control hides Compare and `WidgetRoot` strips
	// the params. This asserts the page's declaration.
	it( 'declares no comparison for the widgets it renders', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( screen.getByText( 'Scope offers no comparison' ) ).toBeInTheDocument();
	} );

	// The control is a DataForm field, so the host's attention reaches it through the scope.
	it( 'hands the control the attention the period host raises', () => {
		mockPeriodHost = { openPeriod: jest.fn(), attentionId: 7 };
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( screen.getByText( 'Attention 7' ) ).toBeInTheDocument();
	} );

	it( 'hands the dashboard the layout the record declares', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( mockUseStoredLayout ).toHaveBeenCalledWith(
			'jetpack-premium-analytics/video-detail',
			'video',
			VIDEO_PAGE.default_layout
		);
		expect( mockDashboardLayouts.at( -1 ) ).toEqual( VIDEO_PAGE.default_layout );
	} );

	it( 'renders the widgets only once all time anchors on the entity start', () => {
		mockDateFilterOverrides = {
			appliedPresetId: PRESET_ALL_TIME,
			appliedRange: computePrimaryRange( PRESET_ALL_TIME, 'UTC' ),
		};
		mockSummary( { title: 'Launch recap', allTimeStart: '2026-06-22 18:00:00' } );

		const { rerender } = render( stage() );

		expect( screen.queryByText( 'Page widgets' ) ).not.toBeInTheDocument();

		mockDateFilterOverrides = {
			appliedPresetId: PRESET_ALL_TIME,
			appliedRange: computePrimaryRange( PRESET_ALL_TIME, 'UTC', {
				startDate: new Date( '2026-06-22T18:00:00Z' ),
			} ),
		};
		rerender( stage() );

		expect( screen.getByText( 'Page widgets' ) ).toBeInTheDocument();
	} );

	it( 'offers Customize in a page options menu once the summary resolves', async () => {
		const user = userEvent.setup();
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		expect( screen.queryByTestId( 'dashboard-actions' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );

		// The dashboard's own Cancel and Done take the actions slot while editing.
		expect( mockDashboardProps.editMode ).toBe( true );
		expect( screen.getByText( 'Customizing' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'dashboard-actions' ) ).toBeInTheDocument();

		act( () => mockDashboardProps.onEditChange?.( false ) );
		expect( mockDashboardProps.editMode ).toBe( false );
		expect( screen.getByRole( 'button', { name: 'Page options' } ) ).toBeInTheDocument();
	} );

	it.each( [
		{ summary: { isLoading: true }, state: 'loading' },
		{ summary: { isError: true }, state: 'errored' },
		{ summary: { isNotFound: true }, state: 'not found' },
	] )(
		'offers the page options menu without Customize while the summary is $state',
		async ( { summary } ) => {
			const user = userEvent.setup();
			mockSummary( summary );

			render( stage() );

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

			await expect(
				screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'menuitem', { name: 'Customize' } ) ).not.toBeInTheDocument();
		}
	);

	it( 'leaves customize mode when the entity stops rendering', async () => {
		const user = userEvent.setup();
		mockSummary( { title: 'Launch recap' } );

		const { rerender } = render( stage() );

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );
		expect( mockDashboardProps.editMode ).toBe( true );

		// A failed background refetch hides the grid, and the dashboard's Cancel and
		// Done with it, so the mode must not stay on with no way out.
		mockSummary( { isError: true } );
		rerender( stage() );

		expect( mockDashboardProps.editMode ).toBe( false );
		expect( screen.queryByTestId( 'dashboard-actions' ) ).not.toBeInTheDocument();
	} );

	it( 'resets the layout from the page options menu and leaves customize mode', async () => {
		const user = userEvent.setup();
		const resetLayout = jest.fn();
		mockUseStoredLayout.mockReturnValue( {
			layout: [ { uuid: 'card', type: 'jpa/card' } ],
			setLayout: () => {},
			resetLayout,
			hasCustomLayout: false,
		} );
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );
		expect( mockDashboardProps.editMode ).toBe( true );

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		await user.click( within( dialog ).getByRole( 'button', { name: 'Reset' } ) );

		expect( resetLayout ).toHaveBeenCalledTimes( 1 );
		expect( mockDashboardProps.editMode ).toBe( false );
	} );

	it( 'stores what the dashboard commits, and forgets it on reset', () => {
		const setLayout = jest.fn();
		const resetLayout = jest.fn();
		mockUseStoredLayout.mockReturnValue( {
			layout: [ { uuid: 'card', type: 'jpa/card' } ],
			setLayout,
			resetLayout,
			hasCustomLayout: false,
		} );
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const rearranged = [ { uuid: 'card', type: 'jpa/card', placement: { order: 2 } } ];
		act( () => mockDashboardProps.onLayoutChange?.( rearranged ) );
		expect( setLayout ).toHaveBeenCalledWith( rearranged );

		act( () => mockDashboardProps.onLayoutReset?.() );
		expect( resetLayout ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'the post page', () => {
		const mockGate = jest.mocked( useStatsEmailClicksBreakdown );

		/**
		 * Mocks the clicks rate summary that gates the email sections.
		 *
		 * @param totalSends - The sends the gate reports; undefined leaves it unanswered.
		 */
		function mockSends( totalSends?: number ) {
			const answered = totalSends !== undefined;
			mockGate.mockReturnValue( {
				data: answered ? { summary: { total_sends: totalSends } } : undefined,
				isLoading: ! answered,
				isSuccess: answered,
				isError: false,
			} as never );
		}

		beforeEach( () => {
			mockParams = { kind: 'post', id: '42' };
			mockAdapters = {
				post: {
					useSummary: mockUseSummary,
					headerSlots: jest.requireActual( '../pages/post/post-header-slots' ).postHeaderSlots,
					headerActions: jest.requireActual( '../pages/post/header-actions' ).postHeaderActions,
					useSections: jest.requireActual( '../pages/post/use-post-sections' ).usePostSections,
				},
			};
			mockSends( 3 );
		} );

		it( 'shows the three sections, the date filter and the View post action for a sent post', () => {
			mockSummary( {
				title: 'Hello world',
				type: 'post',
				allTimeStart: '2026-06-22 10:00:00',
				url: 'https://example.com/hello/',
			} );

			render( stage() );

			expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
				'Post traffic',
				'Email opens',
				'Email clicks',
			] );
			expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
			// `openInNewTab` appends a screen-reader hint to the accessible name.
			expect(
				screen.getByRole( 'link', { name: 'View post(opens in a new tab)' } )
			).toHaveAttribute( 'href', 'https://example.com/hello/' );
			expect( mockUseStoredLayout ).toHaveBeenCalledWith(
				'jetpack-premium-analytics/post-detail',
				'post-traffic',
				POST_PAGE.sections[ 0 ].default_layout
			);
		} );

		it( 'hides the email sections for a page, which is never sent as a newsletter', () => {
			mockSummary( { title: 'About', type: 'page', url: 'https://example.com/about/' } );

			render( stage() );

			expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
				'Post traffic',
			] );
			expect(
				screen.getByRole( 'link', { name: 'View page(opens in a new tab)' } )
			).toBeInTheDocument();
		} );

		it( 'pins an email section to the send window, with the email identity and no date filter', () => {
			mockSearch = { ...mockSearch, section: 'email-opens' };
			mockSummary( {
				title: 'Hello world',
				type: 'post',
				publishedDate: '2026-06-22 10:00:00',
				allTimeStart: '2026-06-22 10:00:00',
			} );

			render( stage() );

			expect( screen.getByText( /Email sent on Jun 22, 2026\./ ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Date filters' ) ).not.toBeInTheDocument();
			const [ , layoutId, layout ] = mockUseStoredLayout.mock.calls.at( -1 ) as [
				string,
				string,
				Array< { attributes?: Record< string, unknown > } >,
			];
			expect( layoutId ).toBe( 'email-opens' );
			expect( layout[ 0 ].attributes ).toMatchObject( {
				metric: 'opens',
				reportParams: expect.objectContaining( { post_id: 42, interval: 'day' } ),
			} );
			expect( String( layout[ 0 ].attributes?.reportParams ) ).toBeDefined();
		} );

		it( 'replaces the header and the widgets of an email section with the never-sent state', () => {
			mockSends( 0 );
			mockSearch = { ...mockSearch, section: 'email-opens' };
			mockSummary( { title: 'Hello world', type: 'post', allTimeStart: '2026-06-22 10:00:00' } );

			render( stage() );

			expect(
				screen.getByText( 'This post hasn’t been sent as a newsletter' )
			).toBeInTheDocument();
			expect( screen.queryByText( /Email sent on/ ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Page widgets' ) ).not.toBeInTheDocument();
		} );
	} );
} );
