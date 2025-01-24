import { useCallback } from 'react';
import { MyJetpackRoutes } from '../../constants';
import useActivate from '../../data/products/use-activate';
import useInstallStandalonePlugin from '../../data/products/use-install-standalone-plugin';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ActionButton from '../product-card/action-button';
import type { ListButtonProps } from './types';
import type { FC } from 'react';

const ListButton: FC< ListButtonProps > = ( { slug } ) => {
	const { isRegistered, isUserConnected } = useMyJetpackConnection();
	const { install: installStandalonePlugin, isPending: isInstalling } =
		useInstallStandalonePlugin( slug );
	const { detail, isLoading: isProductDataLoading } = useProduct( slug );
	const { activate, isPending: isActivating } = useActivate( slug );

	const { userIsAdmin: admin } = getMyJetpackWindowInitialState();
	const { name, description, status, requiresUserConnection } = detail;

	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );

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
		<ActionButton
			admin={ !! admin }
			name={ name }
			Description={ description }
			isFetching={ isActivating || isInstalling || isProductDataLoading }
			slug={ slug }
			status={ status }
			onActivate={ handleActivate }
			onInstallStandalone={ installStandalonePlugin }
		/>
	);
};

export default ListButton;
