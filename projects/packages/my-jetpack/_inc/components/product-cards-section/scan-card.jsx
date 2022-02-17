/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import { ScanIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ScanCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'scan' );
	const { name, description, slug, manageUrl } = detail;
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <ScanIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
			onAdd={ useMyJetpackNavigate( '/add-scan' ) }
			showDeactivate={ false }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
		/>
	);
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
