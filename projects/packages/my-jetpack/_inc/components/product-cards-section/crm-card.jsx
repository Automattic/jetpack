import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const CrmCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.CRM } { ...props } />;
};

CrmCard.propTypes = {
	admin: PropTypes.bool,
};

export default CrmCard;
