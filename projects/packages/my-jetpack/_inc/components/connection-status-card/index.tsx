import { Text } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID, ManageConnectionDialog } from '@automattic/jetpack-connection';
import { currentUserCan } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import cloud from './cloud.svg';
import { ConnectionOwnerInfo } from './connection-owner-info';
import emptyAvatar from './empty-avatar.svg';
import jetpackGray from './jetpack-gray.svg';
import jetpack from './jetpack.svg';
import styles from './styles.module.scss';
import { useConnectionState } from './use-connection-state';
import type { ConnectionStatusCardType } from './types';
import type { MouseEvent } from 'react';

const ConnectionStatusCard: ConnectionStatusCardType = ( {
	apiRoot,
	apiNonce,
	redirectUri = null,
	title = __( 'Connection', 'jetpack-my-jetpack' ),
	onDisconnected,
	connectedPlugins,
	connectedSiteId,
	context,
	onConnectUser = null,
} ) => {
	const { isRegistered, isUserConnected, userConnectionData } = useMyJetpackConnection( {
		redirectUri,
	} );
	const { lifecycleStats } = getMyJetpackWindowInitialState();
	const { recordEvent } = useAnalytics();
	const [ isManageConnectionDialogOpen, setIsManageConnectionDialogOpen ] = useState( false );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( CONNECTION_STORE_ID );
	const connectUserFn = onConnectUser || setUserIsConnecting;
	const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;

	const { brokenModules } = lifecycleStats || {};
	const { data: products, isLoading, isError } = useAllProducts();
	const hasProductsThatRequireUserConnection = useMemo( () => {
		if ( isLoading || isError ) {
			return false;
		}
		return getProductSlugsThatRequireUserConnection( products ).length > 0;
	}, [ isLoading, isError, products ] );
	const hasUserConnectionBrokenModules = brokenModules?.needs_user_connection.length > 0;
	const tracksEventData = useMemo( () => {
		return {
			user_connection_broken_modules: brokenModules?.needs_user_connection.join( ', ' ),
			site_connection_broken_modules: brokenModules?.needs_site_connection.join( ', ' ),
		};
	}, [ brokenModules ] );

	/**
	 * Open the Manage Connection Dialog, and register the connection type as part of the Tracks event recorded
	 */
	const openManageConnectionDialog = useCallback(
		( connectionType: string ) => ( e: MouseEvent ) => {
			e && e.preventDefault();
			recordEvent( 'jetpack_myjetpack_connection_manage_dialog_click', {
				...tracksEventData,
				connection_type: connectionType,
			} );
			setIsManageConnectionDialogOpen( true );
		},
		[ recordEvent, setIsManageConnectionDialogOpen, tracksEventData ]
	);

	/**
	 * Open the Manage Site Connection Dialog.
	 */
	const openManageSiteConnectionDialog = openManageConnectionDialog( 'site' );

	/**
	 * Close the Manage Connection Dialog.
	 */
	const closeManageConnectionDialog = useCallback(
		( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			setIsManageConnectionDialogOpen( false );
		},
		[ setIsManageConnectionDialogOpen ]
	);

	const onDisconnectedCallback = useCallback(
		( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
			onDisconnected?.();
		},
		[ onDisconnected, setConnectionStatus ]
	);

	const onUnlinkedCallback = useCallback(
		( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			setConnectionStatus( { isUserConnected: false } );
			onDisconnected?.();
		},
		[ onDisconnected, setConnectionStatus ]
	);

	const handleConnectUser = useCallback(
		( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			recordEvent( 'jetpack_myjetpack_connection_connect_user_click', tracksEventData );
			connectUserFn();
		},
		[ connectUserFn, recordEvent, tracksEventData ]
	);

	const state = useConnectionState();

	const allowDisconnect = currentUserCan( 'manage_options' ) || isUserConnected;

	return (
		<section className={ styles[ 'connection-status-card' ] }>
			<h3>{ title }</h3>

			<div className={ styles.status }>
				<div className={ styles[ 'avatar-wrapper' ] }>
					<img src={ isRegistered ? jetpack : jetpackGray } alt="" className={ styles.jetpack } />
					{ ( hasProductsThatRequireUserConnection || hasUserConnectionBrokenModules ) && (
						<img
							src={ isUserConnected && avatar ? avatar : emptyAvatar }
							alt=""
							className={ styles.avatar }
						/>
					) }
				</div>
				<div className={ clsx( styles.line, styles[ state.status ] ) } />
				<img src={ cloud } alt="" className={ styles.cloud } />
			</div>

			<section className={ styles[ 'connection-state' ] }>
				<h4>
					<Button
						variant="tertiary"
						onClick={ openManageSiteConnectionDialog }
						disabled={ ! allowDisconnect }
					>
						{ state.label }
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							role="presentation"
						>
							<path
								d="M10.6004 6L9.40039 7L14.0004 12L9.40039 17L10.6004 18L16.0004 12L10.6004 6Z"
								fill="currentColor"
							/>
						</svg>
					</Button>
				</h4>
				<div>
					<Text variant="body" className={ styles.description }>
						{ state.description }
					</Text>
					{ state.action === 'CONNECT_USER' ? (
						<Button variant="link" onClick={ handleConnectUser }>
							{ __( 'Connect my account', 'jetpack-my-jetpack' ) }
						</Button>
					) : null }
				</div>
			</section>

			<ConnectionOwnerInfo />

			<ManageConnectionDialog
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				onDisconnected={ onDisconnectedCallback }
				onUnlinked={ onUnlinkedCallback }
				connectedPlugins={ connectedPlugins }
				connectedSiteId={ connectedSiteId }
				connectedUser={ userConnectionData }
				isOpen={ isManageConnectionDialogOpen }
				onClose={ closeManageConnectionDialog }
				context={ context }
			/>
		</section>
	);
};

export default ConnectionStatusCard;
