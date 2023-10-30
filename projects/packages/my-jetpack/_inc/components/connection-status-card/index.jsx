import { Button, getRedirectUrl, H3, Text } from '@automattic/jetpack-components';
import {
	ManageConnectionDialog,
	useConnection,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info, check } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';
import cloud from './cloud.svg';
import emptyAvatar from './empty-avatar.svg';
import jetpack from './jetpack.svg';
import styles from './styles.module.scss';

const ConnectionListItem = ( { text, actionText, onClick, status } ) => (
	<div className={ styles[ 'list-item' ] }>
		<Text
			className={ classNames( styles[ 'list-item-text' ], {
				[ styles.error ]: status === 'error',
			} ) }
		>
			<Icon
				icon={ status === 'error' ? info : check }
				className={ classNames( { [ styles.info ]: status === 'error' } ) }
			/>
			{ text }
		</Text>
		{ actionText && (
			<Button variant="link" weight="regular" onClick={ onClick }>
				{ actionText }
			</Button>
		) }
	</div>
);

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
	} = props;

	const { isRegistered, isUserConnected, userConnectionData } = useConnection( {
		apiRoot,
		apiNonce,
		redirectUri,
	} );

	const [ isManageConnectionDialogOpen, setIsManageConnectionDialogOpen ] = useState( false );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( CONNECTION_STORE_ID );
	const handleConnectUser = onConnectUser || setUserIsConnecting;
	const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;

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

	const onDisconnectedCallback = useCallback(
		e => {
			e && e.preventDefault();
			setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
			onDisconnected?.();
		},
		[ onDisconnected, setConnectionStatus ]
	);

	/**
	 * Compare the two values and set IsMultidomain to true if they are the same
	 */
	const isMultidomain =
		window.myJetpackInitialState.siteSuffix !== window.myJetpackInitialState.wpcomURLSuffix;

	const isIDC = window.hasOwnProperty( 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ?? false;

	return (
		<div className={ styles[ 'connection-status-card' ] }>
			<H3>{ title }</H3>

			<Text variant="body" mb={ 3 }>
				{ `${ connectionInfoText } ` }
				<Button
					href={ getRedirectUrl( 'why-the-wordpress-com-connection-is-important-for-jetpack' ) }
					variant="link"
					weight="regular"
					isExternalLink={ true }
				>
					{ __( 'Learn more about connections', 'jetpack-my-jetpack' ) }
				</Button>
			</Text>

			<div className={ styles.status }>
				<img src={ cloud } alt="" className={ styles.cloud } />
				<div
					className={ classNames( styles.line, {
						[ styles.disconnected ]: ! isRegistered || ! isUserConnected || isIDC,
					} ) }
				/>
				<div className={ styles[ 'avatar-wrapper' ] }>
					<img src={ jetpack } alt="" className={ styles.jetpack } />
					<img
						src={ isUserConnected && avatar ? avatar : emptyAvatar }
						alt=""
						className={ styles.avatar }
					/>
				</div>
			</div>

			<div>
				{ ! isRegistered ? (
					<ConnectionListItem
						onClick={ handleConnectUser }
						text={ __( 'Jetpack is not connected.', 'jetpack-my-jetpack' ) }
						actionText={ __( 'Connect', 'jetpack-my-jetpack' ) }
						status="error"
					/>
				) : (
					<>
						{ isIDC && (
							<ConnectionListItem
								text={ __( 'This site is in Safe Mode.', 'jetpack-my-jetpack' ) }
								status="error"
							/>
						) }
						{ isMultidomain && ! isIDC && (
							<div>
								<ConnectionListItem
									text={ __( 'This site is using multiple domains.', 'jetpack-my-jetpack' ) }
								/>
								<ConnectionListItem
									onClick={ openManageConnectionDialog }
									text={ sprintf(
										/* translators: placeholder is domain name */
										__( 'Site connected as %s', 'jetpack-my-jetpack' ),
										window.myJetpackInitialState.wpcomURL
									) }
									actionText={
										isUserConnected && userConnectionData.currentUser?.isMaster
											? __( 'Manage', 'jetpack-my-jetpack' )
											: ' '
									}
								/>
							</div>
						) }
						{ ! isMultidomain && ! isIDC && (
							<ConnectionListItem
								onClick={ openManageConnectionDialog }
								text={ __( 'Site connected.', 'jetpack-my-jetpack' ) }
								actionText={
									isUserConnected && userConnectionData.currentUser?.isMaster
										? __( 'Manage', 'jetpack-my-jetpack' )
										: ' '
								}
							/>
						) }
						{ isUserConnected && ! isIDC && (
							<ConnectionListItem
								onClick={ openManageConnectionDialog }
								actionText={ __( 'Manage', 'jetpack-my-jetpack' ) }
								text={ sprintf(
									/* translators: first placeholder is user name, second is either the (Owner) string or an empty string */
									__( 'Connected as %1$s%2$s.', 'jetpack-my-jetpack' ),
									userConnectionData.currentUser?.wpcomUser?.display_name,
									userConnectionData.currentUser?.isMaster
										? __( ' (Owner)', 'jetpack-my-jetpack' )
										: ''
								) }
							/>
						) }
						{ isUserConnected &&
							userConnectionData?.connectionOwner &&
							! userConnectionData.currentUser?.isMaster &&
							! isIDC && (
								<ConnectionListItem
									text={ sprintf(
										/* translators: placeholder is the username of the Jetpack connection owner */
										__( 'Also connected: %s (Owner).', 'jetpack-my-jetpack' ),
										userConnectionData.connectionOwner
									) }
								/>
							) }
						{ ! isUserConnected && (
							<ConnectionListItem
								onClick={ handleConnectUser }
								text={ __( 'User account not connected.', 'jetpack-my-jetpack' ) }
								actionText={ __( 'Connect', 'jetpack-my-jetpack' ) }
								status="error"
							/>
						) }
					</>
				) }
			</div>

			<ManageConnectionDialog
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				onDisconnected={ onDisconnectedCallback }
				connectedPlugins={ connectedPlugins }
				connectedSiteId={ connectedSiteId }
				connectedUser={ userConnectionData }
				isOpen={ isManageConnectionDialogOpen }
				onClose={ closeManageConnectionDialog }
				context={ context }
			/>
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
