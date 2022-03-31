/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { AdminPage, AdminSectionHero, Container, Col, Text } from '@automattic/jetpack-components';

import { useSelect } from '@wordpress/data';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				) : (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col>
							<Text variant="headline-small">{ __( 'Jetpack Protect', 'jetpack-protect' ) }</Text>
							<Text variant="body" className={ styles[ 'expire-date' ] }>
								{ __( 'The main Jetpack Protect Admin page', 'jetpack-protect' ) }
							</Text>
						</Col>
					</Container>
				) }
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackProtectInitialState;
	return (
		<ConnectScreen
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			apiRoot={ apiRoot }
			// images={ [ '/images/jetpack-protect-connect.png' ] }
			// assetBaseUrl={ assetBaseUrl }
			from={ 'jetpack-protect' }
			title={ __(
				'Security tools that keep your site safe and sound, from posts to plugins.',
				'jetpack-protect'
			) }
			buttonLabel={ __( 'Set up Jetpack Protect', 'jetpack-protect' ) }
			redirectUri="admin.php?page=jetpack-protect"
		>
			<h3>{ __( 'Jetpack’s security features include', 'jetpack-protect' ) }</h3>
			<ul>
				<li>{ __( 'Scan for known plugin & theme vulnerabilities', 'jetpack-protect' ) }</li>
				<li>{ __( 'Database of vulnerabilities manually updated daily', 'jetpack-protect' ) }</li>
			</ul>
		</ConnectScreen>
	);
};
