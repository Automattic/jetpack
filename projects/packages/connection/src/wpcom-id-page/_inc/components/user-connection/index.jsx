import {
	useConnection,
	CONNECTION_STORE_ID,
	ManageConnectionDialog,
} from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';

/**
 * Open the WordPress.com authorize URL in a popup window.
 *
 * @param {string} url - The authorization URL.
 */
function openAuthPopup( url ) {
	window.open( url, 'wpcom-connect', 'width=600,height=700,menubar=no,toolbar=no,location=yes' );
}

/**
 * User Connection section showing the current connected user and connect buttons.
 *
 * @param {object} props                 - Component props.
 * @param {object} props.initialState    - Localized initial state from PHP.
 * @param {object} props.connectionState - JP_CONNECTION_INITIAL_STATE data.
 * @return {import('react').ReactNode} The rendered component.
 */
export default function UserConnection( { initialState, connectionState } ) {
	const userConnectionData = connectionState?.userConnectionData || {};
	const currentUser = userConnectionData?.currentUser || {};
	const wpcomUser = currentUser?.wpcomUser || {};

	const {
		handleRegisterSite,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
		connectedPlugins,
	} = useConnection( {
		registrationNonce: initialState?.registrationNonce,
		apiRoot: initialState?.apiRoot,
		apiNonce: initialState?.apiNonce,
		redirectUri: 'admin.php?page=wpcom-id',
		from: 'wpcom-id',
		skipUserConnection: true,
	} );

	const { connectUser, setConnectionStatus } = useDispatch( CONNECTION_STORE_ID );

	const [ isManageDialogOpen, setIsManageDialogOpen ] = useState( false );

	const handleConnect = useCallback(
		e => {
			e?.preventDefault();

			if ( isRegistered ) {
				connectUser( {
					from: 'wpcom-id',
					redirectFunc: openAuthPopup,
				} );
				return;
			}

			handleRegisterSite( e ).then( () => {
				connectUser( {
					from: 'wpcom-id',
					redirectFunc: openAuthPopup,
				} );
			} );
		},
		[ isRegistered, handleRegisterSite, connectUser ]
	);

	const openManageDialog = useCallback( e => {
		e?.preventDefault();
		setIsManageDialogOpen( true );
	}, [] );

	const closeManageDialog = useCallback( e => {
		e?.preventDefault();
		setIsManageDialogOpen( false );
	}, [] );

	const onDisconnected = useCallback( () => {
		setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
	}, [ setConnectionStatus ] );

	const onUnlinked = useCallback( () => {
		setConnectionStatus( { isUserConnected: false } );
	}, [ setConnectionStatus ] );

	const isConnecting = siteIsRegistering || userIsConnecting;
	const connectLabel = __( 'Connect', 'jetpack-connection' );
	const connectingLabel = __( 'Connecting…', 'jetpack-connection' );

	return (
		<div className="wpcom-id-page__section">
			<h2>{ __( 'User Connection', 'jetpack-connection' ) }</h2>

			{ isUserConnected && wpcomUser?.login ? (
				<>
					<div className="wpcom-id-page__user-card">
						{ currentUser?.gravatar && (
							<img
								src={ currentUser.gravatar }
								alt={ wpcomUser.display_name || wpcomUser.login }
								width="48"
								height="48"
							/>
						) }
						<div>
							<strong>{ wpcomUser.display_name || wpcomUser.login }</strong>
							{ currentUser?.isMaster && (
								<span> — { __( 'Connection owner', 'jetpack-connection' ) }</span>
							) }
						</div>
					</div>

					<dl className="wpcom-id-page__user-info">
						<dt>{ __( 'WordPress.com Username', 'jetpack-connection' ) }</dt>
						<dd>{ wpcomUser.login }</dd>

						<dt>{ __( 'Email', 'jetpack-connection' ) }</dt>
						<dd>{ wpcomUser.email || '—' }</dd>

						<dt>{ __( 'WordPress.com User ID', 'jetpack-connection' ) }</dt>
						<dd>{ wpcomUser.ID || '—' }</dd>

						<dt>{ __( 'Local User ID', 'jetpack-connection' ) }</dt>
						<dd>{ currentUser?.id || '—' }</dd>
					</dl>
				</>
			) : (
				<p>
					{ __(
						'No user is currently connected to WordPress.com on this site.',
						'jetpack-connection'
					) }
				</p>
			) }

			<div className="wpcom-id-page__actions">
				{ ( ! isRegistered || ! isUserConnected ) && (
					<button
						type="button"
						className="button button-primary"
						onClick={ handleConnect }
						disabled={ isConnecting }
					>
						{ isConnecting ? connectingLabel : connectLabel }
					</button>
				) }
				{ registrationError && (
					<p className="notice notice-error inline">
						{ registrationError.message || __( 'Connection failed.', 'jetpack-connection' ) }
					</p>
				) }
				{ isRegistered && isUserConnected && (
					<button type="button" className="button" onClick={ openManageDialog }>
						{ __( 'Manage connection', 'jetpack-connection' ) }
					</button>
				) }
			</div>

			<ManageConnectionDialog
				apiRoot={ initialState?.apiRoot }
				apiNonce={ initialState?.apiNonce }
				onDisconnected={ onDisconnected }
				onUnlinked={ onUnlinked }
				connectedPlugins={ connectedPlugins }
				connectedSiteId={ initialState?.blogId }
				connectedUser={ userConnectionData }
				isOpen={ isManageDialogOpen }
				onClose={ closeManageDialog }
				context="wpcom-id"
			/>
		</div>
	);
}
