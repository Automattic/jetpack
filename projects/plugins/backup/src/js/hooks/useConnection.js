/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { JetpackConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../store';

/**
 * Expose the `connectionStatus` state object and `renderJetpackConnection()` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, renderJetpackConnection
 */
export default function useConnection() {
	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const authorizationUrl = useSelect( select => select( STORE_ID ).getAuthorizationUrl(), [] );
	const doNotUseConnectionIframe = useSelect(
		select => select( STORE_ID ).getDoNotUseConnectionIframe(),
		[]
	);
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );

	const {
		connectionStatusSetRegistered,
		connectionStatusSetUserConnected,
		connectionDataSetAuthorizationUrl,
	} = useDispatch( STORE_ID );

	const onUserConnected = useCallback( () => {
		connectionStatusSetUserConnected( true );
	}, [ connectionStatusSetUserConnected ] );

	const onRegistered = useCallback(
		response => {
			connectionStatusSetRegistered( true );

			if ( response.authorizeUrl ) {
				connectionDataSetAuthorizationUrl( response.authorizeUrl );
			}
		},
		[ connectionStatusSetRegistered, connectionDataSetAuthorizationUrl ]
	);

	const renderJetpackConnection = () => {
		return (
			<JetpackConnection
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				authorizationUrl={ authorizationUrl }
				isRegistered={ connectionStatus.isRegistered }
				isUserConnected={ connectionStatus.isUserConnected }
				hasConnectedOwner={ connectionStatus.hasConnectedOwner }
				forceCalypsoFlow={ doNotUseConnectionIframe }
				onRegistered={ onRegistered }
				onUserConnected={ onUserConnected }
				registrationNonce={ registrationNonce }
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
			/>
		);
	};

	return [ connectionStatus, renderJetpackConnection ];
}
