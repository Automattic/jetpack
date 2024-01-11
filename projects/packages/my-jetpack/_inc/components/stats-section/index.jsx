import useStatsCounts from '../../hooks/use-stats-counts';
import StatsCards from './cards';
/**
 * StatsSection component that renders the Stats cards, passing down the stats counts from the store.
 *
 * @returns {object} The StatsSection component.
 */
const StatsSection = () => {
	const { statsCounts } = useStatsCounts();
	const counts = statsCounts?.past_seven_days || {};
	const previousCounts = statsCounts?.between_past_eight_and_fifteen_days || {};

	return <StatsCards counts={ counts } previousCounts={ previousCounts } />;
};

export default StatsSection;
