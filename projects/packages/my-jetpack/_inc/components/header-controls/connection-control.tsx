import {
	ConnectionErrorDetails,
	getReconnectErrorMessage,
	ManageConnectionDialog,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Link, Popover, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { connectionStatusEmptyAvatar as emptyAvatar } from '../../assets/inline-svgs';
import useSitePurchases from '../../data/use-site-purchases';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useConnectionState } from '../../hooks/use-connection-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { assignLocation } from '../../hooks/use-notification-watcher/assignLocation';
import { ConnectionOwnerInfo } from '../connection-status-card/connection-owner-info';
import { ConnectionStatus } from '../connection-status-card/connection-status';
import PlanSummary from './plan-summary';
import PrimaryAction from './primary-action';
import styles from './style.module.scss';
import type { ConnectionState } from '../../hooks/use-connection-state';
import type { FC } from 'react';

const STATUS_INTENTS = {
	success: 'stable',
	neutral: 'none',
	warning: 'medium',
	error: 'high',
} as const;

/**
 * The badge text: a short "Connected" or "Not connected" for the plain connection states, else the state's own label.
 *
 * @param state - The connection state.
 * @return The badge text.
 */
function getBadgeLabel( state: ConnectionState ): string {
	if ( state.id === 'connected' || state.id === 'site-connected' ) {
		return __( 'Connected', 'jetpack-my-jetpack' );
	}

	if ( state.id === 'owner-missing' || state.id === 'user-not-connected' ) {
		return __( 'Not connected', 'jetpack-my-jetpack' );
	}

	return state.label;
}

/**
 * The shared header's connection control: the viewer's avatar opening today's Overview Connection and Plan sections.
 *
 * @return The control.
 */
const ConnectionControl: FC = () => {
	const state = useConnectionState();
	const { apiRoot, apiNonce, isUserConnected, connectedPlugins, userConnectionData } =
		useMyJetpackConnection();
	const { errorGroups, showSupportLink, connectionErrorMessage, actions, restoreConnectionError } =
		useConnectionErrorNotice( { trackingContext: 'my-jetpack-header', navigate: assignLocation } );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );
	const triggerRef = useRef< HTMLButtonElement >( null );
	const returnFocusRef = useRef( false );
	// Never stale, so opening reuses what the Overview or an earlier open loaded.
	const isAdmin = !! getMyJetpackWindowInitialState( 'userIsAdmin' );
	const { data: purchases = null, isError: hasPurchasesError } = useSitePurchases( {
		enabled: isOpen,
		staleTime: Infinity,
	} );

	// The dialog cannot open on top of the popover: close it first and hand focus over.
	const openManageDialog = useCallback( () => {
		setIsOpen( false );
		setIsDialogOpen( true );
	}, [] );
	const closeManageDialog = useCallback( () => {
		returnFocusRef.current = true;
		setIsDialogOpen( false );
	}, [] );

	// Focus the trigger once the dialog closes: the "Manage connection" link the dialog
	// would return focus to was in the popover, which is closed by then.
	useEffect( () => {
		if ( ! isDialogOpen && returnFocusRef.current ) {
			returnFocusRef.current = false;
			triggerRef.current?.focus();
		}
	}, [ isDialogOpen ] );
	const onDisconnected = useCallback( () => {
		window.location.href = getMyJetpackWindowInitialState( 'adminUrl' ) || window.location.href;
	}, [] );
	const onUnlinked = useCallback( () => window.location.reload(), [] );

	const avatar = userConnectionData?.currentUser?.wpcomUser?.avatar;
	const showAvatar = isUserConnected || state.action === 'CONNECT_USER';

	return (
		<>
			<Popover.Root open={ isOpen } onOpenChange={ setIsOpen }>
				<Popover.Trigger
					ref={ triggerRef }
					className={ styles.trigger }
					aria-label={ sprintf(
						/* translators: %s is the connection state, e.g. "Site and account connected". */
						__( 'Connection: %s', 'jetpack-my-jetpack' ),
						state.label
					) }
				>
					<img
						src={ isUserConnected && avatar ? avatar : emptyAvatar }
						alt=""
						className={ styles.avatar }
					/>
					<span className={ clsx( styles.dot, styles[ state.status ] ) } />
				</Popover.Trigger>
				<Popover.Popup positioner={ <Popover.Positioner align="end" collisionPadding={ 16 } /> }>
					<Stack direction="column" gap="lg" className={ styles.content }>
						<Stack direction="column" gap="sm" align="start">
							<Text variant="heading-md" render={ <Popover.Title /> }>
								{ __( 'Connection', 'jetpack-my-jetpack' ) }
							</Text>
							<ConnectionStatus
								status={ state.status }
								showAvatar={ showAvatar }
								className={ styles.illustration }
							/>
							<Badge intent={ STATUS_INTENTS[ state.status ] }>{ getBadgeLabel( state ) }</Badge>
							<ConnectionOwnerInfo />
							{ state.isDiagnosis && restoreConnectionError && (
								<Text variant="body-sm">
									{ getReconnectErrorMessage( restoreConnectionError ) }
								</Text>
							) }
							{ state.isDiagnosis && typeof ConnectionErrorDetails === 'function' && (
								<ConnectionErrorDetails
									variant="body-sm"
									errorGroups={ errorGroups }
									showSupportLink={ showSupportLink }
								/>
							) }
							{ state.isDiagnosis && typeof ConnectionErrorDetails !== 'function' && (
								<Text variant="body-sm">{ connectionErrorMessage }</Text>
							) }
							{ state.status !== 'success' && state.description && (
								<Text variant="body-sm">{ state.description }</Text>
							) }
							<PrimaryAction action={ state.action } repairActions={ actions } />
							{ state.manageConnection?.type === 'link' && (
								<Link href={ state.manageConnection.url }>
									{ __( 'Manage connection', 'jetpack-my-jetpack' ) }
								</Link>
							) }
							{ state.manageConnection?.type === 'dialog' && (
								<Link render={ <button type="button" onClick={ openManageDialog } /> }>
									{ __( 'Manage connection', 'jetpack-my-jetpack' ) }
								</Link>
							) }
						</Stack>
						{ ( purchases || ( hasPurchasesError && isAdmin ) ) && (
							<hr className={ styles.divider } />
						) }
						<PlanSummary purchases={ purchases } hasFailed={ hasPurchasesError } />
					</Stack>
				</Popover.Popup>
			</Popover.Root>
			{ state.manageConnection?.type === 'dialog' && (
				<ManageConnectionDialog
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					onDisconnected={ onDisconnected }
					onUnlinked={ onUnlinked }
					connectedPlugins={ connectedPlugins as { name: string; slug: string }[] }
					connectedUser={ userConnectionData }
					isOpen={ isDialogOpen }
					onClose={ closeManageDialog }
				/>
			) }
		</>
	);
};

export default ConnectionControl;
