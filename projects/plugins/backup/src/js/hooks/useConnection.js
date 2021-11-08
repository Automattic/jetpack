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
	const connectedPlugins = useSelect( select => select( STORE_ID ).getConnectedPlugins(), [] );
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
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
				images={ [ ConnectRight ] }
			>
				<p>
					{ __(
						'Jetpack Backup requires a user connection to WordPress.com to be able to backup your website.',
						'jetpack-backup'
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
				currentPlugin="jetpack-backup"
				connectedPlugins={ connectedPlugins }
				redirectUri="admin.php?page=jetpack-backup"
			/>
		);
	};

	return [ connectionStatus, renderConnectScreen, renderConnectionStatusCard ];
}
