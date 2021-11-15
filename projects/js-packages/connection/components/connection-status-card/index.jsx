/**
 * External dependencies
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import restApi from '@automattic/jetpack-api';
import { useSelect, useDispatch } from '@wordpress/data';

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
		connectedPlugins,
	} = props;

	const [ isFetchingConnectionData, setIsFetchingConnectionData ] = useState( false );
	const [ connectedSiteData, setConnectedSiteData ] = useState( {} );
	const [ connectedUserData, setConnectedUserData ] = useState( {} );
	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );
	const userIsConnecting = useSelect( select => select( STORE_ID ).getUserIsConnecting(), [] );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( STORE_ID );

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

	/**
	 * Fetch the site data on mount.
	 * To be only run once.
	 * Site ID is used in the disconnection flow for the optional user survey.
	 */
	useEffect( () => {
		restApi
			.fetchSiteData()
			.then( response => {
				setConnectedSiteData( response );
			} )
			.catch( error => {
				throw error;
			} );
	}, [ setConnectedSiteData ] );

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
					<Button
						variant="link"
						onClick={ openDisconnectDialog }
						className="jp-connection__disconnect-dialog__link"
					>
						{ __( 'Disconnect', 'jetpack' ) }
					</Button>
					<DisconnectDialog
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						onDisconnected={ onDisconnectedCallback }
						connectedPlugins={ connectedPlugins }
						connectedSiteId={ connectedSiteData.ID ? connectedSiteData.ID : null }
						connectedUser={ connectedUserData }
						isOpen={ isDisconnectDialogOpen }
						onClose={ closeDisconnectDialog }
					/>
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
					disabled={ userIsConnecting }
					onClick={ setUserIsConnecting }
					className="jp-connection-status-card--btn-connect-user"
				>
					{ __( 'Connect your WordPress.com account', 'jetpack' ) }
				</Button>
			) }

			{ userIsConnecting && <ConnectUser redirectUri={ redirectUri } /> }
		</div>
	);
};

ConnectionStatusCard.propTypes = {
	/** API root URL, required. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce, required. */
	apiNonce: PropTypes.string.isRequired,
	/** Whether a site level connection has already been established, required. If not, the component will not render. */
	isRegistered: PropTypes.bool.isRequired,
	/** Whether the current user has connected their WordPress.com account, required. */
	isUserConnected: PropTypes.bool.isRequired,
	/** The redirect admin URI after the user has connected their WordPress.com account. */
	redirectUri: PropTypes.string.isRequired,
	/** An object of the plugins currently using the Jetpack connection. */
	connectedPlugins: PropTypes.object,
	/** The Card title. */
	title: PropTypes.string,
	/** The text that will be displayed under the title, containing info how to leverage the connection. */
	connectionInfoText: PropTypes.string,
	/** The callback to be called upon disconnection success. */
	onDisconnected: PropTypes.func,
	/** The base URL of the asset folder for the plugin using this component ( needed for inclusion of images ). */
	assetBaseUrl: PropTypes.string,
};

ConnectionStatusCard.defaultProps = {
	title: __( 'Connection', 'jetpack' ),
	connectionInfoText: __(
		'Leverages the Jetpack Cloud for more features on your side.',
		'jetpack'
	),
};

export default ConnectionStatusCard;
