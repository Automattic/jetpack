import React from 'react';
import PropTypes from 'prop-types';
import ProductCard from '../connected-product-card';

const ScanCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="scan" />;
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
