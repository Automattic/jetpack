import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const NewsletterCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="newsletter" upgradeInInterstitial={ true } />;
};

NewsletterCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default NewsletterCard;
