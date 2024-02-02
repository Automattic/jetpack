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
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const ConnectedProductCard = ( {
	admin,
	slug,
	children,
	isDataLoading,
	showMenu = false,
	Description = null,
	additionalActions = null,
	secondaryAction = null,
	menuItems = [],
	upgradeInInterstitial = false,
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
	const {
		name,
		description: defaultDescription,
		requiresUserConnection,
		standalonePluginInfo,
		status,
	} = detail;
	const [ installingStandalone, setInstallingStandalone ] = useState( false );
	const [ deactivatingStandalone, setDeactivatingStandalone ] = useState( false );

	const navigateToConnectionPage = useMyJetpackNavigate( '/connection' );

	/* Menu Handling */
	const hasStandalonePlugin = standalonePluginInfo?.hasStandalonePlugin;
	const isStandaloneInstalled = standalonePluginInfo?.isStandaloneInstalled;
	const isStandaloneActive = standalonePluginInfo?.isStandaloneActive;
	const showActivateOption = hasStandalonePlugin && isStandaloneInstalled && ! isStandaloneActive;
	const showDeactivateOption = hasStandalonePlugin && isStandaloneInstalled && isStandaloneActive;
	const showInstallOption = hasStandalonePlugin && ! isStandaloneInstalled;
	const isConnected = isRegistered && isUserConnected;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;

	const menuIsActive =
		showMenu && // The menu is enabled for the product AND
		! isAbsent && // product status is not absent AND
		status !== PRODUCT_STATUSES.ERROR && // product status is not error AND
		isConnected && // the site is connected AND
		( menuItems?.length > 0 || // Show custom menus, if present
			showActivateOption || // Show install | activate options for standalone plugin
			showDeactivateOption || // Show deactivate option for standalone plugin
			showInstallOption );
	/* End Menu Handling */

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
				window?.location?.reload();
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

	const DefaultDescription = () => (
		<Text variant="body-small" style={ { flexGrow: 1 } }>
			{ defaultDescription }
		</Text>
	);

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
			secondaryAction={ secondaryAction }
			slug={ slug }
			onActivate={ handleActivate }
			showMenu={ menuIsActive }
			menuItems={ menuItems }
			showActivateOption={ showActivateOption }
			showDeactivateOption={ showDeactivateOption }
			showInstallOption={ showInstallOption }
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
	showMenu: PropTypes.bool,
	additionalActions: PropTypes.array,
	secondaryAction: PropTypes.object,
	menuItems: PropTypes.array,
};

export default ConnectedProductCard;
