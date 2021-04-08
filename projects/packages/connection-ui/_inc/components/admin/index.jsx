/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { JetpackConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';

/**
 * The Connection IU Admin App.
 *
 * @returns {object} The header component.
 */
export default function Admin() {
	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const authorizationUrl = useSelect( select => select( STORE_ID ).getAuthorizationUrl(), [] );
	const doNotUseConnectionIframe = useSelect(
		select => select( STORE_ID ).getDoNotUseConnectionIframe(),
		[]
	);

	const { connectionStatusSetRegistered, connectionStatusSetUserConnected } = useDispatch(
		STORE_ID
	);

	const onUserConnected = useCallback( () => {
		connectionStatusSetUserConnected( true );
	}, [ connectionStatusSetUserConnected ] );

	const onRegistered = useCallback( () => {
		connectionStatusSetRegistered( true );
	}, [ connectionStatusSetRegistered ] );

	return (
		<React.Fragment>
			<Header />

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
			/>
		</React.Fragment>
	);
}
