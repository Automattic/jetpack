import { Button, getRedirectUrl, H3, Text } from '@automattic/jetpack-components';
import {
	ManageConnectionDialog,
	useConnection,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info, check, lockOutline } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useCallback, useMemo } from 'react';
import { useAllProducts } from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useAnalytics from '../../hooks/use-analytics';
import cloud from './cloud.svg';
import emptyAvatar from './empty-avatar.svg';
import jetpackGray from './jetpack-gray.svg';
import jetpack from './jetpack.svg';
import styles from './styles.module.scss';
import type { FC, MouseEvent } from 'react';

interface ConnectionListItemProps {
	text: string;
	actionText?: string;
	onClick?: ( e: MouseEvent< HTMLButtonElement > ) => void;
	status?: 'warning' | 'error' | 'unlock' | 'success';
}

const ConnectionListItem: FC< ConnectionListItemProps > = ( {
	text,
	actionText,
	onClick,
	status = 'success',
} ) => {
	let icon = check;
	let statusStyles = '';

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
		statusStyles = styles.unlock;
	}

	return (
		<div className={ styles[ 'list-item' ] }>
			<Text className={ clsx( styles[ 'list-item-text' ], statusStyles ) }>
				<Icon icon={ icon } />
				{ text }
			</Text>
			{ actionText && (
				<Button variant="link" weight="regular" onClick={ onClick }>
					{ actionText }
				</Button>
			) }
		</div>
	);
};

interface getSiteConnectionLineDataProps {
	isRegistered: boolean;
	hasSiteConnectionBrokenModules: boolean;
	handleConnectUser: ( e: MouseEvent< HTMLButtonElement > ) => void;
	openManageSiteConnectionDialog: ( e: MouseEvent ) => void;
}

const getSiteConnectionLineData: ( props: getSiteConnectionLineDataProps ) => {
	onClick: ( e: MouseEvent< HTMLButtonElement > ) => void;
	text: string;
	actionText: string;
	status: 'warning' | 'error' | 'success';
} = ( {
	isRegistered,
	hasSiteConnectionBrokenModules,
	handleConnectUser,
	openManageSiteConnectionDialog,
} ) => {
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
			onClick: handleConnectUser,
			text: __( 'Missing site connection to enable all features.', 'jetpack-my-jetpack' ),
			actionText: __( 'Connect', 'jetpack-my-jetpack' ),
			status: 'error',
		};
	}

	return {
		onClick: handleConnectUser,
		text: __( 'Start with Jetpack.', 'jetpack-my-jetpack' ),
		actionText: __( 'Connect your site with one click', 'jetpack-my-jetpack' ),
		status: 'warning',
	};
};

interface getUserConnectionLineDataProps {
	hasProductsThatRequireUserConnection: boolean;
	hasUserConnectionBrokenModules: boolean;
	isUserConnected: boolean;
	// The user connection data from the connection package is untyped
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	userConnectionData: any;
	openManageUserConnectionDialog: ( e: MouseEvent ) => void;
	handleConnectUser: ( e: MouseEvent< HTMLButtonElement > ) => void;
}

const getUserConnectionLineData: ( props: getUserConnectionLineDataProps ) => {
	onClick: ( e: MouseEvent< HTMLButtonElement > ) => void;
	text: string;
	actionText: string;
	status: 'warning' | 'error' | 'unlock' | 'success';
} = ( {
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

	return {
		onClick: openManageUserConnectionDialog,
		actionText: __( 'Manage', 'jetpack-my-jetpack' ),
		text: sprintf(
			/* translators: first placeholder is user name, second is either the (Owner) string or an empty string */
			__( 'Connected as %1$s%2$s.', 'jetpack-my-jetpack' ),
			userConnectionData.currentUser?.wpcomUser?.display_name,
			userConnectionData.currentUser?.isMaster ? __( ' (Owner)', 'jetpack-my-jetpack' ) : ''
		),
		status: 'success',
	};
};

interface ConnectionStatusCardProps {
	apiRoot: string;
	apiNonce: string;
	redirectUri?: string;
	title?: string;
	connectionInfoText?: string;
	onDisconnected?: () => void;
	connectedPlugins?: {
		name: string;
		slug: string;
	}[];
	connectedSiteId?: number;
	context?: string;
	onConnectUser?: ( props: unknown ) => void;
}

const ConnectionStatusCard: FC< ConnectionStatusCardProps > = ( {
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
	const { isRegistered, isUserConnected, userConnectionData } = useConnection( {
		apiRoot,
		apiNonce,
		redirectUri,
		skipUserConnection: false,
		autoTrigger: false,
		from: 'my-jetpack',
	} );

	const { recordEvent } = useAnalytics();
	const [ isManageConnectionDialogOpen, setIsManageConnectionDialogOpen ] = useState( false );
	const { setConnectionStatus, setUserIsConnecting } = useDispatch( CONNECTION_STORE_ID );
	const connectUserFn = onConnectUser || setUserIsConnecting;
	const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;
	const { lifecycleStats } = getMyJetpackWindowInitialState();
	const { brokenModules } = lifecycleStats;
	const tracksEventData = useMemo( () => {
		return {
			isUserConnected: isUserConnected,
			isRegistered: isRegistered,
		};
	}, [ isUserConnected, isRegistered ] );

	const products = useAllProducts();
	const hasProductsThatRequireUserConnection =
		getProductSlugsThatRequireUserConnection( products ).length > 0;
	const hasUserConnectionBrokenModules = brokenModules.needs_user_connection.length > 0;
	const hasSiteConnectionBrokenModules = brokenModules.needs_site_connection.length > 0;

	/**
	 * Open the Manage Connection Dialog, and register the connection type as part of the Tracks event recorded
	 */
	const openManageConnectionDialog = useCallback(
		( connectionType: string ) => ( e: MouseEvent ) => {
			e && e.preventDefault();
			recordEvent( 'jetpack_myjetpack_connection_manage_dialog_click', {
				...tracksEventData,
				connectionType,
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

	const getConnectionLineStyles = () => {
		if ( isRegistered ) {
			return '';
		}

		return hasSiteConnectionBrokenModules ? styles.error : styles.warning;
	};

	const siteConnectionLineData = getSiteConnectionLineData( {
		isRegistered,
		hasSiteConnectionBrokenModules,
		handleConnectUser,
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
		<div className={ styles[ 'connection-status-card' ] }>
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
