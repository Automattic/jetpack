import {
	CONNECTION_STORE_ID,
	ConnectionErrorDetails,
	getReconnectErrorMessage,
	ManageConnectionDialog,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import { currentUserCan, isWoASite } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, error as errorIcon } from '@wordpress/icons';
import { Button as UIButton, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import {
	connectionStatusCloud as cloud,
	connectionStatusEmptyAvatar as emptyAvatar,
	connectionStatusJetpackGray as jetpackGray,
	connectionStatusJetpack as jetpack,
} from '../../assets/inline-svgs';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useAnalytics from '../../hooks/use-analytics';
import useConnectionErrorTracking from '../../hooks/use-connection-error-tracking';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { assignLocation } from '../../hooks/use-notification-watcher/assignLocation';
import { ConnectionOwnerInfo } from './connection-owner-info';
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
	onUnlinked,
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
	 * Open the Manage Connection Dialog, and register the connection type and the
	 * control that opened it as part of the Tracks event recorded.
	 */
	const openManageConnectionDialog = useCallback(
		( connectionType: string, trigger: 'heading' | 'action' ) => ( e: MouseEvent ) => {
			e && e.preventDefault();
			recordEvent( 'jetpack_myjetpack_connection_manage_dialog_click', {
				...tracksEventData,
				connection_type: connectionType,
				trigger,
			} );
			setIsManageConnectionDialogOpen( true );
		},
		[ recordEvent, setIsManageConnectionDialogOpen, tracksEventData ]
	);

	/**
	 * Open the Manage Site Connection Dialog from the status heading.
	 */
	const openManageSiteConnectionFromHeading = openManageConnectionDialog( 'site', 'heading' );

	/**
	 * Open the Manage Site Connection Dialog from the named action beneath a fault.
	 */
	const openManageSiteConnectionFromAction = openManageConnectionDialog( 'site', 'action' );

	/**
	 * Close the Manage Connection Dialog.
	 */
	const closeManageConnectionDialog = useCallback(
		( e?: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			setIsManageConnectionDialogOpen( false );
		},
		[ setIsManageConnectionDialogOpen ]
	);

	const onDisconnectedCallback = useCallback(
		( e?: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
			onDisconnected?.();
		},
		[ onDisconnected, setConnectionStatus ]
	);

	const onUnlinkedCallback = useCallback(
		( e?: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			setConnectionStatus( { isUserConnected: false } );
			onUnlinked?.();
		},
		[ onUnlinked, setConnectionStatus ]
	);

	const handleConnectUser = useCallback(
		( e: MouseEvent< HTMLButtonElement > ) => {
			e && e.preventDefault();
			recordEvent( 'jetpack_myjetpack_connection_connect_user_click', tracksEventData );
			connectUserFn();
		},
		[ connectUserFn, recordEvent, tracksEventData ]
	);

	// The same package data the My Jetpack connection error notice runs on, so the
	// card describes a live error in the notice's words and offers its CTAs, rather
	// than a second account of the same fault.
	const connectionErrorTrackingCallback = useConnectionErrorTracking();
	const {
		hasConnectionError,
		severity,
		errorTitle,
		errorGroups,
		showSupportLink,
		actions,
		restoreConnectionError,
		trackNoticeLinkClick,
		trackSupportLinkClick,
	} = useConnectionErrorNotice( {
		trackingCallback: connectionErrorTrackingCallback,
		trackingContext: 'my-jetpack-connection-card',
		navigate: assignLocation,
	} );

	const state = useConnectionState( { hasConnectionError, severity, errorTitle } );

	// Prevent opening dialog for WoA sites when user is connection owner
	const isConnectionOwner = userConnectionData.currentUser?.isMaster;
	const shouldPreventDialog = isWoASite() && isConnectionOwner;
	const allowDisconnect =
		( currentUserCan( 'manage_options' ) || isUserConnected ) &&
		! shouldPreventDialog &&
		! ( isWoASite() && ! isUserConnected );

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
					{ ( state.isDiagnosis || hasConnectionError || ! isRegistered ) && (
						<Icon
							className={ clsx( styles[ 'state-icon' ], styles[ state.status ] ) }
							icon={ errorIcon }
							size={ 24 }
						/>
					) }
					{ /* While the label diagnoses a fault it is text only: a chevron there would
					     promise a fix and open the disconnect dialog. Manage connection moves
					     down into the named actions instead. */ }
					{ state.isDiagnosis ? (
						state.label
					) : (
						<Button
							variant="tertiary"
							onClick={ openManageSiteConnectionFromHeading }
							disabled={ ! allowDisconnect }
						>
							{ state.label }
							{ allowDisconnect && (
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
							) }
						</Button>
					) }
				</h4>
				{ state.isDiagnosis ? (
					<Stack direction="column" gap="md">
						<Stack direction="column" gap="xs" className={ styles.details }>
							{ restoreConnectionError && (
								<Text variant="body-sm">
									{ getReconnectErrorMessage( restoreConnectionError ) }
								</Text>
							) }
							{ /* The card's body copy is a step below a notice's, so the shared
							     description is asked for at the card's size. */ }
							<ConnectionErrorDetails
								variant="body-sm"
								errorGroups={ errorGroups }
								showSupportLink={ showSupportLink }
								onNoticeLinkClick={ trackNoticeLinkClick }
								onSupportLinkClick={ trackSupportLinkClick }
							/>
						</Stack>
						{ /* Repairing the connection is the whole point of the card in this state,
						     so the package's repair is a button with the card's own action as a
						     link beneath it. The lead is the first action rather than a `primary`
						     one: the package leaves `variant` unset on the common restore case. */ }
						<Stack direction="column" align="start" gap="sm">
							{ actions.map( ( action, index ) => (
								<UIButton
									key={ action.label }
									variant={ index === 0 ? 'solid' : 'outline' }
									onClick={ action.onClick }
									loading={ action.isLoading }
									loadingAnnouncement={ action.loadingText }
								>
									{ action.label }
								</UIButton>
							) ) }
							{ allowDisconnect ? (
								<Button variant="link" onClick={ openManageSiteConnectionFromAction }>
									{ __( 'Manage connection', 'jetpack-my-jetpack' ) }
								</Button>
							) : null }
						</Stack>
					</Stack>
				) : (
					<div>
						<Text variant="body-md" className={ styles.description }>
							{ state.description }
						</Text>
						<Stack direction="row" wrap="wrap" align="center" gap="lg">
							{ state.action === 'CONNECT_USER' ? (
								<Button variant="link" onClick={ handleConnectUser }>
									{ __( 'Connect my account', 'jetpack-my-jetpack' ) }
								</Button>
							) : null }
						</Stack>
					</div>
				) }
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
