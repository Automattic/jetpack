import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const BoostCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="boost" />;
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
