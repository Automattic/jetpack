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
	} = props;

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const connectUser = useCallback( () => {
		if ( forceCalypsoFlow ) {
			window.location.href = authorizationUrl;
			return;
		}

		setIsUserConnecting( true );
	}, [ authorizationUrl, forceCalypsoFlow, setIsUserConnecting ] );

	const onUserConnectedCallback = useCallback( () => {
		setIsUserConnecting( false );

		if ( onUserConnected ) {
			onUserConnected();
		}
	}, [ setIsUserConnecting, onUserConnected ] );

	const registerSite = useCallback(
		e => {
			e.preventDefault();

			if ( isRegistered ) {
				connectUser();
				return;
			}

			setIsRegistering( true );

			restApi
				.registerSite( registrationNonce )
				.then( response => {
					setIsRegistering( false );

					if ( onRegistered ) {
						onRegistered( response );
					}

					connectUser();
				} )
				.catch( error => {
					throw error;
				} );
		},
		[ setIsRegistering, isRegistered, onRegistered, connectUser, registrationNonce ]
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
};

Main.defaultProps = {
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	useCalypsoFlow: false,
	connectLabel: __( 'Connect', 'jetpack' ),
};

export default Main;
