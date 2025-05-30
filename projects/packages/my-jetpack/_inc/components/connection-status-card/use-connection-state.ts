import { currentUserCan } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';

export type ConnectionState = {
	label: string;
	description: string;
	action?: 'CONNECT_USER' | 'CONNECT_SITE';
	status: 'error' | 'warning' | 'success';
};

/**
 * Hook to determine the connection state of the site and user.
 *
 * @return The connection state
 */
export function useConnectionState(): ConnectionState {
	const { isRegistered, isUserConnected, hasConnectedOwner } = useMyJetpackConnection();

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

	// If the user is connected, all good!
	if ( isUserConnected ) {
		return {
			label: __( 'Site and account connected', 'jetpack-my-jetpack' ),
			description: __( 'Everything looks good.', 'jetpack-my-jetpack' ),
			status: 'success',
		};
	}

	// If the user is not an admin, they can't connect their account unless an admin has connected their account.
	if ( ! currentUserCan( 'manage_options' ) && ! hasConnectedOwner ) {
		return {
			label: __( 'Site connected', 'jetpack-my-jetpack' ),
			description: __(
				'A site admin will need to connect their account before you can connect yours.',
				'jetpack-my-jetpack'
			),
			status: 'warning',
		};
	}

	return {
		label: __( 'Site connected', 'jetpack-my-jetpack' ),
		description: __( 'Connect your account to unlock all the features.', 'jetpack-my-jetpack' ),
		action: 'CONNECT_USER',
		status: 'warning',
	};
}
