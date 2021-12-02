/**
 * External dependencies
 */
import React from 'react';
import { useSelect } from '@wordpress/data';
import {
	ConnectScreen,
	ConnectionStatusCard,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../store';
import ConnectRight from './assets/connect-right.png';

/**
 * Expose the `connectionStatus` state object and `renderConnectScreen()` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, renderConnectScreen
 */
export default function useConnection() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	const renderConnectScreen = () => {
		return (
			<ConnectScreen
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				registrationNonce={ registrationNonce }
				from="jetpack-social"
				redirectUri="admin.php?page=jetpack-social"
				images={ [ ConnectRight ] }
			>
				<p>
					{ __(
						'Jetpack Social requires a user connection to WordPress.com.',
						'jetpack-social'
					) }
				</p>
			</ConnectScreen>
		);
	};

	const renderConnectionStatusCard = () => {
		return (
			<ConnectionStatusCard
				isRegistered={ connectionStatus.isRegistered }
				isUserConnected={ connectionStatus.isUserConnected }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				redirectUri="admin.php?page=jetpack-social"
			/>
		);
	};

	return [ connectionStatus, renderConnectScreen, renderConnectionStatusCard ];
}
