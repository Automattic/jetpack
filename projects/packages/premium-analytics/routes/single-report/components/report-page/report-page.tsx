/**
 * External dependencies
 */
import { ReportScopeProvider, isPlanDateLimitedSection } from '@jetpack-premium-analytics/data';
import { PRESET_CUSTOM, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import { Icon } from '@jetpack-premium-analytics/externals';
import { jetpack, lookupWidgetIcon } from '@jetpack-premium-analytics/icons';
import {
	DashboardWidgetHostProvider,
	decodeDateSearchParam,
	pickReportDateParams,
	pickReportNavigationParams,
	usePeriodHost,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import { PeriodChangeStatus, SectionTabs, StatsBreadcrumbs } from '@jetpack-premium-analytics/ui';
import {
	CustomizingBadge,
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
import { Link, useSearch } from '@wordpress/route';
import { WidgetDashboard, type DashboardWidget } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */
import { useDateWindowNotice } from '../../../date-window-notice';
import { DETAIL_GRID } from '../../../grid';
import { getReportDefinition } from '../../../reports/registry';
import { useStatsDateLimits } from '../../../use-stats-date-limits';
import { useWidgetModules } from '../../../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../../../widget-module-i18n';
import { buildControlFields, type ControlsItem } from '../../controls';
import { useActiveSection, useDetailBreadcrumbs, useDetailDateControls } from '../../hooks';
import {
	getSingleReportLayout,
	resolveSingleReportControls,
	type ReportPageRecord,
	type SingleReportPageSection,
} from '../../registry';
import { SinglePageLayout } from '../single-page-layout';
import styles from './report-page.module.scss';
import type { EntitySummary, SectionState, SingleReportAdapter } from '../../pages';
import type { WidgetType } from '@wordpress/widget-primitives';
import type { JSX } from 'react';

// The record's icon at the size of the media it stands in for.
const ICON_SIZE = 28;

const NO_WIDGETS: DashboardWidget[] = [];

/**
 * The summary of a page that waits on no entity.
 */
export const READY_SUMMARY: EntitySummary = {
	isLoading: false,
	isError: false,
	error: undefined,
	isNotFound: false,
	refetch: () => {},
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

/**
 * The widget types as registered, for an adapter without a say.
 *
 * @param widgetTypes - The registered types.
 * @return The same types.
 */
function useRegisteredWidgetTypes( widgetTypes: WidgetType[] ): WidgetType[] {
	return widgetTypes;
}

export type ReportPageProps = {
	/*
	 * The path of the route the page is mounted on: its URL state lives there.
	 */
	routeFrom: string;

	/*
	 * The registered page the URL names.
	 */
	page: ReportPageRecord;

	/*
	 * The entity a single-report page is about, as the URL carries it. A reports page has none.
	 */
	entityId?: string;

	/*
	 * The reports page of the same entities: the crumb of a page opened without an origin.
	 */
	reportsPage?: string;

	/*
	 * The code the page needs beyond its record.
	 */
	adapter: SingleReportAdapter;
};

/**
 * A report page: tabs, header, controls and the widgets the record declares for the active
 * section. A single-report page scopes it to one entity; a reports page does not.
 *
 * @param {ReportPageProps} props - The props.
 * @return The page.
 */
export function ReportPage( {
	routeFrom,
	page,
	entityId,
	reportsPage,
	adapter,
}: ReportPageProps ): JSX.Element {
	const isScoped = entityId !== undefined;
	const summary = adapter.useSummary( entityId ?? '' );

	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;

	useDateWindowNotice();

	const { dateLimits } = useStatsDateLimits(
		isPlanDateLimitedSection( page.dashboard_section ?? undefined )
	);
	const lockedIntervals = dateLimits?.lockedIntervals;

	const dateFilters = useReportDateFilters( routeFrom, { dateLimits } );

	// The adapter's view of the record's sections; the URL picks among the ones shown.
	const [ urlSection, setActiveSection ] = useActiveSection( routeFrom );
	const useSections = adapter.useSections ?? useRecordSections;
	const sectionStates = useSections( summary, page.sections, {
		entityId: entityId ?? '',
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
	// The adapter's view of the registered types, such as a card title naming the entity's kind.
	const useWidgetTypes = adapter.useWidgetTypes ?? useRegisteredWidgetTypes;
	const pageWidgetTypes = useWidgetTypes( widgetTypes, summary );

	const surface = isScoped
		? ( `${ page.path }_detail` as const )
		: ( `${ page.path }_report` as const );

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

	const { onChange: changeDateRange, onApply: applyDateRange, timeZone } = dateFilters;

	// Through the date controller, so a new named preset starts from its own default bucket: there
	// is no bucket control here to fix one carried over.
	const applyReportParams = useCallback(
		( edits: Record< string, unknown > ) => {
			const next = edits.reportParams as Record< string, unknown > | undefined;
			if ( ! next ) {
				return;
			}
			const range = {
				from: decodeDateSearchParam( next.from as string | undefined, timeZone ),
				to: decodeDateSearchParam( next.to as string | undefined, timeZone ),
			};
			const presetId = next.preset as PrimaryPresetId | undefined;
			// The control already moved a custom `to` to the end of its day.
			const options = { exactRange: true };
			changeDateRange( range, presetId, options );
			trackedOnChange( range, presetId, options );
			applyDateRange();
			trackedOnApply();
		},
		[ changeDateRange, applyDateRange, timeZone, trackedOnChange, trackedOnApply ]
	);

	// A card can set the period (the All-time traffic card opens a month): the change is read
	// out and the page returns to the top, where the re-scoped cards are.
	const { openPeriod, attention } = usePeriodHost(
		isScoped ? `${ page.path }:${ entityId }` : `reports:${ page.path }`,
		dateFilters.appliedRange,
		! isPinned,
		dateLimits
	);
	// A period a card opens applies at once, as the custom range it commits.
	const onOpenPeriod = useCallback< typeof openPeriod >(
		( range, options ) => {
			openPeriod( range, options );
			trackedOnChange( range, PRESET_CUSTOM, { exactRange: true, trigger: 'widget' } );
			trackedOnApply();
		},
		[ openPeriod, trackedOnChange, trackedOnApply ]
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

	// One title for the crumb and the header: the entity's, else the adapter's untitled one.
	const title = summary.title?.trim() || adapter.untitledTitle?.( summary ) || page.label;
	const entityBreadcrumbs = useDetailBreadcrumbs(
		canRenderWidgets ? title : undefined,
		reportsPage
	);
	// A reports page is the last crumb itself.
	const breadcrumbs = isScoped ? entityBreadcrumbs : [ { label: page.label } ];

	const header = adapter.headerSlots( summary, {
		label: page.label,
		title,
		section: activeState,
		performanceRange:
			pinnedWindow?.headerRange?.( layout ) ?? pinnedWindow?.range ?? dateFilters.appliedRange,
	} );
	const recordIcon = ( page.icon && lookupWidgetIcon( page.icon ) ) || jetpack;
	// Only an entity's header stands a visual in for its media.
	const fallbackVisual = isScoped ? <Icon icon={ recordIcon } size={ ICON_SIZE } /> : null;
	const backReport = reportsPage ? getReportDefinition( reportsPage ) : undefined;

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
			...( backReport
				? {
						link: {
							label: sprintf(
								/* translators: %s: the reports page's name, e.g. "Videos". */
								__( 'Back to %s', 'jetpack-premium-analytics-pkg' ),
								backReport.getLabel()
							),
							render: (
								<Link
									to="/reports/$report"
									params={ { report: backReport.id } as unknown as never }
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
				label: state.label ?? state.section.label,
				isPending: state.isPending,
			} ) ) }
			value={ activeSlug ?? '' }
			onChange={ setActiveSection }
		/>
	) : undefined;

	return (
		<>
			<PeriodChangeStatus periodChange={ attention } />
			<ReportScopeProvider
				openPeriod={ onOpenPeriod }
				attentionId={ attention?.id }
				dateLimits={ dateLimits }
			>
				<DashboardWidgetHostProvider useLinkSearch={ useHostLinkSearch }>
					<WidgetDashboard.Policy canPerform={ canPerform }>
						<WidgetDashboard
							widgetTypes={ pageWidgetTypes }
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
								visual={ <Icon icon={ jetpack } /> }
								breadcrumbs={ <StatsBreadcrumbs items={ breadcrumbs } /> }
								badges={ isCustomizing ? <CustomizingBadge /> : undefined }
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
										emptyState ? undefined : { ...header, visual: header.visual ?? fallbackVisual }
									}
									controls={ controlFields as never }
									data={ controlsData }
									onChange={ applyReportParams }
									returnToTopKey={ attention?.id }
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
