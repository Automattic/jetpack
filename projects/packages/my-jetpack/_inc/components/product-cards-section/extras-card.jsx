import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const ExtrasCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.EXTRAS } { ...props } />;
};

ExtrasCard.propTypes = {
	admin: PropTypes.bool,
};

export default ExtrasCard;
