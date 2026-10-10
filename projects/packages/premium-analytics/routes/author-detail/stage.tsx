/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	getApiErrorStatus,
	PeriodChangeSignalProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import {
	buildReportLink,
	pickReportNavigationParams,
	usePeriodHost,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import {
	DateFiltersPanel,
	PeriodChangeStatus,
	StatsBreadcrumbs,
	StatsPageIcon,
} from '@jetpack-premium-analytics/ui';
import {
	DetailPageActions,
	DetailPageBreadcrumbs,
	DetailPageLayout,
	PageNotice,
	DetailPageSection,
	DetailPageShell,
	describeError,
	useDetailPageCustomize,
	useStoredDetailLayout,
	useTrackedDateRangeApply,
	type PageNoticeProps,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */
import { DETAIL_GRID } from '../grid';
import { useDetailDateControls } from '../use-detail-date-controls';
import { useWidgetModules } from '../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { toWidgetTypeBaseNames, withWidgetTypeAliases } from '../widget-type-aliases';
import { authorHeaderSlots } from './components';
import { AUTHOR_DETAIL_LAYOUT, AUTHOR_DETAIL_WIDGET_TYPE_ALIASES } from './config';
import { useAuthorAllTimeStart, useAuthorSummary } from './hooks';
import { route } from './package.json';
import type { DashboardWidget } from '@wordpress/widget-dashboard';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

const PREFERENCES_SCOPE = 'jetpack-premium-analytics/author-detail';
const LAYOUT_ID = 'author';

const NO_WIDGETS: DashboardWidget[] = [];

/**
 * Premium Analytics author detail page shell: a fixed composition the reader can
 * rearrange from the page options menu, stored in preferences.
 *
 * @return The author detail page.
 */
function AuthorDetail(): JSX.Element {
	const { authorId: authorIdParam } = useParams( { from: ROUTE_FROM } ) as { authorId?: string };
	const authorId = Number( authorIdParam );
	const summary = useAuthorSummary( authorId );

	const anchor = useAuthorAllTimeStart( authorId );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { dateControls, isAnchoringAllTime: isAnchoringProvisional } = useDetailDateControls(
		anchor.allTimeStart,
		dateFilters,
		anchor.isPending
	);
	// A start carried over from another author is not this one's, so hold it too.
	const isAnchoringAllTime =
		isAnchoringProvisional ||
		( dateFilters.appliedPresetId === PRESET_ALL_TIME && anchor.isPending );

	const widgetModules = useWidgetModules();
	const resolveWidgetModule = useWidgetModuleResolver( widgetModules );

	// Range-reading cards wait for all time to anchor, as on the post page.
	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		PREFERENCES_SCOPE,
		LAYOUT_ID,
		isAnchoringAllTime ? NO_WIDGETS : AUTHOR_DETAIL_LAYOUT
	);

	// A fixed composition with no picker only ever needs its own types resolved.
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames: toWidgetTypeBaseNames(
			layout.map( widget => widget.type ),
			AUTHOR_DETAIL_WIDGET_TYPE_ALIASES
		),
	} );
	const pageWidgetTypes = useMemo(
		() => withWidgetTypeAliases( widgetTypes, AUTHOR_DETAIL_WIDGET_TYPE_ALIASES ),
		[ widgetTypes ]
	);

	const { onChange: changeDateRange, onApply: applyDateRange } = dateFilters;
	const { trackedOnChange, trackedOnApply } = useTrackedDateRangeApply(
		{
			presetId: dateFilters.presetId,
			range: dateFilters.range,
			interval: dateFilters.interval,
			comparisonPresetId: dateFilters.comparisonPresetId,
			appliedComparisonRange: dateFilters.appliedComparisonRange,
		},
		{ surface: 'author_detail', offersComparison: false }
	);
	const onDateChange = useCallback< typeof changeDateRange >(
		( ...args ) => {
			changeDateRange( ...args );
			trackedOnChange( ...args );
		},
		[ changeDateRange, trackedOnChange ]
	);
	const onDateApply = useCallback( () => {
		applyDateRange();
		trackedOnApply();
	}, [ applyDateRange, trackedOnApply ] );

	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const reportSearch = pickReportNavigationParams( search );

	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;

	// The All-time traffic card opens a month as this page's period.
	const { openPeriod, attentionId } = usePeriodHost(
		`author:${ authorId }`,
		dateFilters.appliedRange,
		true
	);

	// Without cards there is nothing to arrange, and a refetch that fails
	// mid-customize would otherwise hide Cancel and Done along with the grid.
	const {
		isCustomizing,
		canCustomize,
		canPerform,
		startCustomizing,
		resetToDefault,
		onEditChange,
		onLayoutChange,
	} = useDetailPageCustomize( layout, {
		enabled: canRenderWidgets,
		onLayoutReset: resetLayout,
		onLayoutChange: setLayout,
		surface: 'author_detail',
	} );

	// The trail is fixed to Stats / All authors / Author regardless of which report
	// the reader arrived from: the author list is this page's only parent.
	const breadcrumbs = useMemo(
		() => [
			{
				label: __( 'All authors', 'jetpack-premium-analytics-pkg' ),
				to: buildReportLink( 'authors', search ),
			},
			{ label: __( 'Author', 'jetpack-premium-analytics-pkg' ) },
		],
		[ search ]
	);

	let notice: PageNoticeProps | null = null;

	if ( summary.isError ) {
		// Same split as the widgets, plus a 404: sites that hide the users
		// endpoint answer with one, and no Retry brings it back.
		notice =
			getApiErrorStatus( summary.error ) === 404
				? {
						intent: 'info',
						description: __(
							"This site doesn't share author profiles.",
							'jetpack-premium-analytics-pkg'
						),
					}
				: describeError( summary.error, {
						retryDescription: __(
							"We couldn't load this author. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: summary.refetch,
					} );
	} else if ( summary.isNotFound ) {
		notice = {
			intent: 'info',
			description: __( "We couldn't find this author.", 'jetpack-premium-analytics-pkg' ),
			link: {
				label: __( 'Back to Authors', 'jetpack-premium-analytics-pkg' ),
				render: (
					<Link
						to="/reports/$report"
						params={ { report: 'authors' } as unknown as never }
						search={ reportSearch as unknown as never }
					/>
				),
			},
		};
	} else if ( isAnchoringAllTime && anchor.isError ) {
		// Without the author's start, all time has no start to report from.
		notice = describeError( anchor.error, {
			retryDescription: __(
				"We couldn't load this author's stats. Please try again in a moment.",
				'jetpack-premium-analytics-pkg'
			),
			onRetry: anchor.refetch,
		} );
	}

	return (
		<>
			<PeriodChangeStatus
				attentionId={ attentionId }
				appliedPresetId={ dateFilters.appliedPresetId }
				appliedRange={ dateFilters.appliedRange }
			/>
			<ReportScopeProvider openPeriod={ openPeriod }>
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
						<DetailPageShell
							visual={ <StatsPageIcon /> }
							breadcrumbs={
								<DetailPageBreadcrumbs isCustomizing={ isCustomizing }>
									<StatsBreadcrumbs items={ breadcrumbs } />
								</DetailPageBreadcrumbs>
							}
							actions={
								<DetailPageActions
									isCustomizing={ isCustomizing }
									onCustomize={ canCustomize ? startCustomizing : undefined }
									onReset={ resetToDefault }
									editingActions={ <WidgetDashboard.Actions /> }
								/>
							}
						>
							<DetailPageLayout
								header={ authorHeaderSlots( { summary } ) }
								// The presets render in every summary state, so the range stays
								// adjustable while the author loads or errors.
								controls={
									<DateFiltersPanel
										{ ...dateFilters }
										{ ...dateControls }
										onChange={ onDateChange }
										onApply={ onDateApply }
										attentionId={ attentionId }
									/>
								}
								returnToTopKey={ attentionId }
							>
								{ canRenderWidgets ? (
									<DetailPageSection>
										<WidgetDashboard.Widgets />
									</DetailPageSection>
								) : null }
								{ notice ? (
									<DetailPageSection>
										<PageNotice { ...notice } />
									</DetailPageSection>
								) : null }
							</DetailPageLayout>
						</DetailPageShell>
					</WidgetDashboard>
				</WidgetDashboard.Policy>
			</ReportScopeProvider>
		</>
	);
}

/**
 * Route stage wrapper.
 *
 * @return The author detail page with its data and error providers.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			{ /* No compared period on this page; the params stay on the URL for the breadcrumb. */ }
			<ReportScopeProvider offersComparison={ false }>
				<PeriodChangeSignalProvider>
					<AuthorDetail />
				</PeriodChangeSignalProvider>
			</ReportScopeProvider>
		</AnalyticsQueryClientProvider>
	);
}
