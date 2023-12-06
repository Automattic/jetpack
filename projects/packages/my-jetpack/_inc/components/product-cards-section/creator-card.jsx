import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const CreatorCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="creator" upgradeInInterstitial={ true } />;
};

CreatorCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CreatorCard;
