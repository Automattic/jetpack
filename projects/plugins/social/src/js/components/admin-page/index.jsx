/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import ConnectionScreen from './../connection-screen';
import ModuleToggle from './../module-toggle';
import Connections from './../connections';
import Header from './../header';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { jetpackSocialConnectionsAdminUrl } = window.jetpackSocialInitialState;
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	return (
		<AdminPage moduleName={ __( 'Jetpack Social', 'jetpack-social' ) }>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionScreen />
						</Col>
					</Container>
				) : (
					<Header />
				) }
			</AdminSectionHero>
			{ ! showConnectionCard && (
				<div>
					<div className={ styles.manageConnectionsHeader }>
						<Button href={ jetpackSocialConnectionsAdminUrl } variant="primary" target="_blank">
							Manage your connections
						</Button>
					</div>
					<div className={ styles.publicizeConnectionsList }>
						<ModuleToggle />
						<Connections />
					</div>
				</div>
			) }
		</AdminPage>
	);
};

export default Admin;
