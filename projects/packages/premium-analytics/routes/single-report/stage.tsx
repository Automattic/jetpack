/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	PeriodChangeSignalProvider,
	ReportScopeProvider,
	isPlanDateLimitedSection,
} from '@jetpack-premium-analytics/data';
import { Badge, Icon } from '@jetpack-premium-analytics/externals';
import { jetpack, lookupWidgetIcon } from '@jetpack-premium-analytics/icons';
import {
	DashboardWidgetHostProvider,
	decodeDateSearchParam,
	omitReportDateParams,
	pickReportDateParams,
	pickReportNavigationParams,
	usePeriodHost,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import {
	PeriodChangeStatus,
	SectionTabs,
	StatsBreadcrumbs,
	StatsPageIcon,
} from '@jetpack-premium-analytics/ui';
import {
	DetailPageActions,
	PageEmptyState,
	PageNotice,
	describeError,
	useDetailPageCustomize,
	useHostLinkSearch,
	useStoredDetailLayout,
	useTrackedDateRangeApply,
	type PageNoticeProps,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, useNavigate, useParams, useSearch } from '@wordpress/route';
import { WidgetDashboard, type DashboardWidget } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */
import { useDateWindowNotice } from '../date-window-notice';
import { DETAIL_GRID } from '../grid';
import { getReportDefinition } from '../reports/registry';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { useWidgetModules } from '../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { SinglePageLayout } from './components';
import { buildControlFields, type ControlsItem } from './controls';
import { useActiveSection } from './hooks';
import { route } from './package.json';
import {
	getSingleReportAdapter,
	type EntitySummary,
	type SectionState,
	type SingleReportAdapter,
} from './pages';
import {
	getSingleReportLayout,
	getSingleReportPage,
	resolveSingleReportControls,
	type SingleReportPageRecord,
	type SingleReportPageSection,
} from './registry';
import styles from './stage.module.scss';
import type { PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

// The record's icon at the size of the media it stands in for.
const ICON_SIZE = 28;

const NO_WIDGETS: DashboardWidget[] = [];

const READY_SUMMARY: EntitySummary = {
	isLoading: false,
	isError: false,
	error: undefined,
	isNotFound: false,
	refetch: () => {},
};

// A page the route ships no adapter for renders from its record: the label titles it.
const RECORD_ADAPTER: SingleReportAdapter = {
	useSummary: () => READY_SUMMARY,
	headerSlots: ( summary, { label } ) => ( { title: label } ),
};

/**
 * The sections as the record declares them, for an adapter without a say.
 *
 * @param _summary - The entity summary, unused.
 * @param sections - The record's sections.
 * @return One plain state per section.
 */
function useRecordSections(
	_summary: EntitySummary,
	sections: SingleReportPageSection[]
): SectionState[] {
	return useMemo( () => sections.map( section => ( { section } ) ), [ sections ] );
}

type SingleReportBodyProps = {
	/*
	 * The registered page the URL names.
	 */
	page: SingleReportPageRecord;

	/*
	 * The entity the page is about, as the URL carries it.
	 */
	entityId: string;

	/*
	 * The page's adapter, or the record-only one.
	 */
	adapter: SingleReportAdapter;
};

/**
 * The page: tabs, header, controls and the composition the record declares for the active section.
 *
 * @param {SingleReportBodyProps} props - The props.
 * @return The page.
 */
function SingleReportBody( { page, entityId, adapter }: SingleReportBodyProps ): JSX.Element {
	const summary = adapter.useSummary( entityId );

	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;

	const { dateLimits } = useStatsDateLimits(
		isPlanDateLimitedSection( page.dashboard_section ?? undefined )
	);
	useDateWindowNotice();
	const lockedIntervals = dateLimits?.lockedIntervals;

	const dateFilters = useReportDateFilters( ROUTE_FROM, { lockedIntervals } );

	// The adapter's view of the record's sections; the URL picks among the ones shown.
	const [ urlSection, setActiveSection ] = useActiveSection();
	const useSections = adapter.useSections ?? useRecordSections;
	const sectionStates = useSections( summary, page.sections, {
		entityId,
		activeSlug: urlSection,
		timeZone: dateFilters.timeZone,
	} );
	const visibleStates = useMemo(
		() => sectionStates.filter( state => ! state.hidden ),
		[ sectionStates ]
	);
	const activeState =
		visibleStates.find( state => state.section.slug === urlSection ) ?? visibleStates[ 0 ];
	const section = activeState?.section;
	const activeSlug = section?.slug;

	// A URL naming a hidden section is replaced with the one shown, without a history entry.
	useEffect( () => {
		if ( activeSlug && urlSection !== activeSlug ) {
			setActiveSection( activeSlug, { replace: true } );
		}
	}, [ urlSection, activeSlug, setActiveSection ] );

	const pinnedScope = activeState?.scope;
	const pinnedWindow = typeof pinnedScope === 'object' ? pinnedScope : undefined;
	const isPinned = pinnedScope !== undefined;
	const emptyState = activeState?.emptyState;

	const defaultLayout = getSingleReportLayout( page, section );
	// A pinned window reaches every widget as its own report params, which `WidgetRoot` prefers to the URL's.
	const sectionLayout = useMemo( () => {
		if ( pinnedScope === 'pending' ) {
			return NO_WIDGETS;
		}
		if ( ! pinnedWindow ) {
			return defaultLayout;
		}

		return defaultLayout.map( widget => ( {
			...widget,
			attributes: {
				...( widget.attributes as Record< string, unknown > | undefined ),
				reportParams: pinnedWindow.reportParams,
			},
		} ) );
	}, [ defaultLayout, pinnedScope, pinnedWindow ] );

	const widgetModules = useWidgetModules();
	const resolveWidgetModule = useWidgetModuleResolver( widgetModules );
	const visibleNames = useMemo(
		() => [ ...new Set( defaultLayout.map( widget => widget.type ) ) ],
		[ defaultLayout ]
	);
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames,
	} );

	const surface = `${ page.path }_detail` as const;

	const { isAnchoringAllTime } = useDetailDateControls(
		summary.allTimeStart,
		dateFilters,
		summary.isLoading || summary.isError
	);

	const { trackedOnChange, trackedOnApply } = useTrackedDateRangeApply(
		{
			presetId: dateFilters.presetId,
			range: dateFilters.range,
			interval: dateFilters.interval,
			comparisonPresetId: dateFilters.comparisonPresetId,
			appliedComparisonRange: dateFilters.appliedComparisonRange,
		},
		{ surface, offersComparison: false, lockedIntervals }
	);

	// A pinned section offers no window to choose.
	const controls = resolveSingleReportControls( page, section );
	const controlFields = useMemo(
		() => ( isPinned ? [] : buildControlFields( controls ) ),
		[ isPinned, controls ]
	);
	const controlsData = useMemo< ControlsItem >(
		() => ( {
			reportParams: pickReportDateParams( search ),
			allTimeStart: summary.allTimeStart,
		} ),
		[ search, summary.allTimeStart ]
	);

	// A committed window goes to the URL, where every widget on the page reads it.
	const applyReportParams = useCallback(
		( edits: Record< string, unknown > ) => {
			const next = edits.reportParams as Record< string, unknown > | undefined;
			if ( ! next ) {
				return;
			}
			trackedOnChange(
				{
					from: decodeDateSearchParam( next.from as string | undefined ),
					to: decodeDateSearchParam( next.to as string | undefined ),
				},
				next.preset as PrimaryPresetId | undefined
			);
			trackedOnApply();
			void navigate( {
				to: ROUTE_FROM,
				params: { kind: page.path, id: entityId } as unknown as never,
				search: ( ( previous: Record< string, unknown > ) => ( {
					...omitReportDateParams( previous ),
					...next,
				} ) ) as unknown as never,
			} );
		},
		[ navigate, page.path, entityId, trackedOnChange, trackedOnApply ]
	);

	// A card can set the period (the All-time traffic card opens a month): the change is read
	// out and the page returns to the top, where the re-scoped cards are.
	const { openPeriod, attentionId } = usePeriodHost(
		`${ page.path }:${ entityId }`,
		dateFilters.appliedRange,
		! isPinned,
		lockedIntervals
	);

	const reportSearch = pickReportNavigationParams( search );

	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		page.preferences_scope,
		activeSlug ?? page.path,
		sectionLayout
	);
	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;
	// A URL-scoped section waits for All time to anchor; a pinned one for its window.
	const showWidgets =
		canRenderWidgets &&
		! emptyState &&
		pinnedScope !== 'pending' &&
		( isPinned || ! isAnchoringAllTime );

	// Each section is its own layout, so leaving it leaves customize mode too.
	const {
		isCustomizing,
		canCustomize,
		canPerform,
		startCustomizing,
		resetToDefault,
		onEditChange,
		onLayoutChange,
	} = useDetailPageCustomize( layout, {
		layoutId: activeSlug ?? page.path,
		enabled: showWidgets,
		onLayoutReset: resetLayout,
		onLayoutChange: setLayout,
		surface,
	} );

	const breadcrumbs = useDetailBreadcrumbs(
		canRenderWidgets ? summary.title?.trim() || page.label : undefined,
		page.reports_page ?? undefined
	);

	const header = adapter.headerSlots( summary, {
		label: page.label,
		section: activeState,
		performanceRange: pinnedWindow?.range ?? dateFilters.appliedRange,
	} );
	const recordIcon = ( page.icon && lookupWidgetIcon( page.icon ) ) || jetpack;
	const reportsPage = page.reports_page ? getReportDefinition( page.reports_page ) : undefined;

	let notice: PageNoticeProps | null = null;
	if ( summary.isError ) {
		notice = describeError( summary.error, {
			retryDescription: __(
				"We couldn't load this page. Please try again in a moment.",
				'jetpack-premium-analytics-pkg'
			),
			onRetry: summary.refetch,
		} );
	} else if ( summary.isNotFound ) {
		notice = {
			intent: 'info',
			description:
				adapter.notFoundDescription?.() ??
				__( "We couldn't find what you were looking for.", 'jetpack-premium-analytics-pkg' ),
			...( reportsPage
				? {
						link: {
							label: sprintf(
								/* translators: %s: the reports page's name, e.g. "Videos". */
								__( 'Back to %s', 'jetpack-premium-analytics-pkg' ),
								reportsPage.getLabel()
							),
							render: (
								<Link
									to="/reports/$report"
									params={ { report: reportsPage.id } as unknown as never }
									search={ reportSearch as unknown as never }
								/>
							),
						},
					}
				: {} ),
		};
	}

	const tabs = page.sections.length ? (
		<SectionTabs
			tabs={ visibleStates.map( state => ( {
				id: state.section.slug,
				label: state.section.label,
			} ) ) }
			value={ activeSlug ?? '' }
			onChange={ setActiveSection }
		/>
	) : undefined;

	return (
		<>
			<PeriodChangeStatus
				attentionId={ attentionId }
				appliedPresetId={ dateFilters.appliedPresetId }
				appliedRange={ dateFilters.appliedRange }
			/>
			<ReportScopeProvider
				openPeriod={ openPeriod }
				attentionId={ attentionId }
				dateLimits={ dateLimits }
			>
				<DashboardWidgetHostProvider useLinkSearch={ useHostLinkSearch }>
					<WidgetDashboard.Policy canPerform={ canPerform }>
						<WidgetDashboard
							widgetTypes={ widgetTypes }
							isResolvingWidgetTypes={ isResolvingWidgetTypes }
							resolveWidgetModule={ resolveWidgetModule }
							layout={ layout }
							onLayoutChange={ onLayoutChange }
							onLayoutReset={ resetLayout }
							gridSettings={ DETAIL_GRID }
							editMode={ isCustomizing }
							onEditChange={ onEditChange }
						>
							<Page
								className={ styles.page }
								visual={ <StatsPageIcon /> }
								breadcrumbs={ <StatsBreadcrumbs items={ breadcrumbs } /> }
								badges={
									isCustomizing ? (
										<Badge intent="informational">
											{ __( 'Customizing', 'jetpack-premium-analytics-pkg' ) }
										</Badge>
									) : undefined
								}
								actions={
									<DetailPageActions
										isCustomizing={ isCustomizing }
										onCustomize={ canCustomize ? startCustomizing : undefined }
										onReset={ resetToDefault }
										editingActions={ <WidgetDashboard.Actions /> }
									>
										{ adapter.headerActions?.( summary ) }
									</DetailPageActions>
								}
							>
								<SinglePageLayout
									tabs={ tabs }
									header={
										emptyState
											? undefined
											: {
													...header,
													visual: header.visual ?? <Icon icon={ recordIcon } size={ ICON_SIZE } />,
												}
									}
									controls={ controlFields as never }
									data={ controlsData }
									onChange={ applyReportParams }
									returnToTopKey={ attentionId }
								>
									{ emptyState ? <PageEmptyState { ...emptyState } /> : null }
									{ /* Keyed by section: each is its own layout, so the grid mounts fresh. */ }
									{ showWidgets ? <WidgetDashboard.Widgets key={ activeSlug } /> : null }
									{ ! emptyState && notice ? <PageNotice { ...notice } /> : null }
								</SinglePageLayout>
							</Page>
						</WidgetDashboard>
					</WidgetDashboard.Policy>
				</DashboardWidgetHostProvider>
			</ReportScopeProvider>
		</>
	);
}

/**
 * Resolves the page the URL names and its adapter, then renders the body.
 *
 * @return The page, or nothing for a page the guard already rejected.
 */
function SingleReport(): JSX.Element | null {
	const { kind, id } = useParams( { from: ROUTE_FROM } ) as { kind?: string; id?: string };
	const page = getSingleReportPage( kind );

	if ( ! page || ! id ) {
		// The route guard already sent an unknown page or id to the dashboard.
		return null;
	}

	return (
		<SingleReportBody
			// Another page is another adapter, so another hook order: remount.
			key={ page.path }
			page={ page }
			entityId={ id }
			adapter={ getSingleReportAdapter( page.path ) ?? RECORD_ADAPTER }
		/>
	);
}

/**
 * The route's stage.
 *
 * @return The single-report page with its providers.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			{ /* No compared period on this page, whatever a hand-edited URL carries. */ }
			<ReportScopeProvider offersComparison={ false }>
				<PeriodChangeSignalProvider>
					<SingleReport />
				</PeriodChangeSignalProvider>
			</ReportScopeProvider>
		</AnalyticsQueryClientProvider>
	);
}
