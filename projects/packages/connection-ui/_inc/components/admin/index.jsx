/**
 * External dependencies
 */
import React from 'react';
import { useSelect } from '@wordpress/data';
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
	const doNotUseConnectionIframe = useSelect(
		select => select( STORE_ID ).getDoNotUseConnectionIframe(),
		[]
	);
	const registrationNonce = useSelect( select => select( STORE_ID ).getRegistrationNonce(), [] );

	return (
		<React.Fragment>
			<Header />

			<JetpackConnection
				apiRoot={ APIRoot }
				apiNonce={ APINonce }
				forceCalypsoFlow={ doNotUseConnectionIframe }
				registrationNonce={ registrationNonce }
				from="connection-ui"
				redirectUri="tools.php?page=wpcom-connection-manager"
			>
				{ connectionStatus => (
					<div className="connection-status-card">
						{ connectionStatus.isRegistered && ! connectionStatus.isUserConnected && (
							<strong>{ __( 'Site Registered', 'jetpack' ) }</strong>
						) }
						{ connectionStatus.isRegistered && connectionStatus.isUserConnected && (
							<strong>{ __( 'Site and User Connected', 'jetpack' ) }</strong>
						) }
					</div>
				) }
			</JetpackConnection>
		</React.Fragment>
	);
}
