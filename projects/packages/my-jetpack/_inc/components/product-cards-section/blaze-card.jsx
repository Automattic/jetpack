import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const BlazeCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="blaze" showMenu />;
};

BlazeCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BlazeCard;
