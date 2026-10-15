import {
	ConnectionErrorDetails,
	getUserConnectionUrl,
	ManageConnectionDialog,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import { getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { caution, connection, error as errorIcon, offline } from '@wordpress/icons';
import { Badge, Button, Icon, Link, Popover, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useConnectionState } from '../../hooks/use-connection-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { assignLocation } from '../../hooks/use-notification-watcher/assignLocation';
import getManageYourPlanUrl from '../../utils/get-manage-your-plan-url';
import styles from './style.module.scss';
import useSitePurchases from './use-site-purchases';
import type { Purchase } from '../../data/types';
import type { ConnectionState } from '../../hooks/use-connection-state';
import type { FC } from 'react';

const STATUS_ICONS = {
	success: connection,
	neutral: connection,
	warning: caution,
	error: errorIcon,
};

const STATUS_INTENTS = {
	success: 'stable',
	neutral: 'none',
	warning: 'medium',
	error: 'high',
} as const;

/**
 * The site's plans, as the Overview's Plan section names them.
 *
 * @param props           - Component props.
 * @param props.purchases - The site's purchases, or null until they load.
 * @return The plan names and a link to manage them, or nothing until they load.
 */
const PlanSummary: FC< { purchases: Purchase[] | null } > = ( { purchases } ) => {
	if ( ! purchases ) {
		return null;
	}

	return (
		<Stack direction="column" gap="xs">
			<Text variant="heading-sm">{ __( 'Plan', 'jetpack-my-jetpack' ) }</Text>
			{ purchases.length ? (
				purchases.map( purchase => (
					<Text key={ purchase.ID } variant="body-md">
						{ purchase.product_name }
					</Text>
				) )
			) : (
				<Text variant="body-md">
					{ __( 'Jetpack Essentials', 'jetpack-my-jetpack' ) }
					<br />
					{ __( 'Free', 'jetpack-my-jetpack' ) }
				</Text>
			) }
			{ purchases.length > 0 && !! getMyJetpackWindowInitialState( 'userIsAdmin' ) && (
				<Link openInNewTab href={ getManageYourPlanUrl() }>
					{ _n( 'Manage your plan', 'Manage your plans', purchases.length, 'jetpack-my-jetpack' ) }
				</Link>
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
	const connectUser = useCallback( () => {
		window.location.href = getUserConnectionUrl();
	}, [] );

	if ( action === 'CONNECT_USER' ) {
		return (
			<Button variant="solid" size="compact" onClick={ connectUser }>
				{ __( 'Connect my account', 'jetpack-my-jetpack' ) }
			</Button>
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
 * The shared header's connection control: the connection state, its fix, and the site's plan.
 *
 * @return The control.
 */
const ConnectionControl: FC = () => {
	const state = useConnectionState();
	const { apiRoot, apiNonce, isSiteConnected, connectedPlugins, userConnectionData } =
		useMyJetpackConnection();
	const { errorGroups, showSupportLink, connectionErrorMessage, actions } =
		useConnectionErrorNotice( { trackingContext: 'my-jetpack-header', navigate: assignLocation } );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );
	// Held here, not in the popup: its content unmounts on close and would refetch on every open.
	const { purchases } = useSitePurchases( isOpen && isSiteConnected );

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

	const icon = state.id === 'offline' ? offline : STATUS_ICONS[ state.status ];

	return (
		<>
			<Popover.Root open={ isOpen } onOpenChange={ setIsOpen }>
				<Popover.Trigger
					render={ <Button variant="minimal" size="compact" /> }
					aria-label={ sprintf(
						/* translators: %s is the connection state, e.g. "Site and account connected". */
						__( 'Connection: %s', 'jetpack-my-jetpack' ),
						state.label
					) }
				>
					<Icon icon={ icon } size={ 24 } />
				</Popover.Trigger>
				<Popover.Popup>
					<Stack direction="column" gap="md" className={ styles.content }>
						<Popover.Title>{ __( 'Connection', 'jetpack-my-jetpack' ) }</Popover.Title>
						<Stack direction="column" gap="sm" align="start">
							<Badge intent={ STATUS_INTENTS[ state.status ] }>{ state.label }</Badge>
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
							{ state.description && <Text variant="body-sm">{ state.description }</Text> }
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
