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
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailChartIntervals } from '../use-detail-chart-intervals';
import { useDetailDatePresets } from '../use-detail-date-presets';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { VideoSummaryCard } from './components';
import { VIDEO_DETAIL_LAYOUT } from './config';
import { useVideoSummary } from './hooks';
import { route } from './package.json';
import styles from './stage.module.scss';

const ROUTE_FROM = route.path;

// The video-detail composition is fixed (WOOA7S-1625) and laid out against the
// small (200px) row height used by the design, matching post detail. Keep its
// grid independent from the customizable main-dashboard preference so a future
// settings control cannot stretch these tiles out of proportion.
const VIDEO_DETAIL_GRID = { ...DEFAULT_GRID, rowHeight: ROW_HEIGHT_PRESETS.small };

// The layout is fixed, so the change callback never fires; the dashboard
// still requires one because it owns a staging copy internally.
const noopLayoutChange = () => {};

// The share of the header row the date filter presets can never use: the
// summary's 400px `min-inline-size` floor plus the row's 16px gap (see
// `.summary` and `.header` in stage.module.scss — keep the three in sync),
// plus a 24px buffer so the panel steps down before the wrap threshold —
// layout wraps synchronously while the measured layout flip lags a frame, so
// equal thresholds would flash a wrapped row at every boundary.
const HEADER_RESERVED_INLINE_SIZE = 440;

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
				// `per_page: -1` returns every widget type. Without it, core-data's
				// default query (`per_page: 10`) caps the records at 10 and could
				// silently drop the widgets this page's fixed layout requires.
				.getEntityRecords( 'root', 'widgetModule', { per_page: -1 } ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules );

	// The applied report date range lives in the URL search params, staged and
	// committed by the shared date-filter controller (WOOA7S-1816 — restored
	// after the preset-measurement rework in #50906 landed).
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const chartIntervals = useDetailChartIntervals(
		dateFilters.interval,
		dateFilters.intervalOptions
	);
	// All time, then the rolling windows, and no custom range — the detail-page
	// design; all time runs from the day this resource was published.
	const datePresets = useDetailDatePresets( summary.publishedDate );

	// The header row hosts the panel in a shrink-to-fit slot, so the panel
	// measures the row itself to pick its responsive layout; see the
	// `containerElement` prop.
	const [ headerElement, setHeaderElement ] = useState< HTMLElement | null >( null );

	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const reportSearch = pickReportDateParams( search );

	// The page's no-comparison invariant is the report scope the stage declares,
	// so the layout is the fixed composition.
	const layout = VIDEO_DETAIL_LAYOUT;

	// Error and not-found responses have no trustworthy title, so only resolved
	// videos add the title crumb or render the heading.
	const title =
		summary.isLoading || summary.isError || summary.isNotFound
			? undefined
			: summary.title?.trim() || __( 'Untitled video', 'jetpack-premium-analytics-pkg' );
	const resolvedSummary = { ...summary, title };
	const breadcrumbs = useDetailBreadcrumbs( title );
	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;
	let summaryContent: JSX.Element | null;

	if ( summary.isLoading ) {
		summaryContent = null;
	} else if ( summary.isError ) {
		summaryContent = (
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
		summaryContent = (
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
	} else {
		summaryContent = (
			<VideoSummaryCard summary={ resolvedSummary } performanceRange={ dateFilters.appliedRange } />
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
			<Page
				visual={ <StatsPageIcon /> }
				breadcrumbs={ <StatsBreadcrumbs items={ breadcrumbs } /> }
				className={ styles.page }
			>
				<div className={ styles.scrollArea }>
					{ /*
					 * The summary and the date filter presets share the header row —
					 * title on the left, presets on the right, per the design mocks.
					 * The presets render in every summary state so the range stays
					 * adjustable while the video loads or errors.
					 */ }
					<div ref={ setHeaderElement } className={ styles.header }>
						{ summaryContent ? <div className={ styles.summary }>{ summaryContent }</div> : null }
						<div className={ styles.dateFilters }>
							{ /*
							 * The design has no period-over-period comparison on this
							 * page. The panel reads that from the scope the stage
							 * declares, which is the same declaration that keeps the
							 * params away from the widgets.
							 *
							 * The interval control is on: the views chart is bucketed by
							 * it and carries no bucket control of its own. It is narrowed
							 * to the buckets that chart can draw — see
							 * `useDetailChartIntervals`.
							 */ }
							<DateFiltersPanel
								{ ...dateFilters }
								{ ...chartIntervals }
								{ ...datePresets }
								containerElement={ headerElement }
								reservedInlineSize={ HEADER_RESERVED_INLINE_SIZE }
							/>
						</div>
					</div>
					{ canRenderWidgets ? (
						<div className={ styles.content }>
							<WidgetDashboard.Widgets className={ styles.widgets } />
						</div>
					) : null }
				</div>
			</Page>
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
				 * The page names no compared period and offers no control for one,
				 * so nothing below may fetch or draw a comparison. The params stay
				 * on the URL so the breadcrumb carries the dashboard's state back
				 * out.
				 */ }
				<ReportScopeProvider offersComparison={ false }>
					<VideoDetail />
				</ReportScopeProvider>
			</GlobalErrorProvider>
		</AnalyticsQueryClientProvider>
	);
}
