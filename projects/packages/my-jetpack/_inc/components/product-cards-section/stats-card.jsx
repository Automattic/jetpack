import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const StatsCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.STATS } showMenu { ...props } />;
};

StatsCard.propTypes = {
	admin: PropTypes.bool,
};

export default StatsCard;
