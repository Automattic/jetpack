import PropTypes from 'prop-types';
import useStatsCounts from '../../hooks/use-stats-counts';
import ProductCard from '../connected-product-card';
import StatsCards from './cards';

const StatsSection = () => {
	const { statsCounts } = useStatsCounts();
	const counts = statsCounts?.past_seven_days || {};
	const previousCounts = statsCounts?.between_past_eight_and_fifteen_days || {};
	return (
		<ProductCard admin={ !! window?.myJetpackInitialState?.userIsAdmin } slug="stats" showMenu>
			<StatsCards counts={ counts } previousCounts={ previousCounts } />
		</ProductCard>
	);
};

StatsSection.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default StatsSection;
