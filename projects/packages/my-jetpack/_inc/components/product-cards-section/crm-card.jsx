import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const CrmCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="crm" />;
};

CrmCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CrmCard;
