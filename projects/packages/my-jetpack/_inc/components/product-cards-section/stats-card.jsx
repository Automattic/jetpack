import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const StatsCard = props => {
	// Looks like this is not used anymore because product-cards-section/index.tsx renders its own stats card.
	return <ProductCard slug={ PRODUCT_SLUGS.STATS } showMenu { ...props } />;
};

StatsCard.propTypes = {
	admin: PropTypes.bool,
};

export default StatsCard;
