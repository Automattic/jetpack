/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dashicon } from '@wordpress/components';
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
 * @param {function} refreshedResetAction - The `connectionStatusRefreshedReset` action.
 */
function doRefresh( refreshingAction, refreshedAction, refreshedResetAction ) {
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
				setTimeout( () => refreshedResetAction(), 5000 );
				return;
		}

		throw new Error( 'Invalid API response' );
	} );
}

/**
 * Handle the `#refreshed` key in the URL.
 * Needed to handle users coming back from the Calypso auth flow.
 *
 * @param {function} refreshedAction - The `connectionStatusRefreshed` action.
 * @param {function} refreshedResetAction - The `connectionStatusRefreshedReset` action.
 */
function handleRefreshedURL( refreshedAction, refreshedResetAction ) {
	if ( '#refreshed' === location.hash ) {
		refreshedAction();
		setTimeout( () => refreshedResetAction(), 5000 );
		location.hash = '';
	}
}

/**
 * The Refresh component.
 *
 * @returns {JSX.Element} - The Section component.
 */
const Refresh = () => {
	const {
		connectionStatusRefreshing,
		connectionStatusRefreshed,
		connectionStatusRefreshedReset,
	} = useDispatch( STORE_ID );
	const { isActive, isRegistered, isRefreshing, isRefreshed } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);

	useEffect(
		() => handleRefreshedURL( connectionStatusRefreshed, connectionStatusRefreshedReset ),
		[]
	);

	const refreshConnection = useCallback(
		() =>
			isActive &&
			isRegistered &&
			doRefresh(
				connectionStatusRefreshing,
				connectionStatusRefreshed,
				connectionStatusRefreshedReset
			),
		[
			isActive,
			isRegistered,
			connectionStatusRefreshed,
			connectionStatusRefreshing,
			connectionStatusRefreshedReset,
		]
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
				<Button isPrimary onClick={ refreshConnection } className={ isRefreshed && 'refreshed' }>
					{ isRefreshed ? (
						<React.Fragment>
							<Dashicon icon="yes" /> { __( 'Refreshed', 'jetpack' ) }{ ' ' }
						</React.Fragment>
					) : (
						__( 'Refresh Connection', 'jetpack' )
					) }
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
