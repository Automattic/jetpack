import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const ProtectCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug={ 'protect' } />;
};

ProtectCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ProtectCard;
