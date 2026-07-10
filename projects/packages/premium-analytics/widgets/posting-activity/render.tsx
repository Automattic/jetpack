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
import { getPostingActivityHeatmapRange } from './range';
import styles from './style.module.css';
import type { PostingActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type PostingActivityRenderAttributes = PostingActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostingActivityWidgetProps = WidgetRenderProps< PostingActivityRenderAttributes >;

/**
 * Fetches the posting-activity streak through the designated `useStatsStreak`
 * hook and renders it as a calendar heatmap. The `stats/streak` endpoint
 * returns a `{ 'yyyy-MM-dd': count }` map of posts per day (no comparison
 * period); `buildCalendarHeatmapData` lays that out into the week-column /
 * weekday-row grid the chart expects. The heatmap always queries a trailing
 * year ending at the dashboard picker end date, then renders the slice that
 * fits the widget's current size.
 *
 * @return The widget content.
 */
function PostingActivityInner( { windowOffset = 0 }: { windowOffset?: number } ) {
	const { reportParams } = useWidgetRootContext();
	const [ contentElement, setContentElement ] = useState< HTMLDivElement | null >( null );
	const [ contentSize, setContentSize ] = useState( { width: 0, height: 0 } );

	const heatmapRange = useMemo(
		() =>
			getPostingActivityHeatmapRange( reportParams.to, {
				contentWidth: contentSize.width,
				contentHeight: contentSize.height,
				windowOffset,
			} ),
		[ contentSize.height, contentSize.width, reportParams.to, windowOffset ]
	);

	const streakReportParams = useMemo(
		() => ( {
			...reportParams,
			startDate: heatmapRange.queryStartDate,
			endDate: heatmapRange.queryEndDate,
		} ),
		[ heatmapRange.queryEndDate, heatmapRange.queryStartDate, reportParams ]
	);

	const { data, isLoading, isError } = useStatsStreak( streakReportParams );

	const { data: heatmapData, rowLabels } = useMemo( () => {
		const series: DataPointDate[] = Object.entries( data ?? {} ).map(
			( [ dateString, value ] ) => ( {
				dateString,
				value,
			} )
		);
		return buildCalendarHeatmapData( series, {
			startDate: heatmapRange.startDate,
			endDate: heatmapRange.endDate,
		} );
	}, [ data, heatmapRange.endDate, heatmapRange.startDate ] );

	useEffect( () => {
		if ( ! contentElement ) {
			return;
		}

		const updateSize = ( width: number, height: number ) => {
			const nextSize = {
				width: Math.round( width ),
				height: Math.round( height ),
			};
			setContentSize( previousSize =>
				previousSize.width === nextSize.width && previousSize.height === nextSize.height
					? previousSize
					: nextSize
			);
		};

		const initialRect = contentElement.getBoundingClientRect();
		updateSize( initialRect.width, initialRect.height );

		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const observer = new ResizeObserver( entries => {
			const rect = entries[ 0 ]?.contentRect ?? contentElement.getBoundingClientRect();
			updateSize( rect.width, rect.height );
		} );
		observer.observe( contentElement );

		return () => observer.disconnect();
	}, [ contentElement ] );

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
		<div className={ styles.content } ref={ setContentElement }>
			<HeatmapChart
				data={ heatmapData }
				rowLabels={ rowLabels }
				compact={ heatmapRange.compact }
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
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner heatmap — resolved from the dashboard date range
 * via context, the same way the other Stats widgets read them. The widget's
 * own activity window offset is forwarded to the inner component.
 *
 * @param {PostingActivityWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostingActivity( { attributes = {} }: PostingActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<PostingActivityInner windowOffset={ attributes.activityWindowOffset } />
			</div>
		</WidgetRoot>
	);
}
