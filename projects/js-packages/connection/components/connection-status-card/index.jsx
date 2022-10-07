import restApi from '@automattic/jetpack-api';
import { Button, H3, Text } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { STORE_ID } from '../../state/store';
import ConnectUser from '../connect-user';
import DisconnectDialog from '../disconnect-dialog';
import ManageConnectionDialog from '../manage-connection-dialog';
import useConnection from '../use-connection';
import './style.scss';

/**
 * The RNA Connection Status Card component.
 *
 * @param {object}   props -- The properties.
 * @returns {React.Component} The `ConnectionStatusCard` component.
 */

const ConnectionStatusCard = props => {
	const {
		apiRoot,
		apiNonce,
		redirectUri,
		title,
		connectionInfoText,
		onDisconnected,
		connectedPlugins,
		connectedSiteId,
		context,
		onConnectUser,
		requiresUserConnection,
	} = props;

	const { isRegistered, isUserConnected, userConnectionData, hasConnectedOwner } = useConnection( {
		apiRoot,
		apiNonce,
	} );

	const missingConnectedOwner = requiresUserConnection && ! hasConnectedOwner;
	const avatarRef = useRef();
	const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;

	// Update avatar if we have one.
	useEffect( () => {
		if ( avatar ) {
			avatarRef.current.style.backgroundImage = `url('${ avatar }')`;
		}
	}, [ avatar ] );

	const [ isManageConnectionDialogOpen, setIsManageConnectionDialogOpen ] = useState( false );
	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );
	const userIsConnecting = useSelect( select => select( STORE_ID ).getUserIsConnecting(), [] );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( STORE_ID );
	const handleConnectUser = onConnectUser || setUserIsConnecting;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Open the Manage Connection Dialog.
	 */
	const openManageConnectionDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsManageConnectionDialogOpen( true );
		},
		[ setIsManageConnectionDialogOpen ]
	);

	/**
	 * Close the Manage Connection Dialog.
	 */
	const closeManageConnectionDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsManageConnectionDialogOpen( false );
		},
		[ setIsManageConnectionDialogOpen ]
	);

	/**
	 * Open the Disconnect Dialog.
	 */
	const openDisconnectDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( true );
			setIsManageConnectionDialogOpen( false );
		},
		[ setIsDisconnectDialogOpen ]
	);

	/**
	 * Close the Disconnect Dialog.
	 */
	const closeDisconnectDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( false );
		},
		[ setIsDisconnectDialogOpen ]
	);

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
			<H3>{ title }</H3>

			<Text variant="body">{ connectionInfoText }</Text>

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
					<Button
						variant="link"
						weight="regular"
						onClick={ openManageConnectionDialog }
						className="jp-connection__disconnect-dialog__link"
					>
						{ __( 'Disconnect', 'jetpack' ) }
					</Button>
					{ isDisconnectDialogOpen && (
						<DisconnectDialog
							apiRoot={ apiRoot }
							apiNonce={ apiNonce }
							onDisconnected={ onDisconnectedCallback }
							connectedPlugins={ connectedPlugins }
							connectedSiteId={ connectedSiteId }
							connectedUser={ userConnectionData }
							isOpen={ isDisconnectDialogOpen }
							onClose={ closeDisconnectDialog }
							context={ context }
						/>
					) }
					{ isManageConnectionDialogOpen && (
						<ManageConnectionDialog
							isOpen={ isManageConnectionDialogOpen }
							openDisconnectDialog={ openDisconnectDialog }
							closeManageConnectionDialog={ closeManageConnectionDialog }
						/>
					) }
				</li>

				{ isUserConnected && (
					<li className="jp-connection-status-card--list-item-success">
						{ __( 'Logged in as', 'jetpack' ) }{ ' ' }
						{ userConnectionData.currentUser?.wpcomUser?.display_name }
					</li>
				) }

				{ ( ! isUserConnected || ! hasConnectedOwner ) && (
					<li
						className={ `jp-connection-status-card--list-item-${
							missingConnectedOwner ? 'error' : 'info'
						}` }
					>
						{ missingConnectedOwner && __( 'Requires user connection.', 'jetpack' ) }{ ' ' }
						<Button
							variant="link"
							disabled={ userIsConnecting }
							onClick={ handleConnectUser }
							className="jp-connection-status-card--btn-connect-user"
						>
							{ __( 'Connect your user account', 'jetpack' ) }
						</Button>
					</li>
				) }
			</ul>

			{ userIsConnecting && <ConnectUser redirectUri={ redirectUri } /> }
		</div>
	);
};

ConnectionStatusCard.propTypes = {
	/** API root URL, required. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce, required. */
	apiNonce: PropTypes.string.isRequired,
	/** The redirect admin URI after the user has connected their WordPress.com account. */
	redirectUri: PropTypes.string,
	/** An object of the plugins currently using the Jetpack connection. */
	connectedPlugins: PropTypes.array,
	/** ID of the currently connected site. */
	connectedSiteId: PropTypes.number,
	/** The Card title. */
	title: PropTypes.string,
	/** The text that will be displayed under the title, containing info how to leverage the connection. */
	connectionInfoText: PropTypes.string,
	/** The callback to be called upon disconnection success. */
	onDisconnected: PropTypes.func,
	/** The context in which this component is being used */
	context: PropTypes.string,
	/** Function to override default action for connect user account */
	onConnectUser: PropTypes.func,
	/** Shows an requires user connection message if true and a user connection is missing */
	requiresUserConnection: PropTypes.bool,
};

ConnectionStatusCard.defaultProps = {
	title: __( 'Connection', 'jetpack' ),
	connectionInfoText: __( 'Leverages the cloud for more powerful Jetpack features.', 'jetpack' ),
	redirectUri: null,
	onConnectUser: null,
	requiresUserConnection: true,
};

export default ConnectionStatusCard;
