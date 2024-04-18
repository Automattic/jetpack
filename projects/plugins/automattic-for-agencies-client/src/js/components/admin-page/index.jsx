import { Container, Col, ThemeProvider } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
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
			<Container horizontalSpacing={ 10 } horizontalGap={ 3 }>
				<Col sm={ 4 } md={ 8 } lg={ 12 }>
					{ showConnectionCard ? <ConnectionCard /> : <ConnectedCard /> }
				</Col>
			</Container>
		</ThemeProvider>
	);
};

export default Admin;
