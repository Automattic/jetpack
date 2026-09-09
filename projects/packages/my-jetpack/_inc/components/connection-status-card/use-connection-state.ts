import { useConnectionStatusSummary } from '@automattic/jetpack-connection';
import { currentUserCan } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import type { ConnectionErrorScope, ConnectionErrorSeverity } from '@automattic/jetpack-connection';

export type ConnectionState = {
	label: string;
	description: string;
	action?: 'CONNECT_USER' | 'CONNECT_SITE' | 'VIEW_SITE_HEALTH';
	status: 'error' | 'warning' | 'success';
	// True only when the label is a diagnosis rather than a standing. The card then
	// stops using the label as the Manage connection trigger, so a chevron beside
	// "needs attention" can't read as "click to fix" and land on Disconnect.
	isDiagnosis?: boolean;
};

/**
 * Put My Jetpack's words to the connection standing the package reported.
 *
 * Every branch here is a diagnosis, so the caller stamps `isDiagnosis` once rather
 * than each branch repeating it.
 *
 * @param {ConnectionErrorScope}    scope    - The half of the connection at fault.
 * @param {ConnectionErrorSeverity} severity - How much of a problem it is for this viewer.
 * @return {ConnectionState} The label, description and status to render.
 */
function getConnectionErrorState(
	scope: ConnectionErrorScope,
	severity: ConnectionErrorSeverity
): Omit< ConnectionState, 'isDiagnosis' > {
	const action = currentUserCan( 'manage_options' ) ? ( 'VIEW_SITE_HEALTH' as const ) : undefined;

	switch ( scope ) {
		case 'site':
			return {
				label: __( 'Site connection needs attention', 'jetpack-my-jetpack' ),
				description: __(
					'Your site’s connection to WordPress.com isn’t working, so some features are paused.',
					'jetpack-my-jetpack'
				),
				action,
				status: severity,
			};

		case 'account':
			return {
				label: __( 'Account connection needs attention', 'jetpack-my-jetpack' ),
				description: __(
					'Your WordPress.com account connection isn’t working, so some features are paused.',
					'jetpack-my-jetpack'
				),
				action,
				status: severity,
			};

		case 'owner-account':
			return {
				label: __( 'Connection needs attention', 'jetpack-my-jetpack' ),
				description: __(
					'The connection owner needs to reconnect their account before some features work again.',
					'jetpack-my-jetpack'
				),
				action,
				status: severity,
			};

		default:
			return {
				label: __( 'Connection needs attention', 'jetpack-my-jetpack' ),
				description: __( 'There’s a problem with your Jetpack connection.', 'jetpack-my-jetpack' ),
				action,
				status: severity,
			};
	}
}

/**
 * Hook to determine the connection state of the site and user.
 *
 * @return The connection state
 */
export function useConnectionState(): ConnectionState {
	const { isRegistered, isUserConnected, hasConnectedOwner } = useMyJetpackConnection();
	const connection = useConnectionStatusSummary();

	if ( ! isRegistered ) {
		// Ideally, we should never reach this point as the status is shown only when the site is connected.
		return {
			label: __( 'Site not connected', 'jetpack-my-jetpack' ),
			description: __( 'Connect your site with one click.', 'jetpack-my-jetpack' ),
			action: 'CONNECT_SITE',
			status: 'error',
		};
	}

	// We are here, which means the site is connected.

	if ( isUserConnected ) {
		if ( connection.hasConnectionError ) {
			return {
				...getConnectionErrorState( connection.scope, connection.severity ),
				isDiagnosis: true,
			};
		}

		// If the user is connected and nothing is broken, all good!
		return {
			label: __( 'Site and account connected', 'jetpack-my-jetpack' ),
			description: __( 'Everything looks good.', 'jetpack-my-jetpack' ),
			status: 'success',
		};
	}

	// Below here the account is still to be connected, and that prompt is the most
	// useful thing the card can say — so a live error only tints the connector
	// line, and never displaces the call to action.
	const status = connection.hasConnectionError ? 'error' : 'warning';

	// If the user is not an admin, they can't connect their account unless an admin has connected their account.
	if ( ! currentUserCan( 'manage_options' ) && ! hasConnectedOwner ) {
		return {
			label: __( 'Site connected', 'jetpack-my-jetpack' ),
			description: __(
				'A site admin will need to connect their account before you can connect yours.',
				'jetpack-my-jetpack'
			),
			status,
		};
	}

	return {
		label: __( 'Site connected', 'jetpack-my-jetpack' ),
		description: __( 'Connect your account to unlock all the features.', 'jetpack-my-jetpack' ),
		action: 'CONNECT_USER',
		status,
	};
}
