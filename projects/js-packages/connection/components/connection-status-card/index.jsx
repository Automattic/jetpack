/**
 * External dependencies
 */
import React, { useEffect, useState, useRef } from 'react';

/**
 * Internal dependencies
 */
import restApi from '../../tools/jetpack-rest-api-client';
import './style.scss';

const ConnectionStatusCard = props => {
	const { isRegistered, isUserConnected, apiRoot, apiNonce } = props;

	const [ isFetchingConnectionData, setIsFetchingConnectionData ] = useState( false ); // eslint-disable-line no-unused-vars
	const [ connectionData, setConnectionData ] = useState( {} ); // eslint-disable-line no-unused-vars

	const avatarRef = useRef();

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Fetch the connection data on the first render.
	 * To be only run once.
	 */
	useEffect( () => {
		setIsFetchingConnectionData( true );

		restApi
			.fetchSiteConnectionData()
			.then( response => {
				setIsFetchingConnectionData( false );
				setConnectionData( response.currentUser );
				avatarRef.current.style.backgroundImage = `url('${ response.currentUser.gravatar }')`;
			} )
			.catch( error => {
				setIsFetchingConnectionData( false );
				throw error;
			} );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="jp-connection-status-card">
			<h3>Connection</h3>

			<p>
				Leverages the Jetpack Cloud for more features on your side.
				<br />
				<a href="#">Disconnect</a>
			</p>

			<div className="jp-connection-status-card--status">
				<div className="jp-connection-status-card--cloud"></div>
				<div
					className={
						'jp-connection-status-card--line' +
						( isUserConnected ? '' : ' jp-connection-status-card--site-only' )
					}
				></div>
				<div className="jp-connection-status-card--jetpack-logo"></div>
				<div className="jp-connection-status-card--avatar" ref={ avatarRef }></div>
			</div>

			<ul className="jp-connection-status-card--list">
				{ isRegistered && <li>Site connected</li> }
				{ isRegistered && isUserConnected && <li>Logged in as username</li> }
			</ul>
		</div>
	);
};

export default ConnectionStatusCard;
