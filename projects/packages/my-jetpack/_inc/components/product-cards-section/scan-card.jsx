/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { ScanIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ScanCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			icon={ <ScanIcon /> }
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
