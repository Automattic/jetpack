/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';

const ScanCard = ( { admin } ) => {
	return <ProductCard admin={ admin } showDeactivate={ false } slug="scan" />;
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
