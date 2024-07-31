import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const ExtrasCard = props => {
	return <ProductCard slug="extras" { ...props } />;
};

ExtrasCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ExtrasCard;
