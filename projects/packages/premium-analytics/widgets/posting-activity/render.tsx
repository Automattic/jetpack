/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import {
	HeatmapChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	buildCalendarHeatmapData,
	useWidgetRootContext,
	type DataPointDate,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useEffect, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { PostingActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type PostingActivityRenderAttributes = PostingActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostingActivityWidgetProps = WidgetRenderProps< PostingActivityRenderAttributes >;

const ACTIVITY_DAY_COUNT = 365;
const COMPACT_COLUMN_WIDTH = 13;
const DEFAULT_COLUMN_WIDTH = 35;
const ROW_LABEL_WIDTH = 30;
const DEFAULT_HEATMAP_ASPECT_RATIO = 0.4;
const DEFAULT_HEATMAP_HEIGHT = 350;

type DateRange = {
	startDate: string;
	endDate: string;
};

type ContentSize = {
	width: number;
	height: number;
};

function getDatePart( value?: string ) {
	return value?.split( 'T' )[ 0 ];
}

function toUtcDate( dateString: string ) {
	const date = new Date( `${ dateString }T00:00:00Z` );
	return Number.isNaN( date.getTime() ) ? null : date;
}

function formatUtcDate( date: Date ) {
	return date.toISOString().slice( 0, 10 );
}

function addUtcDays( dateString: string, dayCount: number ) {
	const date = toUtcDate( dateString );

	if ( ! date ) {
		return undefined;
	}

	date.setUTCDate( date.getUTCDate() + dayCount );
	return formatUtcDate( date );
}

function getWeekStartDate( dateString: string ) {
	const date = toUtcDate( dateString );

	if ( ! date ) {
		return undefined;
	}

	const dayOffset = ( date.getUTCDay() + 6 ) % 7;
	date.setUTCDate( date.getUTCDate() - dayOffset );
	return formatUtcDate( date );
}

function getPostingActivityRange( to?: string ): DateRange | undefined {
	const endDate = getDatePart( to );
	const startDate = endDate ? addUtcDays( endDate, 1 - ACTIVITY_DAY_COUNT ) : undefined;

	return startDate && endDate ? { startDate, endDate } : undefined;
}

function getColumnCount( contentWidth: number, columnWidth: number ) {
	if ( contentWidth <= 0 ) {
		return undefined;
	}

	return Math.max( 1, Math.floor( ( contentWidth - ROW_LABEL_WIDTH ) / columnWidth ) );
}

function getVisibleRange( range: DateRange, contentWidth: number, columnWidth: number ): DateRange {
	const columnCount = getColumnCount( contentWidth, columnWidth );
	const endWeekStart = getWeekStartDate( range.endDate );

	if ( ! columnCount || ! endWeekStart ) {
		return range;
	}

	const startDate = addUtcDays( endWeekStart, -7 * ( columnCount - 1 ) );

	if ( ! startDate || startDate < range.startDate ) {
		return range;
	}

	return { startDate, endDate: range.endDate };
}

function getElementContentSize( element: HTMLDivElement ): ContentSize {
	const rect = element.getBoundingClientRect();
	const computedStyle = window.getComputedStyle( element );
	const paddingInline =
		( parseFloat( computedStyle.paddingLeft ) || 0 ) +
		( parseFloat( computedStyle.paddingRight ) || 0 );
	const paddingBlock =
		( parseFloat( computedStyle.paddingTop ) || 0 ) +
		( parseFloat( computedStyle.paddingBottom ) || 0 );

	return {
		width: Math.max( 0, rect.width - paddingInline ),
		height: Math.max( 0, rect.height - paddingBlock ),
	};
}

function useContentSize( element: HTMLDivElement | null ): ContentSize {
	const [ size, setSize ] = useState< ContentSize >( { width: 0, height: 0 } );

	useEffect( () => {
		if ( ! element ) {
			return;
		}

		const updateSize = ( nextSize: ContentSize ) => {
			const width = Math.round( nextSize.width );
			const height = Math.round( nextSize.height );

			setSize( previousSize =>
				previousSize.width === width && previousSize.height === height
					? previousSize
					: { width, height }
			);
		};

		updateSize( getElementContentSize( element ) );

		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const observer = new ResizeObserver( entries => {
			const rect = entries[ 0 ]?.contentRect;
			updateSize(
				rect ? { width: rect.width, height: rect.height } : getElementContentSize( element )
			);
		} );
		observer.observe( element );

		return () => observer.disconnect();
	}, [ element ] );

	return size;
}

function buildStreakSeries(
	counts: Record< string, number >,
	from?: string,
	to?: string
): DataPointDate[] {
	const fromPart = from?.split( 'T' )[ 0 ];
	const toPart = to?.split( 'T' )[ 0 ];

	if ( ! fromPart || ! toPart || fromPart > toPart ) {
		return Object.entries( counts ).map( ( [ dateString, value ] ) => ( {
			dateString,
			value,
		} ) );
	}

	const series: DataPointDate[] = [];
	const end = new Date( `${ toPart }T00:00:00Z` );

	for (
		let day = new Date( `${ fromPart }T00:00:00Z` );
		day <= end;
		day.setUTCDate( day.getUTCDate() + 1 )
	) {
		const dateString = day.toISOString().slice( 0, 10 );
		series.push( { dateString, value: counts[ dateString ] ?? null } );
	}

	return series;
}

/**
 * Fetches the posting-activity streak through the designated `useStatsStreak`
 * hook and renders it as a calendar heatmap. The `stats/streak` endpoint
 * returns a `{ 'yyyy-MM-dd': count }` map of posts per day (no comparison
 * period); `buildCalendarHeatmapData` lays that out into the week-column /
 * weekday-row grid the chart expects. Data is queried for the trailing year
 * ending at the dashboard picker end date.
 *
 * @return The widget content.
 */
function PostingActivityInner() {
	const { reportParams } = useWidgetRootContext();
	const [ contentElement, setContentElement ] = useState< HTMLDivElement | null >( null );
	const contentSize = useContentSize( contentElement );
	const activityRange = useMemo(
		() => getPostingActivityRange( reportParams.to ),
		[ reportParams.to ]
	);
	const useDefaultHeatmap =
		contentSize.height >= DEFAULT_HEATMAP_HEIGHT &&
		contentSize.height >= contentSize.width * DEFAULT_HEATMAP_ASPECT_RATIO;
	const visibleRange = useMemo(
		() =>
			activityRange
				? getVisibleRange(
						activityRange,
						contentSize.width,
						useDefaultHeatmap ? DEFAULT_COLUMN_WIDTH : COMPACT_COLUMN_WIDTH
				  )
				: activityRange,
		[ activityRange, contentSize.width, useDefaultHeatmap ]
	);
	const streakReportParams = useMemo(
		() =>
			activityRange
				? {
						...reportParams,
						startDate: activityRange.startDate,
						endDate: activityRange.endDate,
				  }
				: reportParams,
		[ activityRange, reportParams ]
	);
	const contentClassName = `${ styles.content } ${
		useDefaultHeatmap ? styles.contentDefault : ''
	}`;
	const heatmapFrameClassName = `${ styles.heatmapFrame } ${
		useDefaultHeatmap ? styles.heatmapFrameDefault : ''
	}`;

	const { data, isLoading, isError } = useStatsStreak( streakReportParams );

	const { data: heatmapData, rowLabels } = useMemo( () => {
		const series =
			data && visibleRange
				? buildStreakSeries( data, visibleRange.startDate, visibleRange.endDate )
				: [];
		return buildCalendarHeatmapData( series );
	}, [ data, visibleRange ] );

	const hasData = heatmapData.length > 0;

	if ( isLoading && ! hasData ) {
		return (
			<div className={ styles.content }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	if ( isError ) {
		return (
			<div className={ styles.content }>
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>{ __( 'Could not load posting activity.', 'jetpack-premium-analytics' ) }</Text>
				</Stack>
			</div>
		);
	}

	if ( ! hasData ) {
		return (
			<div className={ styles.content }>
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>
						{ __(
							'Posts you publish will appear here as a calendar heatmap.',
							'jetpack-premium-analytics'
						) }
					</Text>
				</Stack>
			</div>
		);
	}

	return (
		<div className={ contentClassName } ref={ setContentElement }>
			<div className={ heatmapFrameClassName }>
				<HeatmapChart
					data={ heatmapData }
					rowLabels={ rowLabels }
					compact={ ! useDefaultHeatmap }
					aspectRatio={ useDefaultHeatmap ? DEFAULT_HEATMAP_ASPECT_RATIO : undefined }
					width={ useDefaultHeatmap && contentSize.width > 0 ? contentSize.width : undefined }
					primaryColor="var(--wp-admin-theme-color, #3858e9)"
					withTooltips
					className={ styles.heatmap }
				>
					<HeatmapChart.Legend
						lessLabel={ __( 'Fewer Posts', 'jetpack-premium-analytics' ) }
						moreLabel={ __( 'More Posts', 'jetpack-premium-analytics' ) }
					/>
				</HeatmapChart>
			</div>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner heatmap — resolved from the dashboard date range
 * via context, the same way the other Stats widgets read them.
 *
 * @param {PostingActivityWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostingActivity( { attributes = {} }: PostingActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<PostingActivityInner />
			</div>
		</WidgetRoot>
	);
}
