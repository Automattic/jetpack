/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../connected-product-card';

const MonitorCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="monitor" />;
};

MonitorCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default MonitorCard;
