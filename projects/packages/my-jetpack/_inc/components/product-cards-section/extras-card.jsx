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
import { ExtrasIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ExtrasCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'extras' );
	const { name, description, slug, manageUrl } = detail;
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <ExtrasIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
			showDeactivate={ false }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
			onAdd={ activate }
		/>
	);
};

ExtrasCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ExtrasCard;
