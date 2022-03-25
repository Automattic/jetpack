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
import { getIconBySlug } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ConnectedProductCard = ( { admin, slug } ) => {
	const { detail, status, activate, deactivate, isFetching } = useProduct( slug );
	const { name, description, manageUrl } = detail;

	const navigateToConnectionPage = useMyJetpackNavigate( '/connection' );
	const navigateToAddProductPage = useMyJetpackNavigate( `add-${ slug }` );

	/*
	 * Redirect to manage URL
	 */
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	const Icon = getIconBySlug( slug );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <Icon opacity={ 0.4 } /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
			onAdd={ navigateToAddProductPage }
			onFixConnection={ navigateToConnectionPage }
			onManage={ onManage }
		/>
	);
};

ConnectedProductCard.propTypes = {
	admin: PropTypes.bool.isRequired,
	slug: PropTypes.string.isRequired,
};

export default ConnectedProductCard;
