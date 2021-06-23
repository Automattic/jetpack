/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectButton from '../connect-button';

/**
 * The Connection Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.registrationNonce -- Separate registration nonce, required.
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string} props.from -- Where the connection request is coming from.
 *
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = props => {
	const { apiRoot, apiNonce, registrationNonce, from, redirectUri, children } = props;

	return (
		<div className="jp-connect-screen">
			<div className="jp-connect-screen--left">Hello World.</div>
			<div className="jp-connect-screen--right">
				<ConnectButton
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					from={ from }
					redirectUri={ redirectUri }
				>
					{ children }
				</ConnectButton>
			</div>
		</div>
	);
};

export default ConnectScreen;
