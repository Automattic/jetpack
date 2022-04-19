/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../connected-product-card';

const BoostCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="boost" />;
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
