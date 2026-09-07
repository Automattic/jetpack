import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const StatsCard = props => {
	// Compact Stats card, shown in the grid as a fallback when the large "Views in the last 7 days"
	// card isn't rendered — i.e. when the Stats module isn't active, or when the full-stats-card flag
	// (the main Jetpack plugin) is off. See product-cards-section/index.tsx for the gating.
	return <ProductCard slug={ PRODUCT_SLUGS.STATS } showMenu { ...props } />;
};

StatsCard.propTypes = {
	admin: PropTypes.bool,
};

export default StatsCard;
