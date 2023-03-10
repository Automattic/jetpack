import { ActionButton } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import useConnection from '../use-connection';

/**
 * The RNA connection component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The RNA connection component.
 */
const ConnectButton = props => {
	const {
		apiRoot,
		apiNonce,
		connectLabel,
		registrationNonce,
		redirectUri,
		from,
		autoTrigger,
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
	} );

	return (
		<>
			{ ( ! isRegistered || ! isUserConnected ) && (
				<ActionButton
					label={ connectLabel }
					onClick={ handleRegisterSite }
					displayError={ registrationError ? true : false }
					isLoading={ siteIsRegistering || userIsConnecting }
				/>
			) }
		</>
	);
};

ConnectButton.propTypes = {
	/** The "Connect" button label. */
	connectLabel: PropTypes.string,
	/** API root URL. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** Where the connection request is coming from. */
	from: PropTypes.string,
	/** The redirect admin URI. */
	redirectUri: PropTypes.string.isRequired,
	/** Registration nonce. */
	registrationNonce: PropTypes.string.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
};

ConnectButton.defaultProps = {
	connectLabel: __( 'Connect', 'jetpack' ),
	redirectUri: null,
	autoTrigger: false,
};

export default ConnectButton;
