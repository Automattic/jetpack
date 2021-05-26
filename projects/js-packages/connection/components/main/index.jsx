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
 * @param {Function} props.onRegistered -- The callback to be called upon registration success.
 * @param {Function} props.onUserConnected -- The callback to be called when the connection is fully established.
 *
 * @returns {React.Component} The RNA connection component.
 */
const Main = props => {
	const [ isRegistering, setIsRegistering ] = useState( false );
	const [ isUserConnecting, setIsUserConnecting ] = useState( false );

	const [ authorizationUrl, setAuthorizationUrl ] = useState( null );

	const [ isFetchingConnectionStatus, setIsFetchingConnectionStatus ] = useState( false );
	const [ connectionStatus, setConnectionStatus ] = useState( {} );

	const {
		apiRoot,
		apiNonce,
		connectLabel,
		onRegistered,
		onUserConnected,
		registrationNonce,
		redirectUri,
		forceCalypsoFlow,
		inPlaceTitle,
		from,
		children,
	} = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Fetch the connection status on the first render.
	 * To be only run once.
	 */
	useEffect( () => {
		setIsFetchingConnectionStatus( true );

		restApi
			.fetchSiteConnectionStatus()
			.then( response => {
				setIsFetchingConnectionStatus( false );
				setConnectionStatus( response );
			} )
			.catch( error => {
				setIsFetchingConnectionStatus( false );
				throw error;
			} );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Callback for the user connection success.
	 */
	const onUserConnectedCallback = useCallback( () => {
		setIsUserConnecting( false );
		setConnectionStatus( status => {
			return { ...status, isUserConnected: true };
		} );

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
					setConnectionStatus( status => {
						return { ...status, isRegistered: true };
					} );
				} )
				.catch( error => {
					setIsRegistering( false );
					throw error;
				} );
		},
		[
			setIsRegistering,
			setAuthorizationUrl,
			connectionStatus,
			setConnectionStatus,
			onRegistered,
			registrationNonce,
			redirectUri,
		]
	);

	const childrenCallback = useCallback( () => {
		if ( children && {}.toString.call( children ) === '[object Function]' ) {
			return children( connectionStatus );
		}
	}, [ connectionStatus, children ] );

	return (
		<div className="jp-connection-main">
			{ childrenCallback() }

			{ isFetchingConnectionStatus && `Loading...` }

			{ ( ! connectionStatus.isRegistered || ! connectionStatus.isUserConnected ) &&
				! isFetchingConnectionStatus && (
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
				<ConnectUser
					connectUrl={ authorizationUrl }
					redirectUri={ redirectUri }
					inPlaceTitle={ inPlaceTitle }
					onComplete={ onUserConnectedCallback }
					displayTOS={ connectionStatus.hasConnectedOwner || connectionStatus.isRegistered }
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
	onRegistered: PropTypes.func,
	onUserConnected: PropTypes.func,
	registrationNonce: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
};

Main.defaultProps = {
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	forceCalypsoFlow: false,
	connectLabel: __( 'Connect', 'jetpack' ),
};

export default Main;
