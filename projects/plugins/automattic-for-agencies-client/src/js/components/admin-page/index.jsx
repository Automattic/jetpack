import { Container, Col, ThemeProvider } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import React, { useCallback, useMemo, useState } from 'react';
import ConnectedCard from '../connected-card';
import ConnectionCard from '../connection-card';
import DisconnectSiteLink from '../disconnect-site-link';
import DisconnectedCard from '../disconnected-card';

const Admin = () => {
	/** True if the user has just disconnected their site in the ongoing session. */
	const [ wasManuallyDisconnected, setWasManuallyDisconnected ] = useState( false );

	/** Callback that runs after the site is disconnected. */
	const onDisconnect = useCallback(
		() => setWasManuallyDisconnected( true ),
		[ setWasManuallyDisconnected ]
	);

	const { isUserConnected, isRegistered } = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	const connectionErrors = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionErrors(),
		[]
	);

	/** Render the relevant card based on the connection status. */
	const connectionCard = useMemo( () => {
		// Show the disconnection card if there are connection errors, or if the user has manually disconnected the site.
		if ( Object.keys( connectionErrors ).length || wasManuallyDisconnected ) {
			return <DisconnectedCard />;
		}
		// Show the connection card if we don't have a site and user connection.
		if ( ! isRegistered || ! isUserConnected ) {
			return <ConnectionCard />;
		}
		// Default to showing the card for a successfully connected site.
		return <ConnectedCard />;
	}, [ isRegistered, isUserConnected, connectionErrors, wasManuallyDisconnected ] );

	const showDisconnectSiteLink = useMemo(
		() =>
			isRegistered &&
			isUserConnected &&
			! Object.keys( connectionErrors ).length &&
			! wasManuallyDisconnected,
		[ isRegistered, isUserConnected, connectionErrors, wasManuallyDisconnected ]
	);

	return (
		<ThemeProvider targetDom={ document.body }>
			<Container horizontalSpacing={ 10 } horizontalGap={ 3 }>
				<Col sm={ 4 } md={ 8 } lg={ 12 }>
					{ connectionCard }
					{ showDisconnectSiteLink && <DisconnectSiteLink onDisconnect={ onDisconnect } /> }
				</Col>
			</Container>
		</ThemeProvider>
	);
};

export default Admin;
