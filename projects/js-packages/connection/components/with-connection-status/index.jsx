/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import restApi from '@automattic/jetpack-api';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';

/**
 * Fetch the connection status and update the state accordingly.
 *
 * @param {string} apiRoot - API root URL.
 * @param {string} apiNonce - API Nonce.
 * @param {Function} onSuccess - Callback that's called upon successfully fetching the connection status.
 * @param {Function} onError - Callback that's called in case of fetching error.
 */
const fetchConnectionStatus = ( apiRoot, apiNonce, onSuccess, onError ) => {
	restApi.setApiRoot( apiRoot );
	restApi.setApiNonce( apiNonce );

	restApi.fetchSiteConnectionStatus().then( onSuccess ).catch( onError );
};

/**
 * Higher order component to fetch connection status and pass it further as a parameter.
 *
 * @param {React.Component} WrappedComponent - The component that needs connection status.
 * @returns {React.Component} The higher order component.
 */
const withConnectionStatus = WrappedComponent => {
	/**
	 * The `WrappedComponent` with connection status passed into it.
	 *
	 * @param {object} props -- The properties.
	 * @param {Function} props.statusCallback -- Callback to pull connection status from the component.
	 * @returns {React.Component} The higher order component.
	 */
	return props => {
		const { apiRoot, apiNonce, statusCallback } = props;

		const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
		const { setConnectionStatus, setConnectionStatusIsFetching } = useDispatch( STORE_ID );

		const connectionStatusIsFetching = useSelect(
			select => select( STORE_ID ).getConnectionStatusIsFetching(),
			[]
		);

		const hasConnectionStatus = connectionStatus.hasOwnProperty( 'isActive' );

		const onSuccess = useCallback(
			response => {
				setConnectionStatus( response );
				setConnectionStatusIsFetching( false );
			},
			[ setConnectionStatus, setConnectionStatusIsFetching ]
		);

		const onError = useCallback(
			error => {
				setConnectionStatusIsFetching( false );
				throw error;
			},
			[ setConnectionStatusIsFetching ]
		);

		const statusCallbackWrapped = useCallback( () => {
			if ( statusCallback && {}.toString.call( statusCallback ) === '[object Function]' ) {
				return statusCallback( connectionStatus );
			}
		}, [ connectionStatus, statusCallback ] );

		if ( ! hasConnectionStatus && ! connectionStatusIsFetching ) {
			setConnectionStatusIsFetching( true );

			fetchConnectionStatus( apiRoot, apiNonce, onSuccess, onError );
		}

		hasConnectionStatus && ! connectionStatusIsFetching && statusCallbackWrapped();

		return (
			<WrappedComponent
				connectionStatus={ connectionStatus }
				connectionStatusIsFetching={ connectionStatusIsFetching }
				{ ...props }
			/>
		);
	};
};

export default withConnectionStatus;
