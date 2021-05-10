/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { JetpackConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';

/**
 * The Connection IU Admin App.
 *
 * @returns {object} The Admin component.
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

	return (
		<React.Fragment>
			<Header />

			<div className="connection-status-card">
				{ connectionStatus.isRegistered && ! connectionStatus.isUserConnected && (
					<strong>{ __( 'Site Registered', 'jetpack' ) }</strong>
				) }
				{ connectionStatus.isRegistered && connectionStatus.isUserConnected && (
					<strong>{ __( 'Site and User Connected', 'jetpack' ) }</strong>
				) }
			</div>

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
				from="connection-ui"
				redirectUri="tools.php?page=wpcom-connection-manager"
			/>
		</React.Fragment>
	);
}
