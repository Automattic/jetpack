/**
 * External dependencies
 */
import React from 'react';
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
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );

	const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
	const { setConnectionStatus } = useDispatch( STORE_ID );

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
				registrationNonce={ registrationNonce }
				from="connection-ui"
				redirectUri="tools.php?page=wpcom-connection-manager"
			>
				{ status => {
					setConnectionStatus( status );
					return null;
				} }
			</JetpackConnection>
		</React.Fragment>
	);
}
