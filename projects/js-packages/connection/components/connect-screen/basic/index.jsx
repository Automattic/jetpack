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
 * @param {string?} props.loadingLabel -- The text read by screen readers when connecting.
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
 * @param {boolean?} props.autoTrigger -- Whether to initiate the connection process automatically upon rendering the component.
 * @param {object?} props.logo -- The logo to display at the top of the component.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const ConnectScreen = ( {
	title,
	buttonLabel,
	loadingLabel,
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
	logo,
} ) => {
	const {
		handleRegisterSite,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
		isOfflineMode,
	} = useConnection( {
		registrationNonce,
		redirectUri,
		apiRoot,
		apiNonce,
		autoTrigger,
		from,
		skipUserConnection,
	} );

	const displayButtonError = Boolean( registrationError );
	const buttonIsLoading = siteIsRegistering || userIsConnecting;
	const errorCode = registrationError?.response?.code;

	return (
		<ConnectScreenVisual
			title={ title }
			images={ images }
			assetBaseUrl={ assetBaseUrl }
			buttonLabel={ buttonLabel }
			loadingLabel={ loadingLabel }
			handleButtonClick={ handleRegisterSite }
			displayButtonError={ displayButtonError }
			errorCode={ errorCode }
			buttonIsLoading={ buttonIsLoading }
			footer={ footer }
			isOfflineMode={ isOfflineMode }
			logo={ logo }
		>
			{ children }
		</ConnectScreenVisual>
	);
};

ConnectScreen.propTypes = {
	title: PropTypes.string,
	buttonLabel: PropTypes.string,
	loadingLabel: PropTypes.string,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	registrationNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	autoTrigger: PropTypes.bool,
	images: PropTypes.arrayOf( PropTypes.string ),
	assetBaseUrl: PropTypes.string,
	skipUserConnection: PropTypes.bool,
	logo: PropTypes.element,
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
