/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { ActionButton } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectUser from '../connect-user';
import { STORE_ID } from '../../state/store';

/**
 * The RNA connection component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The RNA connection component.
 */
const ConnectButton = props => {
	const [ isRegistering, setIsRegistering ] = useState( false );
	const [ isUserConnecting, setIsUserConnecting ] = useState( false );
	const [ registrationError, setRegistrationError ] = useState( false );

	const [ authorizationUrl, setAuthorizationUrl ] = useState( null );

	const { isRegistered, isUserConnected } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);

	const {
		apiRoot,
		apiNonce,
		connectLabel,
		onRegistered,
		registrationNonce,
		redirectUri,
		from,
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

			if ( isRegistered ) {
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
			isRegistered,
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
			{ ( ! isRegistered || ! isUserConnected ) && (
				<ActionButton
					label={ connectLabel }
					onClick={ registerSite }
					displayError={ registrationError ? true : false }
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
	/** The "Connect" button label. */
	connectLabel: PropTypes.string,
	/** API root URL. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** The callback to be called upon registration success. */
	onRegistered: PropTypes.func,
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
