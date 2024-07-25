import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const ProtectCard = props => {
	return <ProductCard slug="protect" { ...props } />;
};

ProtectCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ProtectCard;
