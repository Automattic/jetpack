/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import restApi from '@automattic/jetpack-api';
import { ActionButton } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectUser from '../connect-user';

/**
 * The RNA connection component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.connectLabel -- The "Connect" button label.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.registrationNonce -- Separate registration nonce, required.
 * @param {Function} props.onRegistered -- The callback to be called upon registration success.
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string} props.from -- Where the connection request is coming from.
 * @param {object} props.connectionStatus -- The connection status object.
 * @param {boolean} props.connectionStatusIsFetching -- The flag indicating that connection status is being fetched.
 * @param {boolean} props.autoTrigger -- Whether to initiate the connection process automatically upon rendering the component.
 * @returns {React.Component} The RNA connection component.
 */
const ConnectButton = props => {
	const [ isRegistering, setIsRegistering ] = useState( false );
	const [ isUserConnecting, setIsUserConnecting ] = useState( false );
	const [ registrationError, setRegistrationError ] = useState( false );

	const [ authorizationUrl, setAuthorizationUrl ] = useState( null );

	const {
		apiRoot,
		apiNonce,
		connectLabel,
		onRegistered,
		registrationNonce,
		redirectUri,
		from,
		connectionStatus,
		connectionStatusIsFetching,
		autoTrigger,
	} = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Initialize the site registration process.
	 */
	const registerSite = useCallback(
		e => {
			e && e.preventDefault();

			setRegistrationError( false );

			if ( connectionStatus.isRegistered ) {
				setIsUserConnecting( true );
				return;
			}

			setIsRegistering( true );

			restApi
				.registerSite( registrationNonce, redirectUri )
				.then( response => {
					setIsRegistering( false );

					if ( onRegistered ) {
						onRegistered( response );
					}

					setAuthorizationUrl( response.authorizeUrl );
					setIsUserConnecting( true );
				} )
				.catch( error => {
					setIsRegistering( false );
					setRegistrationError( error );
					throw error;
				} );
		},
		[
			setIsRegistering,
			setAuthorizationUrl,
			connectionStatus,
			onRegistered,
			registrationNonce,
			redirectUri,
		]
	);

	/**
	 * Auto-trigger the flow, only do it once.
	 */
	useEffect( () => {
		if ( autoTrigger && ! isRegistering && ! isUserConnecting ) {
			registerSite();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			{ ( ! connectionStatus.isRegistered || ! connectionStatus.isUserConnected ) &&
				! connectionStatusIsFetching && (
					<ActionButton
						label={ connectLabel }
						onClick={ registerSite }
						displayError={ registrationError }
						isLoading={ isRegistering || isUserConnecting }
					/>
				) }

			{ isUserConnecting && (
				<ConnectUser connectUrl={ authorizationUrl } redirectUri={ redirectUri } from={ from } />
			) }
		</>
	);
};

ConnectButton.propTypes = {
	connectLabel: PropTypes.string,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	onRegistered: PropTypes.func,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	registrationNonce: PropTypes.string.isRequired,
	autoTrigger: PropTypes.bool,
};

ConnectButton.defaultProps = {
	connectLabel: __( 'Connect', 'jetpack' ),
	redirectUri: null,
	autoTrigger: false,
};

export default ConnectButton;
