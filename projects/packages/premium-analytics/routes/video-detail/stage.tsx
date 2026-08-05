/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { pickReportDateParams, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
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

	// The applied report date range lives in the URL search params, read through
	// the shared date-filter controller. The panel that edits it is intentionally
	// absent for now: the header's filter UI collides with the preset-measurement
	// rework in progress, so it ships separately once that lands (WOOA7S-1816).
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const reportSearch = pickReportDateParams( search );

	// Error and not-found responses have no trustworthy title, so only resolved
	// videos add the title crumb or render the heading.
	const title =
		summary.isLoading || summary.isError || summary.isNotFound
			? undefined
			: summary.title?.trim() || __( 'Untitled video', 'jetpack-premium-analytics-pkg' );
	const resolvedSummary = { ...summary, title };
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
			layout={ VIDEO_DETAIL_LAYOUT }
			onLayoutChange={ noopLayoutChange }
			gridSettings={ VIDEO_DETAIL_GRID }
		>
			<Page
				visual={ <StatsPageIcon /> }
				breadcrumbs={ <StatsBreadcrumbs items={ title ? [ { label: title } ] : [] } /> }
				className={ styles.page }
			>
				<div className={ styles.scrollArea }>
					{ summaryContent ? (
						<div className={ styles.header }>
							<div className={ styles.summary }>{ summaryContent }</div>
						</div>
					) : null }
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
				<VideoDetail />
			</GlobalErrorProvider>
		</AnalyticsQueryClientProvider>
	);
}
