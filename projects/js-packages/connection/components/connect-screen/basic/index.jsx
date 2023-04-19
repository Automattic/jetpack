import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import useConnection from '../../use-connection';
import ConnectScreenVisual from './visual';

/**
 * The Connection Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string?} props.title -- The Title.
 * @param {string?} props.buttonLabel -- The Connect Button label.
 * @param {string} props.apiRoot -- API root.
 * @param {string} props.apiNonce -- API nonce.
 * @param {string} props.registrationNonce -- Registration nonce.
 * @param {string?} props.from -- Where the connection request is coming from.
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string[]?} props.images -- Images to display on the right side.
 * @param {object[]} props.children -- Additional page elements to show before the call to action.
 * @param {string?} props.assetBaseUrl -- The assets base URL.
 * @param {object?} props.footer -- Additional page elements to show after the call to action.
 * @param {boolean?} props.skipUserConnection -- Whether to not require a user connection and just redirect after site connection.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = ( {
	title,
	buttonLabel,
	apiRoot,
	apiNonce,
	registrationNonce,
	from,
	redirectUri,
	images,
	children,
	assetBaseUrl,
	footer,
	skipUserConnection,
} ) => {
	const {
		handleRegisterSite,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
	} = useConnection( {
		registrationNonce,
		redirectUri,
		apiRoot,
		apiNonce,
		from,
		skipUserConnection,
	} );

	const showConnectButton = ! isRegistered || ! isUserConnected;
	const displayButtonError = Boolean( registrationError );
	const buttonIsLoading = siteIsRegistering || userIsConnecting;

	return (
		<ConnectScreenVisual
			title={ title }
			images={ images }
			assetBaseUrl={ assetBaseUrl }
			showConnectButton={ showConnectButton }
			buttonLabel={ buttonLabel }
			handleButtonClick={ handleRegisterSite }
			displayButtonError={ displayButtonError }
			buttonIsLoading={ buttonIsLoading }
			footer={ footer }
		>
			{ children }
		</ConnectScreenVisual>
	);
};

ConnectScreen.propTypes = {
	title: PropTypes.string,
	buttonLabel: PropTypes.string,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	registrationNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	images: PropTypes.arrayOf( PropTypes.string ),
	assetBaseUrl: PropTypes.string,
	skipUserConnection: PropTypes.bool,
};

ConnectScreen.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	buttonLabel: __( 'Set up Jetpack', 'jetpack' ),
	images: [],
	redirectUri: null,
	skipUserConnection: false,
};

export default ConnectScreen;
