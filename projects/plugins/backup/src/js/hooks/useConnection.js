/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { ConnectScreen, ConnectionStatusCard } from '@automattic/jetpack-connection';
import { CONNECTION_DISCONNECTED } from '@automattic/jetpack-connection/events';
import { Subscribers, Observer, registerObserver } from '@automattic/jetpack-observer';
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
	const assetBuildUrl = useSelect( select => select( STORE_ID ).getAssetBuildUrl(), [] );

	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const { setConnectionStatus } = useDispatch( STORE_ID );

	/**
	 * Initialize the observer for connection events.
	 * To be run once upon component initialization.
	 */
	useEffect( () => {
		const subscribers = new Subscribers();
		subscribers.add( CONNECTION_DISCONNECTED, () => {
			setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
		} );
		registerObserver( new Observer( subscribers ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const statusCallback = useCallback(
		status => {
			setConnectionStatus( status );
		},
		[ setConnectionStatus ]
	);

	const renderConnectScreen = () => {
		return (
			<ConnectScreen
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				registrationNonce={ registrationNonce }
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
				statusCallback={ statusCallback }
				images={ [ ConnectRight ] }
				assetBaseUrl={ assetBuildUrl }
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
				redirectUri="admin.php?page=jetpack-backup"
			/>
		);
	};

	return [ connectionStatus, renderConnectScreen, renderConnectionStatusCard ];
}
