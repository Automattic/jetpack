import React from 'react';
import PropTypes from 'prop-types';
import ProductCard from '../connected-product-card';

const SearchCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="search" />;
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
