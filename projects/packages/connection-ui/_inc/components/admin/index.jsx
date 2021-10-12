/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { useSelect, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	ConnectionStatusCard,
	ConnectScreen,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';
import ConnectRight from './assets/connect-right.png';
import restApi from '@automattic/jetpack-api';

/**
 * The Connection IU Admin App.
 *
 * @param {object} props - The properties.
 * @param {object} props.connectionStatus - The connection status object.
 * @returns {object} The Admin component.
 */
const Admin = props => {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );
	const assetBuildUrl = useSelect( select => select( STORE_ID ).getAssetBuildUrl(), [] );

	const { connectionStatus } = props;

	useEffect( () => {
		restApi.setApiRoot( APIRoot );
		restApi.setApiNonce( APINonce );
	}, [ APIRoot, APINonce ] );

	return (
		<React.Fragment>
			<Header />

			{ connectionStatus.isRegistered && (
				<ConnectionStatusCard
					isRegistered={ connectionStatus.isRegistered }
					isUserConnected={ connectionStatus.isUserConnected }
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					redirectUri="tools.php?page=wpcom-connection-manager"
				/>
			) }

			{ ! connectionStatus.isRegistered && (
				<ConnectScreen
					connectionStatus={ connectionStatus }
					apiRoot={ APIRoot }
					apiNonce={ APINonce }
					registrationNonce={ registrationNonce }
					from="connection-ui"
					redirectUri="tools.php?page=wpcom-connection-manager"
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
				</ConnectScreen>
			) }
		</React.Fragment>
	);
};

export default withSelect( select => {
	return {
		connectionStatus: select( CONNECTION_STORE_ID ).getConnectionStatus(),
	};
} )( Admin );
