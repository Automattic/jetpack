/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import restApi from '@automattic/jetpack-api';
import { Spinner } from '@automattic/jetpack-components';
import { fireEvent } from '@automattic/jetpack-observer';

/**
 * Internal dependencies
 */
import ConnectUser from '../connect-user';
import { CONNECTION_SITE_CONNECTED } from '../../events';
import './style.scss';

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

					fireEvent( CONNECTION_SITE_CONNECTED, response );

					setAuthorizationUrl( response.authorizeUrl );
					setIsUserConnecting( true );
				} )
				.catch( error => {
					setIsRegistering( false );
					setRegistrationError( error );
					throw error;
				} );
		},
		[ setIsRegistering, setAuthorizationUrl, connectionStatus, registrationNonce, redirectUri ]
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
		<div className="jp-connect-button">
			{ connectionStatusIsFetching && `Loading...` }

			{ ( ! connectionStatus.isRegistered || ! connectionStatus.isUserConnected ) &&
				! connectionStatusIsFetching && (
					<Button
						className="jp-connect-button--button"
						label={ connectLabel }
						onClick={ registerSite }
						isPrimary
						disabled={ isRegistering || isUserConnecting }
					>
						{ isRegistering || isUserConnecting ? <Spinner /> : connectLabel }
					</Button>
				) }

			{ registrationError && (
				<p className="jp-connect-button__error">
					{ __( 'An error occurred. Please try again.', 'jetpack' ) }
				</p>
			) }

			{ isUserConnecting && (
				<ConnectUser connectUrl={ authorizationUrl } redirectUri={ redirectUri } from={ from } />
			) }
		</div>
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
