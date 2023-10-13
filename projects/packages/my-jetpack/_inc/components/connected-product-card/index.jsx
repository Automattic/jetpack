/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { useProduct } from '../../hooks/use-product';
import ProductCard from '../product-card';

const ConnectedProductCard = ( { admin, slug, children, isDataLoading } ) => {
	const { isRegistered, isUserConnected } = useConnection();

	const { detail, activate, deactivate, isFetching } = useProduct( slug );
	const { name, description, requiresUserConnection, status } = detail;
	const [ installingStandalone ] = useState( false );
	const [ deactivatingStandalone ] = useState( false );

	const navigateToConnectionPage = useMyJetpackNavigate( '/connection' );

	/*
	 * Redirect only if connected
	 */
	const handleActivate = useCallback( () => {
		if ( ( ! isRegistered || ! isUserConnected ) && requiresUserConnection ) {
			navigateToConnectionPage();
			return;
		}

		activate();
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
	] );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			admin={ admin }
			isFetching={ isFetching }
			isDataLoading={ isDataLoading }
			isInstallingStandalone={ installingStandalone }
			isDeactivatingStandalone={ deactivatingStandalone }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ handleActivate }
		>
			{ children }
		</ProductCard>
	);
};

ConnectedProductCard.propTypes = {
	children: PropTypes.node,
	admin: PropTypes.bool.isRequired,
	slug: PropTypes.string.isRequired,
};

export default ConnectedProductCard;
