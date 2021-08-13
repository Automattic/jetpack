/**
 * External dependencies
 */
import React from 'react';
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
 * @param {Function} setConnectionStatus - Callback to update the connection status in the state.
 * @param {Function} setConnectionStatusIsFetching - Callback to set the "is fetching" flag in the state.
 */
const fetchConnectionStatus = (
	apiRoot,
	apiNonce,
	setConnectionStatus,
	setConnectionStatusIsFetching
) => {
	restApi.setApiRoot( apiRoot );
	restApi.setApiNonce( apiNonce );

	setConnectionStatusIsFetching( true );

	restApi
		.fetchSiteConnectionStatus()
		.then( response => {
			setConnectionStatus( response );
			setConnectionStatusIsFetching( false );
		} )
		.catch( error => {
			setConnectionStatusIsFetching( false );
			throw error;
		} );
};

/**
 * Higher order component to fetch connection status and pass it further as a parameter.
 *
 * @param {React.Component} WrappedComponent - The component that needs connection status.
 * @returns {React.Component} The higher order component.
 */
const withConnectionStatus = WrappedComponent => {
	return props => {
		const { apiRoot, apiNonce } = props;

		const connectionStatus = useSelect( select => select( STORE_ID ).getConnectionStatus(), [] );
		const { setConnectionStatus, setConnectionStatusIsFetching } = useDispatch( STORE_ID );

		const connectionStatusIsFetching = useSelect(
			select => select( STORE_ID ).getConnectionStatusIsFetching(),
			[]
		);

		if ( ! connectionStatus.hasOwnProperty( 'isActive' ) && ! connectionStatusIsFetching ) {
			fetchConnectionStatus(
				apiRoot,
				apiNonce,
				setConnectionStatus,
				setConnectionStatusIsFetching
			);
		}

		return <WrappedComponent connectionStatus={ connectionStatus } { ...props } />;
	};
};

export default withConnectionStatus;
