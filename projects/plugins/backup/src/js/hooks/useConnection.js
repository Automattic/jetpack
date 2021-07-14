/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { ConnectButton } from '@automattic/jetpack-connection';

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
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const doNotUseConnectionIframe = useSelect(
		select => select( STORE_ID ).getDoNotUseConnectionIframe(),
		[]
	);
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const { setConnectionStatus } = useDispatch( STORE_ID );

	const statusCallback = useCallback(
		status => {
			setConnectionStatus( status );
		},
		[ setConnectionStatus ]
	);

	const renderConnectButton = () => {
		return (
			<ConnectButton
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				forceCalypsoFlow={ doNotUseConnectionIframe }
				registrationNonce={ registrationNonce }
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
				statusCallback={ statusCallback }
			/>
		);
	};

	return [ connectionStatus, renderConnectButton ];
}
