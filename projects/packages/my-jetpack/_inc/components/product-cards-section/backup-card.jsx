/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { BackupIcon } from '../icons';

const BackupCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'backup' );
	const { name, description, slug } = detail;

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <BackupIcon /> }
			isFetching={ isFetching }
			admin={ admin }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
			showDeactivate={ false }
			onAdd={ useMyJetpackNavigate( '/add-backup' ) }
		/>
	);
};

BackupCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BackupCard;
