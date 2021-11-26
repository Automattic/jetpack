/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state/store';

export default ( { registrationNonce, redirectUri, apiRoot, apiNonce, autoTrigger } ) => {
	const { setUserIsConnecting, registerSite } = useDispatch( STORE_ID );
	const siteIsRegistering = useSelect( select => select( STORE_ID ).getSiteIsRegistering(), [] );
	const userIsConnecting = useSelect( select => select( STORE_ID ).getUserIsConnecting(), [] );
	const { isRegistered, isUserConnected } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);

	/**
	 * Initialize the site registration process.
	 *
	 * @param e
	 */
	const handleRegisterSite = e => {
		e && e.preventDefault();

		if ( isRegistered ) {
			setUserIsConnecting( true );
			return;
		}
		registerSite( registrationNonce, redirectUri );
	};

	/**
	 * Initialize/Setup the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Auto-trigger the flow, only do it once.
	 */
	useEffect( () => {
		if ( autoTrigger && ! siteIsRegistering && ! userIsConnecting ) {
			handleRegisterSite();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		handleRegisterSite,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
	};
};
