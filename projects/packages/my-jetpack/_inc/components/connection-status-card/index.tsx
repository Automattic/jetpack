import { Button, getRedirectUrl, H3, Text } from '@automattic/jetpack-components';
import { ManageConnectionDialog, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info, check, lockOutline } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useCallback, useMemo } from 'react';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useAnalytics from '../../hooks/use-analytics';
import useConnectSite from '../../hooks/use-connect-site';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import cloud from './cloud.svg';
import emptyAvatar from './empty-avatar.svg';
import jetpackGray from './jetpack-gray.svg';
import jetpack from './jetpack.svg';
import styles from './styles.module.scss';
import type {
	ConnectionListItemType,
	getSiteConnectionLineDataType,
	getUserConnectionLineDataType,
	ConnectionStatusCardType,
	ConnectionItemButtonType,
} from './types';
import type { MouseEvent } from 'react';

const ConnectionListItem: ConnectionListItemType = ( {
	text,
	actionText,
	onClick,
	status = 'success',
} ) => {
	let icon = check;
	let statusStyles = '';

	if ( status === 'info' ) {
		icon = null;
		statusStyles = '';
	}

	if ( status === 'success' ) {
		icon = check;
		statusStyles = styles.success;
	}

	if ( status === 'error' ) {
		icon = info;
		statusStyles = styles.error;
	}

	if ( status === 'warning' ) {
		icon = info;
		statusStyles = styles.warning;
	}

	if ( status === 'unlock' ) {
		icon = lockOutline;
		statusStyles = '';
	}

	return (
		<div className={ styles[ 'list-item' ] }>
			<Text className={ clsx( styles[ 'list-item-text' ], statusStyles ) }>
				{ icon && <Icon icon={ icon } /> }
				{ text }
			</Text>
			{ actionText && status !== 'success' && (
				<ConnectionItemButton actionText={ actionText } onClick={ onClick } />
			) }
		</div>
	);
};

const ConnectionItemButton: ConnectionItemButtonType = ( { actionText, onClick } ) => {
	return (
		<Button variant="link" weight="regular" onClick={ onClick }>
			{ actionText }
		</Button>
	);
};

const getSiteConnectionLineData: getSiteConnectionLineDataType = ( {
	isRegistered,
	hasSiteConnectionBrokenModules,
	handleConnectSite,
	siteIsRegistering,
	openManageSiteConnectionDialog,
} ) => {
	if ( siteIsRegistering ) {
		return {
			text: __( 'Connecting your site…', 'jetpack-my-jetpack' ),
			status: 'info',
		};
	}

	if ( isRegistered ) {
		return {
			onClick: openManageSiteConnectionDialog,
			text: __( 'Site connected.', 'jetpack-my-jetpack' ),
			actionText: __( 'Manage', 'jetpack-my-jetpack' ),
			status: 'success',
		};
	}

	if ( hasSiteConnectionBrokenModules ) {
		return {
			onClick: handleConnectSite,
			text: __( 'Missing site connection to enable some features.', 'jetpack-my-jetpack' ),
			actionText: __( 'Connect', 'jetpack-my-jetpack' ),
			status: 'error',
		};
	}

	return {
		onClick: handleConnectSite,
		text: __( 'Start with Jetpack.', 'jetpack-my-jetpack' ),
		actionText: __( 'Connect your site with one click', 'jetpack-my-jetpack' ),
		status: 'warning',
	};
};

const getUserConnectionLineData: getUserConnectionLineDataType = ( {
	hasProductsThatRequireUserConnection,
	hasUserConnectionBrokenModules,
	isUserConnected,
	userConnectionData,
	openManageUserConnectionDialog,
	handleConnectUser,
} ) => {
	if (
		! hasProductsThatRequireUserConnection &&
		! hasUserConnectionBrokenModules &&
		! isUserConnected
	) {
		return {
			onClick: handleConnectUser,
			text: __( 'Unlock more of Jetpack', 'jetpack-my-jetpack' ),
			actionText: __( 'Sign in', 'jetpack-my-jetpack' ),
			status: 'unlock',
		};
	}

	if (
		hasProductsThatRequireUserConnection &&
		! isUserConnected &&
		! hasUserConnectionBrokenModules
	) {
		return {
			onClick: handleConnectUser,
			text: __( 'Some features require authentication.', 'jetpack-my-jetpack' ),
			actionText: __( 'Sign in', 'jetpack-my-jetpack' ),
			status: 'warning',
		};
	}

	if ( hasUserConnectionBrokenModules ) {
		return {
			onClick: handleConnectUser,
			text: __( 'Missing authentication to enable all features.', 'jetpack-my-jetpack' ),
			actionText: __( 'Sign in', 'jetpack-my-jetpack' ),
			status: 'error',
		};
	}

	let userConnectionText = null;
	if ( userConnectionData.currentUser?.isMaster ) {
		userConnectionText = userConnectionData.currentUser?.wpcomUser?.display_name
			? sprintf(
					/* translators: placeholder is user name */
					__( 'Connected as %1$s (Owner).', 'jetpack-my-jetpack' ),
					userConnectionData.currentUser?.wpcomUser?.display_name
			  )
			: __( 'User connected (Owner).', 'jetpack-my-jetpack' );
	} else {
		userConnectionText = userConnectionData.currentUser?.wpcomUser?.display_name
			? sprintf(
					/* translators: placeholder is user name */
					__( 'Connected as %1$s.', 'jetpack-my-jetpack' ),
					userConnectionData.currentUser?.wpcomUser?.display_name
			  )
			: __( 'User connected.', 'jetpack-my-jetpack' );
	}

	return {
		onClick: openManageUserConnectionDialog,
		actionText: __( 'Manage', 'jetpack-my-jetpack' ),
		text: userConnectionText,
		status: 'success',
	};
};

