import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const StatsCard = props => {
	return <ProductCard slug="stats" showMenu { ...props } />;
};

StatsCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default StatsCard;
