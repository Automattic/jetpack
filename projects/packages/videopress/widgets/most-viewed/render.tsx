/**
 * Internal dependencies
 */
import MostViewedCard from '../../src/dashboard/components/overview/most-viewed-card';
import StatsWidget, { type StatsWidgetProps } from '../../src/dashboard/components/stats-widget';

/**
 * Most viewed widget: the videos with the most views in the period on show.
 *
 * @param {StatsWidgetProps} props - The props.
 * @return The widget.
 */
export default function MostViewed( props: StatsWidgetProps ) {
	return (
		<StatsWidget { ...props }>
			{ ( { stats, isLoading } ) => (
				<MostViewedCard videos={ stats.topVideos } isLoading={ isLoading } />
			) }
		</StatsWidget>
	);
}
