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

const BackupCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			onAdd={ useMyJetpackNavigate( '/add-backup' ) }
			showDeactivate={ false }
			slug="backup"
		/>
	);
};

BackupCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BackupCard;
