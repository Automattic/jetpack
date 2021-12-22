/* global myJetpackInitialState */

/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Row,
	Col,
} from '@automattic/jetpack-components';
import { ConnectionStatusCard, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';

import './style.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	const redirectAfterDisconnect = useCallback( () => {
		window.location = myJetpackInitialState.topJetpackMenuItemUrl;
	}, [] );

	return (
		<div className="jp-my-jetpack-screen">
			<AdminPage>
				<AdminSectionHero>
					<Row>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							<h1>{ __( 'Manage your Jetpack plan and products all in one place', 'jetpack' ) }</h1>
						</Col>
					</Row>
				</AdminSectionHero>

				<AdminSection>
					<Row>
						<Col lg={ 6 } sm={ 4 }>
							<h1>{ __( 'My Plan', 'jetpack' ) }</h1>
						</Col>
						<Col lg={ 6 } sm={ 4 }>
							<ConnectionStatusCard
								apiRoot={ myJetpackInitialState.apiRoot }
								apiNonce={ myJetpackInitialState.apiNonce }
								isRegistered={ connectionStatus.isRegistered }
								isUserConnected={ connectionStatus.isUserConnected }
								redirectUri={ myJetpackInitialState.redirectUri }
								onDisconnected={ redirectAfterDisconnect }
							/>
						</Col>
					</Row>
				</AdminSection>
			</AdminPage>
		</div>
	);
}
