/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ScanCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			onAdd={ useMyJetpackNavigate( '/add-scan' ) }
			showDeactivate={ false }
			slug="scan"
		/>
	);
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
