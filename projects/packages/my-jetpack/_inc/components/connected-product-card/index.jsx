/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { useProduct } from '../../hooks/use-product';
import ProductCard from '../product-card';

const ConnectedProductCard = ( {
	admin,
	slug,
	children,
	isDataLoading,
	Description = null,
	additionalActions = null,
	secondaryAction = null,
	upgradeInInterstitial = false,
	primaryActionOverride,
} ) => {
	const { isRegistered, isUserConnected } = useConnection();

	const {
		detail,
		activate,
		deactivate,
		isFetching,
		installStandalonePlugin,
		deactivateStandalonePlugin,
	} = useProduct( slug );
	const { name, description: defaultDescription, requiresUserConnection, status } = detail;
	const [ installingStandalone, setInstallingStandalone ] = useState( false );
	const [ deactivatingStandalone, setDeactivatingStandalone ] = useState( false );

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

	const handleInstallStandalone = useCallback( () => {
		setInstallingStandalone( true );

		installStandalonePlugin()
			.then( () => {
				setInstallingStandalone( false );
			} )
			.catch( () => {
				setInstallingStandalone( false );
			} );
	}, [ installStandalonePlugin ] );

	const handleDeactivateStandalone = useCallback( () => {
		setDeactivatingStandalone( true );

		deactivateStandalonePlugin()
			.then( () => {
				window?.location?.reload();
			} )
			.catch( () => {
				setDeactivatingStandalone( false );
			} );
	}, [ deactivateStandalonePlugin ] );

	const DefaultDescription = () => {
		// Replace the last space with a non-breaking space to prevent widows
		const cardDescription = defaultDescription.replace( /\s(?=[^\s]*$)/, '\u00A0' );

		return (
			<Text variant="body-small" style={ { flexGrow: 1 } }>
				{ cardDescription }
			</Text>
		);
	};

	return (
		<ProductCard
			name={ name }
			Description={ Description ? Description : DefaultDescription }
			status={ status }
			admin={ admin }
			isFetching={ isFetching }
			isDataLoading={ isDataLoading }
			isInstallingStandalone={ installingStandalone }
			isDeactivatingStandalone={ deactivatingStandalone }
			onDeactivate={ deactivate }
			additionalActions={ additionalActions }
			primaryActionOverride={ primaryActionOverride }
			secondaryAction={ secondaryAction }
			slug={ slug }
			onActivate={ handleActivate }
			onInstallStandalone={ handleInstallStandalone }
			onActivateStandalone={ handleInstallStandalone }
			onDeactivateStandalone={ handleDeactivateStandalone }
			upgradeInInterstitial={ upgradeInInterstitial }
		>
			{ children }
		</ProductCard>
	);
};

ConnectedProductCard.propTypes = {
	children: PropTypes.node,
	admin: PropTypes.bool.isRequired,
	slug: PropTypes.string.isRequired,
	isDataLoading: PropTypes.bool,
	additionalActions: PropTypes.array,
	primaryActionOverride: PropTypes.object,
	secondaryAction: PropTypes.object,
};

export default ConnectedProductCard;
