import PropTypes from 'prop-types';
import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const SearchCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.SEARCH } showMenu { ...props } />;
};

SearchCard.propTypes = {
	admin: PropTypes.bool,
};

export default SearchCard;
