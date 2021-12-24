/* global myJetpackInitialState */

/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Row,
	Col,
} from '@automattic/jetpack-components';
import { ConnectionStatusCard } from '@automattic/jetpack-connection';

import './style.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	const redirectAfterDisconnect = useCallback( () => {
		window.location = myJetpackInitialState.topJetpackMenuItemUrl;
	}, [] );

	return (
		<div className="jp-my-jetpack-screen">
			<AdminPage>
				<AdminSectionHero>
					<Row>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							<h1>
								{ __(
									'Manage your Jetpack plan and products all in one place',
									'jetpack-my-jetpack'
								) }
							</h1>
						</Col>
					</Row>
				</AdminSectionHero>

				<AdminSection>
					<Row>
						<Col lg={ 6 } sm={ 4 }>
							<h1>{ __( 'My Plan', 'jetpack-my-jetpack' ) }</h1>
						</Col>
						<Col lg={ 6 } sm={ 4 }>
							<ConnectionStatusCard
								apiRoot={ myJetpackInitialState.apiRoot }
								apiNonce={ myJetpackInitialState.apiNonce }
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
