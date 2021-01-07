/**
 * External dependencies
 */
import React from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import './style.scss';
import { STORE_ID } from '../../store';

/**
 * Send the connection refresh API request and handle the response.
 *
 * @param {function} refreshingAction - The `connectionStatusRefreshing` action.
 * @param {function} refreshedAction - The `connectionStatusRefreshed` action.
 */
function doRefresh( refreshingAction, refreshedAction ) {
	refreshingAction();

	apiFetch( {
		path: '/jetpack/v4/connection/reconnect',
		method: 'POST',
		data: { from: 'connection-ui' },
	} ).then( result => {
		switch ( result.status ) {
			case 'in_progress':
				if ( result.authorizeUrl ) {
					window.location.href = result.authorizeUrl.replace(
						'jetpack.authorize_iframe',
						'jetpack.authorize'
					);
					return;
				}

				throw new Error( 'Authorize URL is missing' );
			case 'completed':
				refreshedAction();
				return;
		}

		throw new Error( 'Invalid API response' );
	} );
}

/**
 * The Refresh component.
 *
 * @returns {JSX.Element} - The Section component.
 */
const Refresh = () => {
	const { connectionStatusRefreshing, connectionStatusRefreshed } = useDispatch( STORE_ID );
	const { isActive, isRegistered, isRefreshing } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);

	const refreshConnection = useCallback(
		() =>
			isActive &&
			isRegistered &&
			doRefresh( connectionStatusRefreshing, connectionStatusRefreshed ),
		[ isActive, isRegistered, connectionStatusRefreshed, connectionStatusRefreshing ]
	);

	return (
		<div className="jetpack-cui__refresh">
			<p>
				{ __(
					'Refresh all the connections to WordPress.com at once without having to disconnect any of them.',
					'jetpack'
				) }
			</p>

			{ isActive && isRegistered ? (
				<Button isPrimary onClick={ refreshConnection }>
					Refresh Connection
				</Button>
			) : (
				<Button isPrimary disabled>
					{ isRefreshing ? 'Refreshing...' : 'Not Connected' }
				</Button>
			) }
		</div>
	);
};

export default Refresh;
