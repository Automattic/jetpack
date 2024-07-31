import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const AntiSpamCard = props => {
	return <ProductCard slug="anti-spam" { ...props } />;
};

AntiSpamCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AntiSpamCard;
