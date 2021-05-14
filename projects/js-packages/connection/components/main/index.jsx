/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import restApi from '../../tools/jetpack-rest-api-client';
import ConnectUser from '../connect-user';

/**
 * The RNA connection component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.connectLabel -- The "Connect" button label.
 * @param {string} props.inPlaceTitle -- The title for the In-Place Connection component.
 * @param {boolean} props.forceCalypsoFlow -- Whether to go straight to Calypso flow, skipping the In-Place flow.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.registrationNonce -- Separate registration nonce, required.
 * @param {boolean} props.isRegistered -- Whether the site is registered (has blog token), required.
 * @param {boolean} props.isUserConnected -- Whether the current user is connected (has user token), required.
 * @param {boolean} props.hasConnectedOwner -- Whether the site has connection owner, required.
 * @param {Function} props.onRegistered -- The callback to be called upon registration success.
 * @param {Function} props.onUserConnected -- The callback to be called when the connection is fully established.
 *
 * @returns {React.Component} The RNA connection component.
 */
const Main = props => {
	const [ isRegistering, setIsRegistering ] = useState( false );
	const [ isUserConnecting, setIsUserConnecting ] = useState( false );

	const [ authorizationUrl, setAuthorizationUrl ] = useState( null );

	const {
		apiRoot,
		apiNonce,
		connectLabel,
		isRegistered,
		isUserConnected,
		onRegistered,
		onUserConnected,
		registrationNonce,
		redirectUri,
		forceCalypsoFlow,
		inPlaceTitle,
		hasConnectedOwner,
		from,
	} = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Callback for the user connection success.
	 */
	const onUserConnectedCallback = useCallback( () => {
		setIsUserConnecting( false );

		if ( onUserConnected ) {
			onUserConnected();
		}
	}, [ setIsUserConnecting, onUserConnected ] );

	/**
	 * Initialize the site registration process.
	 */
	const registerSite = useCallback(
		e => {
			e && e.preventDefault();

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

	if ( isRegistered && isUserConnected ) {
		return null;
	}

	return (
		<div className="jp-connection-main">
			{ ! isUserConnecting && (
				<Button
					label={ connectLabel }
					onClick={ registerSite }
					isPrimary
					disabled={ isRegistering }
				>
					{ connectLabel }
				</Button>
			) }

			{ isUserConnecting && (
				<ConnectUser
					connectUrl={ authorizationUrl }
					redirectUri={ redirectUri }
					inPlaceTitle={ inPlaceTitle }
					onComplete={ onUserConnectedCallback }
					displayTOS={ hasConnectedOwner || isRegistered }
					forceCalypsoFlow={ forceCalypsoFlow }
					from={ from }
				/>
			) }
		</div>
	);
};

Main.propTypes = {
	connectLabel: PropTypes.string,
	inPlaceTitle: PropTypes.string,
	forceCalypsoFlow: PropTypes.bool,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	isRegistered: PropTypes.bool.isRequired,
	isUserConnected: PropTypes.bool.isRequired,
	hasConnectedOwner: PropTypes.bool.isRequired,
	onRegistered: PropTypes.func,
	onUserConnected: PropTypes.func,
	registrationNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string,
};

Main.defaultProps = {
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	forceCalypsoFlow: false,
	connectLabel: __( 'Connect', 'jetpack' ),
};

export default Main;
