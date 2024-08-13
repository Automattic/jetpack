import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const CreatorCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.CREATOR } upgradeInInterstitial { ...props } />;
};

CreatorCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CreatorCard;
