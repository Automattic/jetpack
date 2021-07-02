/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';
import Image1 from './assets/image-1.png';
import Image2 from './assets/image-2.png';
import Image3 from './assets/image-3.png';
import Image4 from './assets/image-4.png';

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

			{ ( ! connectionStatus.isRegistered || ! connectionStatus.isUserConnected ) && (
				<ConnectScreen
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					registrationNonce={ registrationNonce }
					from="connection-ui"
					redirectUri="tools.php?page=wpcom-connection-manager"
					statusCallback={ statusCallback }
					images={ [ Image1, Image2, Image3, Image4 ] }
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
