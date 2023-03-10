import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const VideopressCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="videopress" />;
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
