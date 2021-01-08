/**
 * External dependencies
 */
import React from 'react';
import { Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { STORE_ID } from '../../store';

const doSwitchPlugin = (
	slug,
	connect,
	disconnect,
	pluginConnectedAction,
	pluginDisconnectedAction,
	pluginRequestInProgressAction,
	pluginRequestDoneAction
) => {
	pluginRequestInProgressAction();

	apiFetch( {
		path: '/jetpack/v4/connection/connect_disconnect_plugin',
		method: 'POST',
		data: { slug, connect, disconnect },
	} ).then( result => {
		if ( result.success ) {
			connect && pluginConnectedAction( slug );
			disconnect && pluginDisconnectedAction( slug );
			pluginRequestDoneAction();

			return;
		}

		throw new Error( 'Invalid API response' );
	} );
};

/**
 * The Plugin component.
 *
 * @param {object} props                The properties.
 * @param {object} props.plugin         The plugin object.
 * @param {boolean} props.siteConnected Is the site connected to WP.com.
 * @returns {JSX.Element} The Plugin component.
 *
 * @todo Disable the Connect/Disconnect button during a request.
 */
const Plugin = props => {
	const { plugin, siteConnected } = props;
	const {
		pluginConnected,
		pluginDisconnected,
		pluginRequestInProgress,
		pluginRequestDone,
	} = useDispatch( STORE_ID );

	const switchPlugin = useCallback(
		() =>
			siteConnected
				? doSwitchPlugin(
						plugin.slug,
						! plugin.isConnected,
						plugin.isConnected,
						pluginConnected,
						pluginDisconnected,
						pluginRequestInProgress,
						pluginRequestDone
				  )
				: null,
		[
			siteConnected,
			plugin,
			pluginConnected,
			pluginDisconnected,
			pluginRequestInProgress,
			pluginRequestDone,
		]
	);

	return (
		<div className="jetpack-cui__plugin">
			<p>
				{ plugin.name }
				<br />
				{ siteConnected && plugin.isConnected && <span className="dot-connected">Connected</span> }
			</p>

			<Button
				disabled={ ! siteConnected }
				onClick={ switchPlugin }
				className={ plugin.isConnected ? 'connected' : 'disconnected' }
			>
				{ plugin.isConnected ? 'Disconnect' : 'Connect' }
			</Button>
		</div>
	);
};

export default Plugin;
