/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	ConnectionStatusCard,
	ConnectScreen,
	withConnectionStatus,
} from '@automattic/jetpack-connection';
import { IDCScreen } from '@automattic/jetpack-idc';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';
import ConnectRight from './assets/connect-right.png';

const ConnectScreenWithConnectionStatus = withConnectionStatus( ConnectScreen );

/**
 * The Connection IU Admin App.
 *
 * @returns {object} The Admin component.
 */
export default function Admin() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const assetBuildUrl = useSelect( select => select( STORE_ID ).getAssetBuildUrl(), [] );

	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const { setConnectionStatus } = useDispatch( STORE_ID );

	// Placeholder for testing purposes.
	const hasIDC = true;
	const IDCHomeUrl = 'https://site1.local/';
	const currentUrl = 'https://site2.local/';
	const redirectUri = 'tools.php?page=wpcom-connection-manager';

	const statusCallback = useCallback(
		status => {
			setConnectionStatus( status );
		},
		[ setConnectionStatus ]
	);

	const onDisconnectedCallback = useCallback( () => {
		setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
	}, [ setConnectionStatus ] );

	if ( hasIDC ) {
		return (
			<IDCScreen
				wpcomHomeUrl={ IDCHomeUrl }
				currentUrl={ currentUrl }
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				redirectUri={ redirectUri }
			/>
		);
	}

	return (
		<React.Fragment>
			<Header />

			{ connectionStatus.isRegistered && (
				<ConnectionStatusCard
					isRegistered={ connectionStatus.isRegistered }
					isUserConnected={ connectionStatus.isUserConnected }
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					onDisconnected={ onDisconnectedCallback }
					redirectUri="tools.php?page=wpcom-connection-manager"
				/>
			) }

			{ ! connectionStatus.isRegistered && (
				<ConnectScreenWithConnectionStatus
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					registrationNonce={ registrationNonce }
					from="connection-ui"
					redirectUri="tools.php?page=wpcom-connection-manager"
					statusCallback={ statusCallback }
					images={ [ ConnectRight ] }
					assetBaseUrl={ assetBuildUrl }
				>
					<p>
						{ __(
							"Secure and speed up your site for free with Jetpack's powerful WordPress tools.",
							'jetpack'
						) }
					</p>

					<ul>
						<li>{ __( 'Measure your impact with beautiful stats', 'jetpack' ) }</li>
						<li>{ __( 'Speed up your site with optimized images', 'jetpack' ) }</li>
						<li>{ __( 'Protect your site against bot attacks', 'jetpack' ) }</li>
						<li>{ __( 'Get notifications if your site goes offline', 'jetpack' ) }</li>
						<li>{ __( 'Enhance your site with dozens of other features', 'jetpack' ) }</li>
					</ul>
				</ConnectScreenWithConnectionStatus>
			) }
		</React.Fragment>
	);
}
