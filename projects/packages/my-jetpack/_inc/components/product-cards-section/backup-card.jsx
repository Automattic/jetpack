import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../connected-product-card';

// eslint-disable-next-line no-unused-vars
const BackupCard = ( { admin, productData } ) => {
	return <ProductCard admin={ admin } slug="backup" showMenu />;
};

BackupCard.propTypes = {
	admin: PropTypes.bool.isRequired,
	productData: PropTypes.object,
};

export default BackupCard;