const ConnectionStatusCard: ConnectionStatusCardType = ( {
	apiRoot,
	apiNonce,
	redirectUri = null,
	title = __( 'Connection', 'jetpack-my-jetpack' ),
	connectionInfoText = __(
		'Jetpack connects your site and user account to the WordPress.com cloud to provide more powerful features.',
		'jetpack-my-jetpack'
	),
	onDisconnected,
	connectedPlugins,
	connectedSiteId,
	context,
	onConnectUser = null,
} ) => {
	const { isRegistered, isUserConnected, userConnectionData } = useMyJetpackConnection( {
		redirectUri,
	} );
	const { siteIsRegistering } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri,
	} );
	const { lifecycleStats } = getMyJetpackWindowInitialState();
	const { recordEvent } = useAnalytics();
	const [ isManageConnectionDialogOpen, setIsManageConnectionDialogOpen ] = useState( false );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( CONNECTION_STORE_ID );
	const connectUserFn = onConnectUser || setUserIsConnecting;
	const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;
	const { brokenModules } = lifecycleStats || {};
	const products = useAllProducts();
	const hasProductsThatRequireUserConnection =
		getProductSlugsThatRequireUserConnection( products ).length > 0;
	const hasUserConnectionBrokenModules = brokenModules?.needs_user_connection.length > 0;
	const hasSiteConnectionBrokenModules = brokenModules?.needs_site_connection.length > 0;
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
	 * Open the Manage User Connection Dialog.
	 */
	const openManageUserConnectionDialog = openManageConnectionDialog( 'user' );

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

	const onLearnMoreClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_connection_learnmore_link_click', tracksEventData );
	}, [ recordEvent, tracksEventData ] );

	const handleConnectUser = useCallback(
		( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			recordEvent( 'jetpack_myjetpack_connection_connect_user_click', tracksEventData );
			connectUserFn();
		},
		[ connectUserFn, recordEvent, tracksEventData ]
	);

	const { connectSite: handleConnectSite } = useConnectSite( {
		tracksInfo: {
			event: 'jetpack_myjetpack_connection_connect_site',
			properties: tracksEventData,
		},
	} );

	const getConnectionLineStyles = () => {
		if ( isRegistered ) {
			return '';
		}

		return hasSiteConnectionBrokenModules ? styles.error : styles.warning;
	};

	const siteConnectionLineData = getSiteConnectionLineData( {
		isRegistered,
		hasSiteConnectionBrokenModules,
		handleConnectSite,
		siteIsRegistering,
		openManageSiteConnectionDialog,
	} );

	const userConnectionLineData = getUserConnectionLineData( {
		hasProductsThatRequireUserConnection,
		hasUserConnectionBrokenModules,
		isUserConnected,
		userConnectionData,
		openManageUserConnectionDialog,
		handleConnectUser,
	} );

	return (
		<div id="dylan" className={ styles[ 'connection-status-card' ] }>
			<H3>{ title }</H3>

			<Text variant="body" mb={ 3 }>
				{ `${ connectionInfoText } ` }
				<Button
					href={ getRedirectUrl( 'why-the-wordpress-com-connection-is-important-for-jetpack' ) }
					variant="link"
					weight="regular"
					isExternalLink={ true }
					onClick={ onLearnMoreClick }
				>
					{ __( 'Learn more about connections', 'jetpack-my-jetpack' ) }
				</Button>
			</Text>

			<div className={ styles.status }>
				<img src={ cloud } alt="" className={ styles.cloud } />
				<div className={ clsx( styles.line, getConnectionLineStyles() ) } />
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
				{ siteConnectionLineData?.status === 'success' && siteConnectionLineData?.actionText && (
					<div className={ styles[ 'connect-action' ] }>
						<ConnectionItemButton
							onClick={ siteConnectionLineData?.onClick }
							actionText={ siteConnectionLineData?.actionText }
						/>
					</div>
				) }
			</div>

			<div>
				{ <ConnectionListItem { ...siteConnectionLineData } /> }
				{ isRegistered && <ConnectionListItem { ...userConnectionLineData } /> }
				{ isUserConnected &&
					userConnectionData?.connectionOwner &&
					! userConnectionData.currentUser?.isMaster && (
						<ConnectionListItem
							text={ sprintf(
								/* translators: placeholder is the username of the Jetpack connection owner */
								__( 'Also connected: %s (Owner).', 'jetpack-my-jetpack' ),
								userConnectionData.connectionOwner
							) }
						/>
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

export default ConnectionStatusCard;
