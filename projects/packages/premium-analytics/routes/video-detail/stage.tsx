/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { pickReportDateParams, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel, StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	DetailPageActions,
	DetailPageBreadcrumbs,
	DetailPageLayout,
	DetailPageSection,
	DetailPageShell,
	useDetailPageCustomize,
	useStoredDetailLayout,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { DETAIL_GRID } from '../grid';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { videoHeaderSlots } from './components';
import { VIDEO_DETAIL_LAYOUT } from './config';
import { useVideoSummary } from './hooks';
import { route } from './package.json';

const ROUTE_FROM = route.path;

// Its own preferences scope: the routes are separate packages, and the detail
// surfaces' stored arrangements have no reason to share a namespace.
const PREFERENCES_SCOPE = 'jetpack-premium-analytics/video-detail';

// The page shows one layout, so one stored arrangement.
const LAYOUT_ID = 'video';

/**
 * Premium Analytics video detail page shell.
 *
 * The composition is fixed (WOOA7S-1625), but the reader can rearrange its
 * cards from the page options menu (STATS-428); the arrangement is committed
 * by the dashboard's own Done action and stored in preferences.
 *
 * @return The video detail page.
 */
function VideoDetail(): JSX.Element {
	const { videoId: videoIdParam } = useParams( { from: ROUTE_FROM } ) as { videoId?: string };
	const summary = useVideoSummary( Number( videoIdParam ) );

	const widgetModules = useSelect(
		select =>
			(
				select( coreStore ) as unknown as {
					getEntityRecords: (
						kind: string,
						name: string,
						query?: Record< string, unknown >
					) => WidgetModuleRecord[] | null;
				}
			 )
				// `per_page: -1` returns every widget type; core-data's default query
				// (`per_page: 10`) could silently drop ones this fixed layout requires.
				.getEntityRecords( 'root', 'widgetModule', { per_page: -1 } ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules );

	// The applied report date range lives in the URL search params.
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dateControls = useDetailDateControls( summary.publishedDate, dateFilters );

	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const reportSearch = pickReportDateParams( search );

	// The stored arrangement, layered over the fixed composition.
	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		PREFERENCES_SCOPE,
		LAYOUT_ID,
		VIDEO_DETAIL_LAYOUT
	);

	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;

	// Without cards there is nothing to arrange, and a refetch that fails
	// mid-customize would otherwise hide Cancel and Done along with the grid.
	const { isCustomizing, canCustomize, canPerform, startCustomizing, onEditChange } =
		useDetailPageCustomize( layout, { enabled: canRenderWidgets } );

	// Error and not-found responses have no trustworthy title, so only a
	// resolved video adds the title crumb.
	const breadcrumbs = useDetailBreadcrumbs(
		canRenderWidgets
			? summary.title?.trim() || __( 'Untitled video', 'jetpack-premium-analytics-pkg' )
			: undefined
	);

	// The reason a video is missing goes below the header, where the widgets
	// would have been.
	let notice: JSX.Element | null = null;

	if ( summary.isError ) {
		notice = (
			<Stack direction="column" align="flex-start" gap="sm">
				<Text>
					{ __(
						"We couldn't load this video. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				</Text>
				<Button variant="outline" onClick={ summary.refetch }>
					{ __( 'Retry', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			</Stack>
		);
	} else if ( summary.isNotFound ) {
		notice = (
			<Stack direction="column" align="flex-start" gap="sm">
				<Text>{ __( "We couldn't find this video.", 'jetpack-premium-analytics-pkg' ) }</Text>
				<Link
					to="/reports/$report"
					params={ { report: 'videos' } as unknown as never }
					search={ reportSearch as unknown as never }
				>
					{ __( 'Back to Videos', 'jetpack-premium-analytics-pkg' ) }
				</Link>
			</Stack>
		);
	}

	return (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			<WidgetDashboard
				widgetTypes={ widgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				resolveWidgetModule={ resolveWidgetModuleWithI18n }
				layout={ layout }
				onLayoutChange={ setLayout }
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
							editingActions={ <WidgetDashboard.Actions /> }
						/>
					}
				>
					<DetailPageLayout
						header={ videoHeaderSlots( {
							summary,
							performanceRange: dateFilters.appliedRange,
						} ) }
						// The presets render in every summary state, so the range stays
						// adjustable while the video loads or errors.
						controls={ <DateFiltersPanel { ...dateFilters } { ...dateControls } /> }
					>
						{ canRenderWidgets ? (
							<DetailPageSection>
								<WidgetDashboard.Widgets />
							</DetailPageSection>
						) : null }
						{ notice ? <DetailPageSection>{ notice }</DetailPageSection> : null }
					</DetailPageLayout>
				</DetailPageShell>
			</WidgetDashboard>
		</WidgetDashboard.Policy>
	);
}

/**
 * Route stage wrapper.
 *
 * @return The video detail page with its data and error providers.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<GlobalErrorProvider>
				{ /*
				 * The page names no compared period, so nothing below may fetch or draw
				 * one. The params stay on the URL for the breadcrumb to carry back out.
				 */ }
				<ReportScopeProvider offersComparison={ false }>
					<VideoDetail />
				</ReportScopeProvider>
			</GlobalErrorProvider>
		</AnalyticsQueryClientProvider>
	);
}
