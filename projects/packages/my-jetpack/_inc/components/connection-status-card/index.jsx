import restApi from '@automattic/jetpack-api';
import { Button, H3, Text } from '@automattic/jetpack-components';
import {
	DisconnectDialog,
	useConnection,
	ConnectUser,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect, useState, useCallback } from 'react';
import cloud from './cloud.svg';
import emptyAvatar from './empty-avatar.svg';
import jetpack from './jetpack.svg';
import styles from './styles.module.scss';

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

	const {
		isRegistered,
		isUserConnected,
		userConnectionData,
		hasConnectedOwner,
		userIsConnecting,
	} = useConnection( {
		apiRoot,
		apiNonce,
	} );

	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( CONNECTION_STORE_ID );
	const handleConnectUser = onConnectUser || setUserIsConnecting;

	const missingConnectedOwner = requiresUserConnection && ! hasConnectedOwner;
	// const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Open the Disconnect Dialog.
	 */
	const openDisconnectDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( true );
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
			onDisconnected?.();
		},
		[ onDisconnected, setConnectionStatus ]
	);

	return (
		<div className={ styles[ 'connection-status-card' ] }>
			<H3>{ title }</H3>

			<Text variant="body">{ connectionInfoText }</Text>

			<div className={ styles.status }>
				<img src={ cloud } alt="" className={ styles.cloud } />
				<div
					className={ classNames( styles.line, {
						[ styles.disconnected ]: ! isRegistered || ! isUserConnected,
					} ) }
				/>
				<div className={ styles[ 'avatar-wrapper' ] }>
					<img src={ jetpack } alt="" className={ styles.jetpack } />
					<img src={ emptyAvatar } alt="" className={ styles.avatar } />
				</div>
			</div>

			<ul className="jp-connection-status-card--list">
				<li className="jp-connection-status-card--list-item-success">
					{ __( 'Site connected.', 'jetpack-my-jetpack' ) }&nbsp;
					<Button
						variant="link"
						weight="regular"
						onClick={ openDisconnectDialog }
						className="jp-connection__disconnect-dialog__link"
					>
						{ __( 'Disconnect', 'jetpack-my-jetpack' ) }
					</Button>
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
				</li>

				{ isUserConnected && (
					<li className="jp-connection-status-card--list-item-success">
						{ __( 'Logged in as', 'jetpack-my-jetpack' ) }{ ' ' }
						{ userConnectionData.currentUser?.wpcomUser?.display_name }
					</li>
				) }

				{ ( ! isUserConnected || ! hasConnectedOwner ) && (
					<li
						className={ `jp-connection-status-card--list-item-${
							missingConnectedOwner ? 'error' : 'info'
						}` }
					>
						{ missingConnectedOwner && __( 'Requires user connection.', 'jetpack-my-jetpack' ) }{ ' ' }
						<Button
							variant="link"
							disabled={ userIsConnecting }
							onClick={ handleConnectUser }
							className="jp-connection-status-card--btn-connect-user"
						>
							{ __( 'Connect your user account', 'jetpack-my-jetpack' ) }
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
	title: __( 'Connection', 'jetpack-my-jetpack' ),
	connectionInfoText: __(
		'Jetpack connects your site and user account to the WordPress.com cloud to provide more powerful features.',
		'jetpack-my-jetpack'
	),
	redirectUri: null,
	onConnectUser: null,
	requiresUserConnection: true,
};

export default ConnectionStatusCard;
