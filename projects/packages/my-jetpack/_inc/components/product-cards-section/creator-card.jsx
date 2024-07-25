import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const CreatorCard = props => {
	return <ProductCard slug="creator" upgradeInInterstitial { ...props } />;
};

CreatorCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CreatorCard;
