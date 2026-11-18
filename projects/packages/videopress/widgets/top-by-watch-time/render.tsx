/**
 * Internal dependencies
 */
import TopByWatchTimeCard from '../../src/dashboard/components/overview/top-by-watch-time-card';
import StatsWidget, { type StatsWidgetProps } from '../../src/dashboard/components/stats-widget';

/**
 * Top by watch time widget: the videos watched the longest in the period on show.
 *
 * @param {StatsWidgetProps} props - The props.
 * @return The widget.
 */
export default function TopByWatchTime( props: StatsWidgetProps ) {
	return (
		<StatsWidget { ...props }>
			{ ( { stats, isLoading } ) => (
				<TopByWatchTimeCard videos={ stats.topVideosByWatchTime } isLoading={ isLoading } />
			) }
		</StatsWidget>
	);
}
