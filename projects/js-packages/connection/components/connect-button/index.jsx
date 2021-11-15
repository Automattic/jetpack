/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelect, useDispatch } from '@wordpress/data';
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
	const [ registrationError, setRegistrationError ] = useState( false );
	const [ authorizationUrl, setAuthorizationUrl ] = useState( null );

	const { isRegistered, isUserConnected } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);
	const siteIsRegistering = useSelect( select => select( STORE_ID ).getSiteIsRegistering(), [] );
	const userIsConnecting = useSelect( select => select( STORE_ID ).getUserIsConnecting(), [] );
	const { setSiteIsRegistering, setUserIsConnecting } = useDispatch( STORE_ID );

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
				setUserIsConnecting( true );
				return;
			}

			setSiteIsRegistering( true );

			restApi
				.registerSite( registrationNonce, redirectUri )
				.then( response => {
					setSiteIsRegistering( false );

					if ( onRegistered ) {
						onRegistered( response );
					}

					setAuthorizationUrl( response.authorizeUrl );
					setUserIsConnecting( true );
				} )
				.catch( error => {
					setSiteIsRegistering( false );
					setRegistrationError( error );
					throw error;
				} );
		},
		[
			setSiteIsRegistering,
			setUserIsConnecting,
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
		if ( autoTrigger && ! siteIsRegistering && ! userIsConnecting ) {
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
					isLoading={ siteIsRegistering || userIsConnecting }
				/>
			) }

			{ userIsConnecting && (
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
