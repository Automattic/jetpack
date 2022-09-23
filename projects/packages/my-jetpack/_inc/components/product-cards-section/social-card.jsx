import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const SocialCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="social" />;
};

SocialCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SocialCard;
