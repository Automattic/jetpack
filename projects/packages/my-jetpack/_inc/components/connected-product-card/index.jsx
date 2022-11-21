import { getIconBySlug } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { useProduct } from '../../hooks/use-product';
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const ConnectedProductCard = ( { admin, slug } ) => {
	const { isRegistered, isUserConnected } = useConnection();
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

	/*
	 * Redirect only if connected
	 */
	const callOnlyIfAllowed = callback => () => {
		if (
			status !== PRODUCT_STATUSES.NEEDS_PURCHASE &&
			status !== PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE
		) {
			callback();
			return;
		}

		if ( isRegistered && isUserConnected ) {
			callback();
			return;
		}

		navigateToConnectionPage();
	};

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
			onAdd={ callOnlyIfAllowed( navigateToAddProductPage ) }
			onManage={ onManage }
			onFixConnection={ navigateToConnectionPage }
		/>
	);
};

ConnectedProductCard.propTypes = {
	admin: PropTypes.bool.isRequired,
	slug: PropTypes.string.isRequired,
};

export default ConnectedProductCard;
