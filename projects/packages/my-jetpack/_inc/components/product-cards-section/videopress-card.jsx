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
import { VideopressIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const VideopressCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'videopress' );
	const { name, description, slug, manageUrl } = detail;
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <VideopressIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			onActivate={ activate }
			slug={ slug }
			onAdd={ useMyJetpackNavigate( '/add-videopress' ) }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
		/>
	);
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
