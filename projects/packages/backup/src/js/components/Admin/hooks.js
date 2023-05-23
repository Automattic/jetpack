import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import useConnection from '../../hooks/useConnection';

export const useIsFullyConnected = () => {
	const [ connectionStatus ] = useConnection();

	return useMemo( () => {
		const connectionLoaded = 0 < Object.keys( connectionStatus ).length;
		return connectionLoaded && connectionStatus.hasConnectedOwner && connectionStatus.isRegistered;
	}, [ connectionStatus ] );
};

export const useIsSecondaryAdminNotConnected = () => {
	const isFullyConnected = useIsFullyConnected();
	const [ connectionStatus ] = useConnection();

	return useMemo( () => {
		return isFullyConnected && ! connectionStatus.isUserConnected;
	}, [ isFullyConnected, connectionStatus ] );
};

export const useSiteHasBackupProduct = () => {
	const isFullyConnected = useIsFullyConnected();
	const [ siteHasBackupProduct, setSiteHasBackupProduct ] = useState( false );

	useEffect( () => {
		if ( ! isFullyConnected ) {
			return;
		}

		apiFetch( { path: '/jetpack/v4/has-backup-plan' } ).then( res => {
			setSiteHasBackupProduct( res );
		} );
	}, [ isFullyConnected ] );

	return { siteHasBackupProduct };
};
