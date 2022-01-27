/* global myJetpackInitialState */

/**
 * WordPress dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { useEffect } from 'react';

/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */
export default function useMyJetpackConnection() {
	const { apiRoot, apiNonce } = myJetpackInitialState;
	const connectionData = useConnection( { apiRoot, apiNonce } );

	// Alias: https://github.com/Automattic/jetpack/blob/master/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;

	/*
	 * When the site is not connect,
	 * redirect to the Jetpack dashboard.
	 */
	useEffect( () => {
		if ( isSiteConnected ) {
			return;
		}
		window.location = myJetpackInitialState.topJetpackMenuItemUrl;
	}, [ isSiteConnected ] );

	return {
		...connectionData,
		isSiteConnected,
	};
}
