/**
 * External dependencies
 */
import React from 'react';
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
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const doNotUseConnectionIframe = useSelect(
		select => select( STORE_ID ).getDoNotUseConnectionIframe(),
		[]
	);
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const { setConnectionStatus } = useDispatch( STORE_ID );

	const renderJetpackConnection = () => {
		return (
			<JetpackConnection
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				forceCalypsoFlow={ doNotUseConnectionIframe }
				registrationNonce={ registrationNonce }
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
			>
				{ status => {
					setConnectionStatus( status );
					return null;
				} }
			</JetpackConnection>
		);
	};

	return [ connectionStatus, renderJetpackConnection ];
}
