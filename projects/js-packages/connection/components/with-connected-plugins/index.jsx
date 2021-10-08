/**
 * External Dependencies
 */
import React, { useCallback, useState } from 'react';
import restApi from '@automattic/jetpack-api';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';

// fetch the connected plugins
const fetchConnectedPlugins = ( apiRoot, apiNonce, onSuccess, onError ) => {
	restApi.setApiRoot( apiRoot );
	restApi.setApiNonce( apiNonce );

	restApi.fetchConnectedPlugins().then( onSuccess ).catch( onError );
};

/**
 * HOC to get plugins that are using the Jetpack connection.
 *
 * @param { React.Component } WrappedComponent - Component to be passed the ConnectedPlugins data.
 * @returns { React.Component } - A wrapped React component, passed props about the connected plugins.
 */
const withConnectedPlugins = WrappedComponent => {
	return props => {
		const { apiRoot, apiNonce, connectedPluginsCallback } = props;

		const connectedPlugins = useSelect( select => select( STORE_ID ).getConnectedPlugins(), [] );
		const connectedPluginsIsFetching = useSelect(
			select => select( STORE_ID ).getConnectedPluginsIsFetching(),
			[]
		);
		const { setConnectedPlugins, setConnectedPluginsIsFetching } = useDispatch( STORE_ID );
		const [ hasFetched, setHasFetched ] = useState( false );

		const onSuccess = useCallback(
			response => {
				setConnectedPlugins( response );
				setHasFetched( true );
				setConnectedPluginsIsFetching( false );
			},
			[ setConnectedPlugins, setConnectedPluginsIsFetching, setHasFetched ]
		);

		const onError = useCallback(
			error => {
				setHasFetched( true );
				setConnectedPluginsIsFetching( false );
				throw error;
			},
			[ setConnectedPluginsIsFetching, setHasFetched ]
		);

		// handle a callback passed by the user once we have fetched the plugins
		// will be called whenever the connectedPlugins value changes
		const wrappedPluginsCallback = useCallback( () => {
			if (
				connectedPluginsCallback &&
				{}.toString.call( connectedPluginsCallback ) === '[object Function]'
			) {
				connectedPluginsCallback( connectedPlugins );
			}
		}, [ connectedPlugins, connectedPluginsCallback ] );

		if ( ! hasFetched && ! connectedPluginsIsFetching ) {
			setConnectedPluginsIsFetching( true );
			fetchConnectedPlugins( apiRoot, apiNonce, onSuccess, onError );
		}

		hasFetched && ! connectedPluginsIsFetching && wrappedPluginsCallback();

		return (
			<WrappedComponent
				{ ...props }
				connectedPlugins={ connectedPlugins }
				connectedPluginsIsFetching={ connectedPluginsIsFetching }
			/>
		);
	};
};

export default withConnectedPlugins;
