import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	ThemeProvider,
} from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import ConnectedCard from '../connected-card';
import ConnectionCard from '../connection-card';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	return (
		<ThemeProvider targetDom={ document.body }>
			<AdminPage
				moduleName={ __( 'Automattic For Agencies Client', 'automattic-for-agencies-client' ) }
			>
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							{ showConnectionCard ? <ConnectionCard /> : <ConnectedCard /> }
						</Col>
					</Container>
				</AdminSectionHero>
			</AdminPage>
		</ThemeProvider>
	);
};

export default Admin;
