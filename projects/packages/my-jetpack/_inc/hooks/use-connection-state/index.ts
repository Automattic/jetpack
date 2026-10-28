import { CONNECTION_STORE_ID, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { currentUserCan, isWoASite } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../use-my-jetpack-connection';

/**
 * Which of the header's connection states the site is in (JETPACK-2910).
 */
export type ConnectionStateId =
	| 'unknown'
	| 'offline'
	| 'safe-mode'
	| 'site-not-connected'
	| 'error'
	| 'owner-missing'
	| 'user-not-connected'
	| 'site-connected'
	| 'connected';

/**
 * What "Manage connection" does: link to the Connectors screen, or open the connection dialog before WordPress 7.0.
 */
export type ManageConnection = { type: 'link'; url: string } | { type: 'dialog' };

export type ConnectionState = {
	id: ConnectionStateId;
	label: string;
	/** The card's own copy. Absent while an error is on screen: the package's words describe it instead. */
	description?: string;
	/** The primary action. REPAIR means the connection package's own error actions. */
	action?: 'CONNECT_USER' | 'CONNECT_SITE' | 'REPAIR' | 'RESOLVE_SAFE_MODE';
	status: 'error' | 'warning' | 'success' | 'neutral';
	/** True only when the label is a diagnosis rather than a standing. */
	isDiagnosis?: boolean;
	/** The secondary link, or null where nothing may change the connection. */
	manageConnection: ManageConnection | null;
};

// The connection package's store is plain JS with no types, so describe the one selector read here.
type StoreSelector = (
	storeId: string
) => Record< 'getConnectionStatus', () => Record< string, unknown > >;

/**
 * What "Manage connection" does on this site, for this viewer.
 *
 * @return The Connectors screen when WordPress has one and the viewer can open it, else the dialog.
 */
export function getManageConnection(): ManageConnection {
	const url = getMyJetpackWindowInitialState()?.header?.connectorsUrl;

	// The Connectors screen needs manage_options, so anyone else gets the dialog.
	return url && currentUserCan( 'manage_options' ) ? { type: 'link', url } : { type: 'dialog' };
}

/**
 * Whether the viewer may manage the connection: the rule the Overview card applies to its own Manage connection.
 *
 * @param isUserConnected   - Whether the viewer's account is connected.
 * @param isConnectionOwner - Whether the viewer owns the connection.
 * @return Whether to offer Manage connection.
 */
export function canManageConnection(
	isUserConnected: boolean,
	isConnectionOwner: boolean
): boolean {
	// On WoA, neither the connection owner nor a viewer without a connected account gets it.
	if ( isWoASite() && ( isConnectionOwner || ! isUserConnected ) ) {
		return false;
	}

	return currentUserCan( 'manage_options' ) || isUserConnected;
}

/**
 * The connection state of the site and the current user, shared by the Overview card and the header.
 *
 * Reads only what the page was rendered with and the connection store, so it sends no request.
 *
 * @param options                 - Options.
 * @param options.skipSafeMode    - Report the connection itself during Safe Mode instead of Safe Mode.
 * @param options.skipOfflineMode - Report the connection itself in offline mode instead of offline mode.
 * @return The connection state
 */
export function useConnectionState( {
	skipSafeMode = false,
	skipOfflineMode = false,
}: { skipSafeMode?: boolean; skipOfflineMode?: boolean } = {} ): ConnectionState {
	const { isRegistered, isUserConnected, hasConnectedOwner, isOfflineMode, userConnectionData } =
		useMyJetpackConnection();
	const { isKnown, isSafeMode } = useSelect( select => {
		const status = ( select as unknown as StoreSelector )(
			CONNECTION_STORE_ID
		).getConnectionStatus();
		// getConnectionStatus() returns {} until the page's connection state is loaded into the store.
		return {
			isKnown: typeof status.isRegistered === 'boolean',
			// `isStaging` is Status::in_safe_mode(), true while an identity crisis is unresolved.
			isSafeMode: status.isStaging === true,
		};
	}, [] );
	const errorNotice = useConnectionErrorNotice();

	if ( ! isKnown ) {
		return {
			id: 'unknown',
			label: __( 'Connection status unavailable', 'jetpack-my-jetpack' ),
			status: 'neutral',
			manageConnection: null,
		};
	}

	if ( isOfflineMode && ! skipOfflineMode ) {
		return {
			id: 'offline',
			label: __( 'Offline Mode', 'jetpack-my-jetpack' ),
			description: __(
				'Your site is in Offline Mode, so features that need WordPress.com are paused.',
				'jetpack-my-jetpack'
			),
			status: 'neutral',
			manageConnection: null,
		};
	}

	const manageConnection = canManageConnection(
		isUserConnected,
		!! userConnectionData?.currentUser?.isMaster
	)
		? getManageConnection()
		: null;

	if ( isSafeMode && ! skipSafeMode ) {
		return {
			id: 'safe-mode',
			label: __( 'Safe Mode', 'jetpack-my-jetpack' ),
			description: __(
				'This site appears to be a copy of another Jetpack site, so Jetpack is in Safe Mode and some features are paused.',
				'jetpack-my-jetpack'
			),
			action: 'RESOLVE_SAFE_MODE',
			status: 'warning',
			manageConnection,
		};
	}

	if ( ! isRegistered ) {
		// Reached by users who cannot connect: onboarding is skipped for them, so they land here.
		if ( ! currentUserCan( 'manage_options' ) ) {
			return {
				id: 'site-not-connected',
				label: __( 'Site not connected', 'jetpack-my-jetpack' ),
				description: __(
					'A site admin will need to connect this site to Jetpack.',
					'jetpack-my-jetpack'
				),
				status: 'error',
				manageConnection,
			};
		}

		return {
			id: 'site-not-connected',
			label: __( 'Site not connected', 'jetpack-my-jetpack' ),
			description: __( 'Connect your site with one click.', 'jetpack-my-jetpack' ),
			action: 'CONNECT_SITE',
			status: 'error',
			manageConnection,
		};
	}

	// The Connection package decides whether there is an error to show; when it says so, that is the diagnosis.
	if ( errorNotice.hasConnectionError ) {
		return {
			id: 'error',
			label: errorNotice.errorTitle,
			action: 'REPAIR',
			status: errorNotice.severity ?? 'error',
			isDiagnosis: true,
			manageConnection,
		};
	}

	if ( isUserConnected ) {
		return {
			id: 'connected',
			label: __( 'Site and account connected', 'jetpack-my-jetpack' ),
			description: __( 'Everything looks good.', 'jetpack-my-jetpack' ),
			status: 'success',
			manageConnection,
		};
	}

	// Ask for a user connection when a product that needs one has its plugin active.
	const shouldAskForUserConnection = Object.values(
		getMyJetpackWindowInitialState( 'products' )?.items ?? {}
	).some( product => product?.requires_user_connection && product.is_plugin_active );

	if ( ! shouldAskForUserConnection ) {
		return {
			id: 'site-connected',
			label: __( 'Site connected', 'jetpack-my-jetpack' ),
			description: __( 'Everything looks good.', 'jetpack-my-jetpack' ),
			status: 'success',
			manageConnection,
		};
	}

	if ( ! hasConnectedOwner ) {
		// Only an admin can take the empty owner slot.
		if ( ! currentUserCan( 'manage_options' ) ) {
			return {
				id: 'owner-missing',
				label: __( 'Site connected', 'jetpack-my-jetpack' ),
				description: __(
					'A site admin will need to connect their account before you can connect yours.',
					'jetpack-my-jetpack'
				),
				status: 'warning',
				manageConnection,
			};
		}

		return {
			id: 'owner-missing',
			label: __( 'Site connected', 'jetpack-my-jetpack' ),
			description: __( 'Connect your account to unlock all the features.', 'jetpack-my-jetpack' ),
			action: 'CONNECT_USER',
			status: 'warning',
			manageConnection,
		};
	}

	return {
		id: 'user-not-connected',
		label: __( 'Site connected', 'jetpack-my-jetpack' ),
		description: __( 'Connect your account to unlock all the features.', 'jetpack-my-jetpack' ),
		action: 'CONNECT_USER',
		status: 'warning',
		manageConnection,
	};
}
