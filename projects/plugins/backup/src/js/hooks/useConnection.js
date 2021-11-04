/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { ConnectionStatusCard, ConnectScreenRequiredPlan } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../store';

/**
 * Expose the `connectionStatus` state object and `renderConnectScreen()` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, renderConnectScreen
 */
export default function useConnection() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );

	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const { setConnectionStatus } = useDispatch( STORE_ID );

	const statusCallback = useCallback(
		status => {
			setConnectionStatus( status );
		},
		[ setConnectionStatus ]
	);

	const onDisconnectedCallback = useCallback( () => {
		setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
	}, [ setConnectionStatus ] );

	const renderConnectScreen = () => {
		return (
			<ConnectScreenRequiredPlan
				buttonLabel="Get Jetpack Backup"
				connectionStatus={ {
					isRegistered: connectionStatus.isRegistered,
					isUserConnected: connectionStatus.isUserConnected,
				} }
				priceAfter={ 4.5 }
				priceBefore={ 9 }
				pricingIcon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m21.092 15.164.019-1.703v-.039c0-1.975-1.803-3.866-4.4-3.866-2.17 0-3.828 1.351-4.274 2.943l-.426 1.524-1.581-.065a2.92 2.92 0 0 0-.12-.002c-1.586 0-2.977 1.344-2.977 3.133 0 1.787 1.388 3.13 2.973 3.133H22.399c1.194 0 2.267-1.016 2.267-2.4 0-1.235-.865-2.19-1.897-2.368l-1.677-.29Zm-10.58-3.204a4.944 4.944 0 0 0-.201-.004c-2.75 0-4.978 2.298-4.978 5.133s2.229 5.133 4.978 5.133h12.088c2.357 0 4.267-1.97 4.267-4.4 0-2.18-1.538-3.99-3.556-4.339v-.06c0-3.24-2.865-5.867-6.4-5.867-2.983 0-5.49 1.871-6.199 4.404Z' fill='%23000'/%3E%3C/svg%3E"
				pricingTitle={ ( 'Jetpack Backup', 'jetpack-backup' ) }
				title={ ( 'The best real‑time WordPress backups', 'jetpack-backup' ) }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				registrationNonce={ registrationNonce }
				from="jetpack-backup"
				redirectUri="admin.php?page=jetpack-backup"
				statusCallback={ statusCallback }
			>
				<h3>
					{ __(
						'Save every change and get back online quickly with one‑click restores.',
						'jetpack-backup'
					) }
				</h3>
				<ul>
					<li>{ __( 'Automated real-time backups', 'jetpack-backup' ) }</li>
					<li>{ __( 'Easy one-click restores', 'jetpack-backup' ) }</li>
					<li>{ __( 'Complete list of all site changes', 'jetpack-backup' ) }</li>
					<li>{ __( 'Global server infrastructure', 'jetpack-backup' ) }</li>
					<li>{ __( 'Best-in-class support', 'jetpack-backup' ) }</li>
				</ul>
			</ConnectScreenRequiredPlan>
		);
	};

	const renderConnectionStatusCard = () => {
		return (
			<ConnectionStatusCard
				isRegistered={ connectionStatus.isRegistered }
				isUserConnected={ connectionStatus.isUserConnected }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				onDisconnected={ onDisconnectedCallback }
				redirectUri="admin.php?page=jetpack-backup"
			/>
		);
	};

	return [ connectionStatus, renderConnectScreen, renderConnectionStatusCard ];
}
