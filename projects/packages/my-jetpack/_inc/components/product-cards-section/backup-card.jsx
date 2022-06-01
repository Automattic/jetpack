import React from 'react';
import PropTypes from 'prop-types';
import ProductCard from '../connected-product-card';

const BackupCard = ( { admin } ) => {
	return <ProductCard admin={ admin } slug="backup" />;
};

BackupCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BackupCard;
