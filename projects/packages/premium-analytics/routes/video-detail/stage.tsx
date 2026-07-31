/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import {
	pickReportDateParams,
	useDashboardLink,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import {
	COMPACT_CONTROLS_MIN_WIDTH,
	DateFiltersPanel,
	MOBILE_CONTAINER_WIDTH_THRESHOLD,
} from '@jetpack-premium-analytics/ui';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useResizeObserver } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import clsx from 'clsx';
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

// Mirrors `.summary`'s `min-inline-size` floor and the header row's gap
// (`--wpds-dimension-gap-lg`): the space the degradation decision reserves for
// the summary block before measuring what is left for the filters panel.
const SUMMARY_MIN_INLINE_SIZE = 320;
const HEADER_ROW_GAP = 16;

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

	// The single resource, date range, and comparison all live in the URL search
	// params, staged and committed by the shared date-filter controller.
	const dateFilters = useReportDateFilters( ROUTE_FROM );

	const dashboardLink = useDashboardLink();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const reportSearch = pickReportDateParams( search );

	// Container element for the date filters panel responsive layout.
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	/*
	 * The header row's degradation order is decided here, from the row width
	 * alone: full pills while the summary's minimum plus the full panel fit
	 * the row, then a compact panel still on the row, and only when even the
	 * compact controls no longer fit does the panel drop below the title
	 * block. Deriving every state from the row width — never from the panel's
	 * own rendered width, which shrinks when it goes compact — keeps the
	 * decision a pure function of the viewport, so it re-evaluates cleanly in
	 * both directions and cannot oscillate or deadlock.
	 */
	const [ headerRowWidth, setHeaderRowWidth ] = useState< number | null >( null );
	const onHeaderRowResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			setHeaderRowWidth( entry.contentRect.width );
		}
	}, [] );
	const setHeaderRowResizeRef = useResizeObserver< HTMLDivElement >( onHeaderRowResize );
	const setHeaderRowElement = useCallback(
		( node: HTMLDivElement | null ) => {
			setContainerElement( node );
			setHeaderRowResizeRef( node );
		},
		[ setHeaderRowResizeRef ]
	);
	const filtersAvailableWidth =
		headerRowWidth === null ? null : headerRowWidth - SUMMARY_MIN_INLINE_SIZE - HEADER_ROW_GAP;
	const filtersCompact =
		filtersAvailableWidth !== null && filtersAvailableWidth < MOBILE_CONTAINER_WIDTH_THRESHOLD;
	const filtersStacked =
		filtersAvailableWidth !== null && filtersAvailableWidth < COMPACT_CONTROLS_MIN_WIDTH;

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
				breadcrumbs={
					<Breadcrumbs
						items={ [
							{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
							...( title ? [ { label: title } ] : [] ),
						] }
					/>
				}
				className={ styles.page }
			>
				<div className={ styles.scrollArea }>
					{ /*
					 * The summary and the date filters share the header row, per the
					 * design mock: thumbnail + title block on the left, the preset
					 * pills right-aligned. Unlike post detail's fixed filters bar,
					 * the panel scrolls away with the page — matching the mock. The
					 * degradation order (full pills on the row → compact on the row
					 * → dropped below the title block) is computed above from the
					 * row width; the row is also the panel's `containerElement` for
					 * its calendar layout. The design has no period-over-period
					 * comparison on this page, so the Compare control is opted out
					 * (the route also normalizes comparison params away).
					 */ }
					<div
						ref={ setHeaderRowElement }
						className={ clsx( styles.header, { [ styles.headerStacked ]: filtersStacked } ) }
					>
						{ summaryContent ? <div className={ styles.summary }>{ summaryContent }</div> : null }
						<div className={ styles.dateFilters }>
							<DateFiltersPanel
								{ ...dateFilters }
								showComparison={ false }
								isCompact={ filtersCompact }
								containerElement={ containerElement }
							/>
						</div>
					</div>
					{ canRenderWidgets ? (
						<div className={ styles.content }>
							<WidgetDashboard.Widgets />
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
