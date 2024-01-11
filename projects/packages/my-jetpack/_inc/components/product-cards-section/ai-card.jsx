import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const AiCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="jetpack-ai" upgradeInInterstitial={ true } />;
};

AiCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AiCard;
