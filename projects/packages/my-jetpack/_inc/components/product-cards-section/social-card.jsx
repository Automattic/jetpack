import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const SocialCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.SOCIAL } showMenu { ...props } />;
};

SocialCard.propTypes = {
	admin: PropTypes.bool,
};

export default SocialCard;
