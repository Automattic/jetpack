/**
 * External dependencies
 */
import React from 'react';
import { JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectButton from '../connect-button';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * The Connection Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.registrationNonce -- Separate registration nonce, required.
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string} props.from -- Where the connection request is coming from.
 * @param {string} props.title -- Page title.
 *
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = props => {
	const { title, body, apiRoot, apiNonce, registrationNonce, from, redirectUri, children } = props;

	return (
		<div className="jp-connect-screen">
			<div className="jp-connect-screen--left">
				<JetpackLogo />

				<h2>{ title }</h2>

				{ body }
			</div>
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

ConnectScreen.propTypes = {
	title: PropTypes.string,
	body: PropTypes.string,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	registrationNonce: PropTypes.string.isRequired,
};

ConnectScreen.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
};

export default ConnectScreen;
