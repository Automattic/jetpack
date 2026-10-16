import {
	ConnectionErrorDetails,
	getUserConnectionUrl,
	ManageConnectionDialog,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import { getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Link, Popover, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { connectionStatusEmptyAvatar as emptyAvatar } from '../../assets/inline-svgs';
import { MyJetpackRoutes } from '../../constants';
import useSitePurchases from '../../data/use-site-purchases';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useConnectionState } from '../../hooks/use-connection-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { assignLocation } from '../../hooks/use-notification-watcher/assignLocation';
import { ConnectionOwnerInfo } from '../connection-status-card/connection-owner-info';
import { ConnectionStatus } from '../connection-status-card/connection-status';
import { PlanLogo, PlanSection, PlanSectionFooter } from '../plans-section';
import styles from './style.module.scss';
import type { Purchase } from '../../data/types';
import type { ConnectionState } from '../../hooks/use-connection-state';
import type { FC } from 'react';

// Tells the plan links' Tracks events apart from the same links on the Overview.
const HEADER_TRACKS_PROPERTIES = { location: 'header' };

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
 * The site's plans, laid out like the Overview's Plan section.
 *
 * @param props           - Component props.
 * @param props.purchases - The site's purchases, or null until they load.
 * @return The plans and their links, or nothing until they load.
 */
const PlanSummary: FC< { purchases: Purchase[] | null } > = ( { purchases } ) => {
	if ( ! purchases ) {
		return null;
	}

	const hasComplete =
		!! getMyJetpackWindowInitialState( 'products' )?.items?.complete?.has_paid_plan_for_product;

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-md">
				{ _n( 'Your plan', 'Your plans', purchases.length || 1, 'jetpack-my-jetpack' ) }
			</Text>
			{ purchases.length ? (
				purchases.map( purchase => (
					<Stack key={ purchase.ID } direction="row" gap="sm" align="start">
						<PlanLogo />
						<PlanSection purchase={ purchase } />
					</Stack>
				) )
			) : (
				<Stack direction="row" gap="sm" align="start">
					<PlanLogo />
					<Text variant="body-md">
						{ __( 'Jetpack Essentials', 'jetpack-my-jetpack' ) }
						<br />
						{ __( 'Free', 'jetpack-my-jetpack' ) }
					</Text>
				</Stack>
			) }
			{ !! getMyJetpackWindowInitialState( 'userIsAdmin' ) && (
				<PlanSectionFooter
					numberOfPurchases={ purchases.length }
					hasComplete={ hasComplete }
					tracksProperties={ HEADER_TRACKS_PROPERTIES }
				/>
			) }
		</Stack>
	);
};

/**
 * The state's one action, as the Overview's connection card offers it.
 *
 * @param props               - Component props.
 * @param props.action        - The action from the connection state.
 * @param props.repairActions - The connection package's own fixes for a live error.
 * @return The action, or null when the state has none the header can run.
 */
const PrimaryAction: FC< {
	action: ConnectionState[ 'action' ];
	repairActions: ReturnType< typeof useConnectionErrorNotice >[ 'actions' ];
} > = ( { action, repairActions } ) => {
	if ( action === 'CONNECT_USER' ) {
		return (
			<Link href={ getUserConnectionUrl() }>
				{ __( 'Connect my account', 'jetpack-my-jetpack' ) }
			</Link>
		);
	}

	if ( action === 'CONNECT_SITE' ) {
		return (
			<Link href={ getMyJetpackUrl( `#${ MyJetpackRoutes.Connection }` ) }>
				{ __( 'Connect site', 'jetpack-my-jetpack' ) }
			</Link>
		);
	}

	if ( action === 'REPAIR' ) {
		return (
			<Stack direction="row" wrap="wrap" gap="sm">
				{ repairActions.map( ( errorAction, index ) => (
					<Button
						key={ errorAction.label }
						variant={ index === 0 ? 'solid' : 'outline' }
						size="compact"
						onClick={ errorAction.onClick }
						loading={ errorAction.isLoading }
						loadingAnnouncement={
							errorAction.loadingText || __( 'Loading…', 'jetpack-my-jetpack' )
						}
					>
						{ errorAction.label }
					</Button>
				) ) }
			</Stack>
		);
	}

	return null;
};

/**
 * The shared header's connection control: the viewer's avatar opening today's Overview Connection and Plan sections.
 *
 * @return The control.
 */
const ConnectionControl: FC = () => {
	const state = useConnectionState();
	const { apiRoot, apiNonce, isUserConnected, connectedPlugins, userConnectionData } =
		useMyJetpackConnection();
	const { errorGroups, showSupportLink, connectionErrorMessage, actions } =
		useConnectionErrorNotice( { trackingContext: 'my-jetpack-header', navigate: assignLocation } );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );
	// Never stale, so opening reuses what the Overview or an earlier open loaded.
	const { data: purchases = null } = useSitePurchases( {
		enabled: isOpen,
		staleTime: Infinity,
	} );

	// The dialog cannot open on top of the popover: close it first and hand focus over.
	const openManageDialog = useCallback( () => {
		setIsOpen( false );
		setIsDialogOpen( true );
	}, [] );
	const closeManageDialog = useCallback( () => setIsDialogOpen( false ), [] );
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
				<Popover.Popup>
					<Stack direction="column" gap="md" className={ styles.content }>
						<Stack direction="column" gap="sm" align="start">
							<Text variant="heading-md" render={ <Popover.Title /> }>
								{ __( 'Connection', 'jetpack-my-jetpack' ) }
							</Text>
							<ConnectionStatus status={ state.status } showAvatar={ showAvatar } />
							<Badge intent={ STATUS_INTENTS[ state.status ] }>{ getBadgeLabel( state ) }</Badge>
							<ConnectionOwnerInfo />
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
						{ purchases && <hr className={ styles.divider } /> }
						<PlanSummary purchases={ purchases } />
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
