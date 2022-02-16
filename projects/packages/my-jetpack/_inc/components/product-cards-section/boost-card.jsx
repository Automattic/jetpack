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
import { BoostIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const BoostCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'boost' );
	const { name, description, slug, manageUrl } = detail;
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <BoostIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			onActivate={ activate }
			slug={ slug }
			onAdd={ useMyJetpackNavigate( '/add-boost' ) }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
		/>
	);
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
