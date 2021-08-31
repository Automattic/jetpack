/**
 * External dependencies
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import restApi from '@automattic/jetpack-api';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConnectUser from '../connect-user';
import DisconnectDialog from '../disconnect-dialog';
import { STORE_ID } from '../../state/store';
import './style.scss';

/**
 * The RNA Connection Status Card component.
 *
 * @param {object}   props -- The properties.
 * @param {string}   props.apiRoot -- API root URL, required.
 * @param {string}   props.apiNonce -- API Nonce, required.
 * @param {boolean}  props.isRegistered -- Whether a site level connection has already been established, required. If not, the component will not render.
 * @param {string}   props.isUserConnected -- Whether the current user has connected their WordPress.com account, required.
 * @param {string}   props.redirectUri -- The redirect admin URI after the user has connected their WordPress.com account.
 * @param {string}   props.title -- The Card title.
 * @param {string}   props.connectionInfoText -- The text that will be displayed under the title, containing info how to leverage the connection.
 * @param {Function} props.onDisconnected -- The callback to be called upon disconnection success.
 * @returns {React.Component} The `ConnectionStatusCard` component.
 */

const ConnectionStatusCard = props => {
	const {
		apiRoot,
		apiNonce,
		isRegistered,
		isUserConnected,
		redirectUri,
		title,
		connectionInfoText,
		onDisconnected,
	} = props;

	const [ isFetchingConnectionData, setIsFetchingConnectionData ] = useState( false );
	const [ connectedUserData, setConnectedUserData ] = useState( {} );
	const [ isUserConnecting, setIsUserConnecting ] = useState( false );
	const { setConnectionStatus } = useDispatch( STORE_ID );

	const avatarRef = useRef();

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Fetch the connection data on the first render.
	 * To be only run once.
	 */
	useEffect( () => {
		setIsFetchingConnectionData( true );

		restApi
			.fetchSiteConnectionData()
			.then( response => {
				setIsFetchingConnectionData( false );
				setConnectedUserData( response.currentUser?.wpcomUser );
				const avatar = response.currentUser?.wpcomUser?.avatar;
				if ( avatar ) {
					avatarRef.current.style.backgroundImage = `url('${ avatar }')`;
				}
			} )
			.catch( error => {
				setIsFetchingConnectionData( false );
				throw error;
			} );
	}, [ setIsFetchingConnectionData, setConnectedUserData ] );

	const onDisconnectedCallback = useCallback(
		e => {
			e && e.preventDefault();

			setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );

			if ( onDisconnected && {}.toString.call( onDisconnected ) === '[object Function]' ) {
				onDisconnected();
			}
		},
		[ onDisconnected, setConnectionStatus ]
	);

	// Prevent component from rendering if site is not connected.
	if ( ! isRegistered ) {
		return null;
	}

	return (
		<div className="jp-connection-status-card">
			<h3>{ title }</h3>

			<p>{ connectionInfoText }</p>

			<div className="jp-connection-status-card--status">
				<div className="jp-connection-status-card--cloud"></div>
				<div
					className={
						'jp-connection-status-card--line' +
						( isUserConnected ? '' : ' jp-connection-status-card--site-only' )
					}
				></div>
				<div className="jp-connection-status-card--jetpack-logo"></div>
				<div className="jp-connection-status-card--avatar" ref={ avatarRef }></div>
			</div>

			<ul className="jp-connection-status-card--list">
				<li className="jp-connection-status-card--list-item-success">
					{ __( 'Site connected.', 'jetpack' ) }&nbsp;
					<DisconnectDialog
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						onDisconnected={ onDisconnectedCallback }
					>
						<h2>
							{ __( 'Jetpack is currently powering multiple products on your site.', 'jetpack' ) }
							<br />
							{ __( 'Once you disconnect Jetpack, these will no longer work.', 'jetpack' ) }
						</h2>
					</DisconnectDialog>
				</li>

				{ isUserConnected && ! isFetchingConnectionData && (
					<li className="jp-connection-status-card--list-item-success">
						{ __( 'Logged in as', 'jetpack' ) } { connectedUserData?.display_name }
					</li>
				) }

				{ ! isUserConnected && ! isFetchingConnectionData && (
					<li className="jp-connection-status-card--list-item-error">
						{ __( 'Your WordPress.com account is not connected.', 'jetpack' ) }
					</li>
				) }
			</ul>

			{ ! isUserConnected && ! isFetchingConnectionData && (
				<Button
					isPrimary
					disabled={ isUserConnecting }
					onClick={ setIsUserConnecting }
					className="jp-connection-status-card--btn-connect-user"
				>
					{ __( 'Connect your WordPress.com account', 'jetpack' ) }
				</Button>
			) }

			{ isUserConnecting && <ConnectUser redirectUri={ redirectUri } /> }
		</div>
	);
};

ConnectionStatusCard.propTypes = {
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	isRegistered: PropTypes.bool.isRequired,
	isUserConnected: PropTypes.bool.isRequired,
	redirectUri: PropTypes.string.isRequired,
	title: PropTypes.string,
	connectionInfoText: PropTypes.string,
	onDisconnected: PropTypes.func,
};

ConnectionStatusCard.defaultProps = {
	title: __( 'Connection', 'jetpack' ),
	connectionInfoText: __(
		'Leverages the Jetpack Cloud for more features on your side.',
		'jetpack'
	),
};

export default ConnectionStatusCard;
