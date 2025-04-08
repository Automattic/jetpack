import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const AntiSpamCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.ANTI_SPAM } { ...props } />;
};

AntiSpamCard.propTypes = {
	admin: PropTypes.bool,
};

export default AntiSpamCard;
