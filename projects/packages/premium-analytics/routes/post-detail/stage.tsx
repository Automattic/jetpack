import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	PeriodChangeSignalProvider,
	postSurface,
	ReportScopeProvider,
	useSettlePeriodChange,
} from '@jetpack-premium-analytics/data';
import { LinkButton } from '@jetpack-premium-analytics/externals';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import {
	DateFiltersPanel,
	PeriodChangeStatus,
	safeHttpUrl,
	SectionTabs,
	StatsBreadcrumbs,
	StatsPageIcon,
} from '@jetpack-premium-analytics/ui';
import {
	DetailPageActions,
	DetailPageBreadcrumbs,
	DetailPageEmptyState,
	DetailPageLayout,
	DetailPageSection,
	DetailPageShell,
	useDetailPageCustomize,
	useStoredDetailLayout,
	useTrackedDateRangeApply,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { DETAIL_GRID } from '../grid';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { useWidgetModules } from '../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { withWidgetTypeAliases } from '../widget-type-aliases';
import { postHeaderSlots } from './components';
import { EMAIL_TAB_IDS, POST_DETAIL_WIDGET_TYPE_ALIASES } from './config';
import { useEmailTabScope, usePostDetailTabs, usePostSummary } from './hooks';
import { route } from './package.json';

const ROUTE_FROM = route.path;

// Its own preferences scope: the routes are separate packages, and the detail
// surfaces' stored arrangements have no reason to share a namespace.
const PREFERENCES_SCOPE = 'jetpack-premium-analytics/post-detail';

/**
 * Premium Analytics post/page detail page stage component.
 *
 * The composition is fixed (WOOA7S-1622), but the reader can rearrange its
 * cards per tab from the page options menu (STATS-428); the arrangement is
 * committed by the dashboard's own Done action and stored in preferences.
 *
 * @return {JSX.Element} The post detail page.
 */
function PostDetail(): JSX.Element {
	const { postId: postIdParam } = useParams( { from: ROUTE_FROM } ) as { postId?: string };
	const postId = Number( postIdParam );

	const summary = usePostSummary( postId );

	const publicUrl = safeHttpUrl( summary.url );

	// The resource, date range, and comparison all live in the URL search params.
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dateControls = useDetailDateControls( summary.publishedDate, dateFilters );
	const { onChange: changeDateRange, onApply: applyDateRange } = dateFilters;
	const { trackedOnChange, trackedOnApply } = useTrackedDateRangeApply(
		{
			presetId: dateFilters.presetId,
			range: dateFilters.range,
			interval: dateFilters.interval,
			comparisonPresetId: dateFilters.comparisonPresetId,
			appliedComparisonRange: dateFilters.appliedComparisonRange,
		},
		{ surface: 'post_detail', offersComparison: false }
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

	// The email tabs report over the first 30 days after the send rather than
	// the URL range (WOOA7S-1945): their widgets take these params in place of
	// the URL's.
	const emailScope = useEmailTabScope( postId, dateControls.allTimeStart, dateFilters.timeZone );

	// With the summary failed the publish day will never arrive, so the email
	// tabs mount their fixed layout and let each widget surface its own error.
	const emailScopeBlocked = ! emailScope && ! summary.isLoading && summary.isError;

	const {
		tabs,
		activeTab,
		setActiveTab,
		layout: fixedLayout,
		isEmailNotSent,
		isEmailSendPending,
	} = usePostDetailTabs( postId, emailScope?.reportParams, emailScopeBlocked, summary.type );

	// The stored per-tab arrangement, layered over the fixed composition.
	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		PREFERENCES_SCOPE,
		activeTab,
		fixedLayout
	);

	// Each tab is its own layout, so leaving the tab, by click, Back, or a deep
	// link, leaves customize mode with it.
	const {
		isCustomizing,
		canCustomize,
		canPerform,
		startCustomizing,
		resetToDefault,
		onEditChange,
		onLayoutChange,
	} = useDetailPageCustomize( layout, {
		layoutId: activeTab,
		onLayoutReset: resetLayout,
		onLayoutChange: setLayout,
		surface: 'post_detail',
	} );

	const isEmailTab = EMAIL_TAB_IDS.includes( activeTab );
	// The email header names the send ("Email sent on…"), so a post that was
	// never sent gets the page-level state in place of the header and widgets.
	const showNotSent = isEmailTab && isEmailNotSent;
	// Until the type and the send check both answer, the tab may still turn
	// into that state, so it draws no header rather than one it may drop.
	const hideHeader = showNotSent || ( isEmailTab && ( summary.isLoading || isEmailSendPending ) );

	const widgetModules = useWidgetModules();
	const resolveWidgetModule = useWidgetModuleResolver( widgetModules );

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules );

	const pageWidgetTypes = useMemo(
		() => withWidgetTypeAliases( widgetTypes, POST_DETAIL_WIDGET_TYPE_ALIASES ),
		[ widgetTypes ]
	);

	const breadcrumbs = useDetailBreadcrumbs( summary.title );

	// A card on this page can set the period (the All-time traffic card opens a
	// month); the control then draws attention to it, the change is read out, and
	// the page returns to the top, where the re-scoped cards are.
	const attentionId = useSettlePeriodChange(
		postSurface( postId ),
		dateFilters.appliedRange,
		! isEmailTab
	);

	// The email tabs are pinned to the send window, so the filter would only
	// suggest a choice they do not offer; the range stays in the URL so the Post
	// traffic tab keeps its selection. The design has no comparison on this page
	// either — the panel reads that from the scope the stage declares.
	const dateFiltersPanel = isEmailTab ? null : (
		<DateFiltersPanel
			{ ...dateFilters }
			{ ...dateControls }
			onChange={ onDateChange }
			onApply={ onDateApply }
			attentionId={ attentionId }
		/>
	);

	return (
		<GlobalErrorProvider>
			<PeriodChangeStatus
				attentionId={ attentionId }
				appliedPresetId={ dateFilters.appliedPresetId }
				appliedRange={ dateFilters.appliedRange }
			/>
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
							>
								{ publicUrl ? (
									<LinkButton
										variant="solid"
										tone="neutral"
										size="compact"
										href={ publicUrl }
										openInNewTab
									>
										{ summary.type === 'page'
											? __( 'View page', 'jetpack-premium-analytics-pkg' )
											: __( 'View post', 'jetpack-premium-analytics-pkg' ) }
									</LinkButton>
								) : null }
							</DetailPageActions>
						}
					>
						{ /*
						 * The header is shared by every tab (same post, same range), so it
						 * renders once above the per-tab grid; the email tabs give it an
						 * email identity and report over the send window.
						 */ }
						<DetailPageLayout
							tabs={ <SectionTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
							header={
								hideHeader
									? undefined
									: postHeaderSlots( {
											summary,
											variant: isEmailTab ? 'email' : 'post',
											performanceRange: isEmailTab ? emailScope?.range : dateFilters.appliedRange,
										} )
							}
							controls={ dateFiltersPanel }
							returnToTopKey={ attentionId }
						>
							{ showNotSent ? (
								<DetailPageEmptyState
									title={ __(
										'This post hasn’t been sent as a newsletter',
										'jetpack-premium-analytics-pkg'
									) }
									description={ __(
										'Newsletter can help you reach subscribers in their inbox.',
										'jetpack-premium-analytics-pkg'
									) }
									actions={
										<LinkButton
											variant="outline"
											size="compact"
											href="https://jetpack.com/support/newsletter/"
											openInNewTab
										>
											{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
										</LinkButton>
									}
								/>
							) : (
								/* Keyed by tab: each tab is its own layout, so the grid mounts
								   fresh rather than reflowing one arrangement into the next. */
								<DetailPageSection key={ activeTab }>
									<WidgetDashboard.Widgets />
								</DetailPageSection>
							) }
						</DetailPageLayout>
					</DetailPageShell>
				</WidgetDashboard>
			</WidgetDashboard.Policy>
		</GlobalErrorProvider>
	);
}

/**
 * Route stage wrapper. Mounts its own AnalyticsQueryClientProvider above
 * PostDetail because widgets fetch through their own client inside
 * WidgetRoot, while the header summary fetches at the page level.
 *
 * @return {JSX.Element} The post detail page.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			{ /*
			 * The page names no compared period, so nothing below may fetch or draw
			 * one. The params stay on the URL for the breadcrumb to carry back out.
			 */ }
			<ReportScopeProvider offersComparison={ false }>
				<PeriodChangeSignalProvider>
					<PostDetail />
				</PeriodChangeSignalProvider>
			</ReportScopeProvider>
		</AnalyticsQueryClientProvider>
	);
}
