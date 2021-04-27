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
import InPlaceConnection from '../in-place-connection';
import restApi from '../../tools/jetpack-rest-api-client';

/**
 * The in-place connection component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.authorizationUrl -- The authorization URL.
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
 * @param {Function} props.redirectFunc -- The redirect function (`window.location.assign()` by default).
 *
 * @returns {React.Component} The in-place connection component.
 */
const Main = props => {
	const [ isRegistering, setIsRegistering ] = useState( false );
	const [ isUserConnecting, setIsUserConnecting ] = useState( false );

	const {
		apiRoot,
		apiNonce,
		connectLabel,
		authorizationUrl,
		forceCalypsoFlow,
		isRegistered,
		isUserConnected,
		onRegistered,
		onUserConnected,
		registrationNonce,
		redirectFunc,
		from,
		redirectUri,
	} = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Initialize the user connection process.
	 */
	const connectUser = useCallback(
		url => {
			url = url || authorizationUrl;

			if ( ! url.includes( '?' ) ) {
				url += '?';
			}

			if ( from ) {
				url += '&from=' + encodeURIComponent( from );
			}

			if ( ! url ) {
				throw new Error( 'Authorization URL is required' );
			}

			if ( forceCalypsoFlow ) {
				redirectFunc( url );
				return;
			}

			setIsUserConnecting( true );
		},
		[ authorizationUrl, forceCalypsoFlow, setIsUserConnecting, redirectFunc, from ]
	);

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
				connectUser();
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

					connectUser( response.authorizeUrl );
				} )
				.catch( error => {
					throw error;
				} );
		},
		[ setIsRegistering, isRegistered, onRegistered, connectUser, registrationNonce, redirectUri ]
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
					disabled={ isRegistering || isUserConnecting }
				>
					{ connectLabel }
				</Button>
			) }

			{ isUserConnecting && (
				<InPlaceConnection
					connectUrl={ authorizationUrl }
					title={ props.inPlaceTitle }
					onComplete={ onUserConnectedCallback }
					displayTOS={ props.hasConnectedOwner || isRegistered }
				/>
			) }
		</div>
	);
};

Main.propTypes = {
	authorizationUrl: PropTypes.string.isRequired,
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
	redirectFunc: PropTypes.func,
	from: PropTypes.string,
	redirectUri: PropTypes.string,
};

Main.defaultProps = {
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	forceCalypsoFlow: false,
	connectLabel: __( 'Connect', 'jetpack' ),
	redirectFunc: url => window.location.assign( url ),
};

export default Main;
