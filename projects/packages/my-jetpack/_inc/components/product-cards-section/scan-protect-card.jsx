import { useSelect } from '@wordpress/data';
import PropTypes from 'prop-types';
import React from 'react';
import { STORE_ID } from '../../state/store';
import ProductCard from '../connected-product-card';

const ScanAndProtectCard = ( { admin } ) => {
	const hasStandalonePluginInstalled = useSelect( select =>
		select( STORE_ID ).hasStandalonePluginInstalled()
	);

	return <ProductCard admin={ admin } slug={ hasStandalonePluginInstalled ? 'protect' : 'scan' } />;
};

ScanAndProtectCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanAndProtectCard;
