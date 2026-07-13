import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const StatsCard = props => {
	// Compact grid fallback, rendered when the large Stats card is hidden (e.g. Stats module disabled).
	// When the Stats module is active, product-cards-section/index.tsx renders the large Stats card instead.
	return <ProductCard slug={ PRODUCT_SLUGS.STATS } showMenu { ...props } />;
};

StatsCard.propTypes = {
	admin: PropTypes.bool,
};

export default StatsCard;
