/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { ConnectScreen, DisconnectDialog } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';
import ConnectRight from './assets/connect-right.png';

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

	const statusCallback = useCallback(
		status => {
			setConnectionStatus( status );
		},
		[ setConnectionStatus ]
	);

	const onDisconnectedCallback = useCallback( () => {
		setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
	}, [ setConnectionStatus ] );

	return (
		<React.Fragment>
			<Header />

			<div className="connection-status-card">
				{ connectionStatus.isRegistered && ! connectionStatus.isUserConnected && (
					<strong>{ __( 'Site Registered', 'jetpack' ) }</strong>
				) }
				{ connectionStatus.isRegistered && connectionStatus.isUserConnected && (
					<div>
						<strong>{ __( 'Site and User Connected', 'jetpack' ) }</strong>
						<DisconnectDialog
							apiRoot={ APIRoot }
							apiNonce={ APINonce }
							onDisconnected={ onDisconnectedCallback }
						>
							<h2>
								{ __( 'Jetpack is currently powering multiple products on your site.', 'jetpack' ) }
								<br />
								{ __( 'Once you disconnect Jetpack, these will no longer work.', 'jetpack' ) }
							</h2>
						</DisconnectDialog>
					</div>
				) }
			</div>

			{ ( ! connectionStatus.isRegistered || ! connectionStatus.isUserConnected ) && (
				<ConnectScreen
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
						<li>{ __( 'Protect your site against bot attacs', 'jetpacks' ) }</li>
						<li>{ __( 'Get notifications if your site goes offline', 'jetpacks' ) }</li>
						<li>{ __( 'Enhance your site with dozens of other features', 'jetpack' ) }</li>
					</ul>
				</ConnectScreen>
			) }
		</React.Fragment>
	);
}
