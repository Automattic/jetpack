/**
 * External dependencies
 */
import React, { useEffect, useCallback } from 'react';
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
	const { isRegistered, isUserConnected } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);
	const siteIsRegistering = useSelect( select => select( STORE_ID ).getSiteIsRegistering(), [] );
	const userIsConnecting = useSelect( select => select( STORE_ID ).getUserIsConnecting(), [] );
	const registrationError = useSelect( select => select( STORE_ID ).getRegistrationError(), [] );
	const authorizationUrl = useSelect( select => select( STORE_ID ).getAuthorizationUrl(), [] );
	const { setUserIsConnecting, registerSite } = useDispatch( STORE_ID );

	const {
		apiRoot,
		apiNonce,
		connectLabel,
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
	const handleRegisterSite = useCallback(
		e => {
			e && e.preventDefault();

			if ( isRegistered ) {
				setUserIsConnecting( true );
				return;
			}
			registerSite( registrationNonce, redirectUri );
		},
		[ isRegistered, registrationNonce, redirectUri, registerSite, setUserIsConnecting ]
	);

	/**
	 * Auto-trigger the flow, only do it once.
	 */
	useEffect( () => {
		if ( autoTrigger && ! siteIsRegistering && ! userIsConnecting ) {
			handleRegisterSite();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

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
