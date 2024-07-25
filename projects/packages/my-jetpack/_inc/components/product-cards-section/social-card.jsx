import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const SocialCard = props => {
	return <ProductCard slug="social" showMenu { ...props } />;
};

SocialCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SocialCard;
