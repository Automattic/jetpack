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
import ProductCard, { PRODUCT_STATUSES } from '../product-card';

const ConnectedProductCard = ( { admin, slug, children, showMenu = false, menuItems = [] } ) => {
	const { isRegistered, isUserConnected } = useConnection();

	const { detail, activate, deactivate, isFetching, installStandalonePlugin } = useProduct( slug );
	const { name, description, manageUrl, requiresUserConnection, standalonePluginInfo, status } =
		detail;
	const [ installingStandalone, setInstallingStandalone ] = useState( false );

	const navigateToConnectionPage = useMyJetpackNavigate( '/connection' );
	const navigateToAddProductPage = useMyJetpackNavigate( `add-${ slug }` );

	/* Menu Handling */
	const hasStandalonePlugin = standalonePluginInfo?.hasStandalonePlugin;
	const isStandaloneInstalled = standalonePluginInfo?.isStandaloneInstalled;
	const isStandaloneActive = standalonePluginInfo?.isStandaloneActive;
	const showActivateOption = hasStandalonePlugin && isStandaloneInstalled && ! isStandaloneActive;
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
			showInstallOption );
	/* End Menu Handling */

	/*
	 * Redirect to manage URL
	 */
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

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

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			admin={ admin }
			isFetching={ isFetching }
			isInstallingStandalone={ installingStandalone }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ handleActivate }
			onAdd={ navigateToAddProductPage }
			onManage={ onManage }
			onFixConnection={ navigateToConnectionPage }
			showMenu={ menuIsActive }
			menuItems={ menuItems }
			showActivateOption={ showActivateOption }
			showInstallOption={ showInstallOption }
			onInstallStandalone={ handleInstallStandalone }
			onActivateStandalone={ handleInstallStandalone }
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
