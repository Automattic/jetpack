/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	HeatmapChart,
	WidgetRoot,
	WidgetState,
	buildCalendarHeatmapData,
	useWidgetRootContext,
	type DataPointDate,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
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

/**
 * Fetches the posting-activity streak through the designated `useStatsStreak`
 * hook and renders it as a calendar heatmap. The `stats/streak` endpoint
 * returns a `{ 'yyyy-MM-dd': count }` map of posts per day (no comparison
 * period); `buildCalendarHeatmapData` lays that out into the week-column /
 * weekday-row grid the chart expects. The date range comes from the dashboard
 * picker via `reportParams`.
 *
 * @return The widget content.
 */
function PostingActivityInner() {
	const { reportParams } = useWidgetRootContext();

	const { data, isLoading, isFetching, isError, refetch } = useStatsStreak( reportParams );

	const { data: heatmapData, rowLabels } = useMemo( () => {
		const series: DataPointDate[] = Object.entries( data ?? {} ).map(
			( [ dateString, value ] ) => ( {
				dateString,
				value,
			} )
		);
		return buildCalendarHeatmapData( series );
	}, [ data ] );

	const hasData = heatmapData.length > 0;

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps the previous response via `placeholderData`, so only
				// surface the error when there is nothing to show.
				isError={ isError && ! hasData }
				isEmpty={ ! hasData }
				error={ {
					description: __(
						"We couldn't load posting activity. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: () => void refetch() },
					],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No posts published in this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<HeatmapChart
					data={ heatmapData }
					rowLabels={ rowLabels }
					compact
					primaryColor="var(--wp-admin-theme-color, #3858e9)"
					withTooltips
					className={ styles.heatmap }
				>
					<HeatmapChart.Legend
						lessLabel={ __( 'Fewer Posts', 'jetpack-premium-analytics' ) }
						moreLabel={ __( 'More Posts', 'jetpack-premium-analytics' ) }
					/>
				</HeatmapChart>
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner heatmap — resolved from the dashboard date range
 * via context, the same way the other Stats widgets read them. This widget has
 * no own settings, so nothing is forwarded to the inner component.
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
