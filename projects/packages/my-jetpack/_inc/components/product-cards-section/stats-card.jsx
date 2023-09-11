import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const StatsCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="stats" showMenu />;
};

StatsCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default StatsCard;
