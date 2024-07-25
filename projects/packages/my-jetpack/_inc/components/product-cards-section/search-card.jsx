import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const SearchCard = props => {
	return <ProductCard slug="search" showMenu { ...props } />;
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
