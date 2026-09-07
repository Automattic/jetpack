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
	DetailPageLayout,
	DetailPageSection,
	DetailPageShell,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { videoHeaderSlots } from './components';
import { VIDEO_DETAIL_LAYOUT } from './config';
import { useVideoSummary } from './hooks';
import { route } from './package.json';

const ROUTE_FROM = route.path;

// The composition is fixed (WOOA7S-1625), so keep its grid independent from the
// customizable main-dashboard preference — a future settings control must not
// stretch these tiles out of proportion.
const VIDEO_DETAIL_GRID = { ...DEFAULT_GRID, rowHeight: ROW_HEIGHT_PRESETS.small };

// The layout is fixed, so the change callback never fires; the dashboard
// still requires one because it owns a staging copy internally.
const noopLayoutChange = () => {};

/**
 * Premium Analytics video detail page shell.
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

	const layout = VIDEO_DETAIL_LAYOUT;

	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;

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
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			isResolvingWidgetTypes={ isResolvingWidgetTypes }
			resolveWidgetModule={ resolveWidgetModuleWithI18n }
			layout={ layout }
			onLayoutChange={ noopLayoutChange }
			gridSettings={ VIDEO_DETAIL_GRID }
		>
			<DetailPageShell
				visual={ <StatsPageIcon /> }
				breadcrumbs={ <StatsBreadcrumbs items={ breadcrumbs } /> }
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
