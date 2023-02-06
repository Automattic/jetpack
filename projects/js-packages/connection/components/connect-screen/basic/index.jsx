import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import useConnection from '../../use-connection';
import ConnectScreenVisual from './visual';

/**
 * The Connection Screen component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = props => {
	const {
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
		autoTrigger,
		footer,
		skipUserConnection,
	} = props;

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
		autoTrigger,
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
	/** The Title. */
	title: PropTypes.string,
	/** The Connect Button label. */
	buttonLabel: PropTypes.string,
	/** API root. */
	apiRoot: PropTypes.string.isRequired,
	/** API nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** Registration nonce. */
	registrationNonce: PropTypes.string.isRequired,
	/** Where the connection request is coming from. */
	from: PropTypes.string,
	/** The redirect admin URI. */
	redirectUri: PropTypes.string.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
	/** Images to display on the right side. */
	images: PropTypes.arrayOf( PropTypes.string ),
	/** The assets base URL. */
	assetBaseUrl: PropTypes.string,
	/** Whether to not require a user connection and just redirect after site connection. */
	skipUserConnection: PropTypes.bool,
};

ConnectScreen.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	buttonLabel: __( 'Set up Jetpack', 'jetpack' ),
	images: [],
	redirectUri: null,
	autoTrigger: false,
	skipUserConnection: false,
};

export default ConnectScreen;
