import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

const CrmCard = props => {
	return <ProductCard slug="crm" { ...props } />;
};

CrmCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CrmCard;
