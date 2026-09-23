import { currentUserCan } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import type { ConnectionErrorSeverity } from '@automattic/jetpack-connection';

export type ConnectionState = {
	label: string;
	/** The card's own copy. Absent while an error is on screen: the package's words describe it instead. */
	description?: string;
	action?: 'CONNECT_USER' | 'CONNECT_SITE';
	status: 'error' | 'warning' | 'success';
	/** True only when the label is a diagnosis rather than a standing. */
	isDiagnosis?: boolean;
};

/**
 * What the connection package reported about a live error, as the card reads it.
 */
export type ConnectionErrorStanding = {
	/** Whether there is an error worth showing this viewer. */
	hasConnectionError: boolean;
	/** How much of a problem it is for them, or null when nothing is broken. */
	severity: ConnectionErrorSeverity | null;
	/** The package's headline for the error, shown in place of the card's own label. */
	errorTitle: string;
};

/**
 * Hook to determine the connection state of the site and user.
 *
 * @param {ConnectionErrorStanding} error - What the connection package reported, read by the card so the two agree on one rating.
 * @return The connection state
 */
export function useConnectionState( error: ConnectionErrorStanding ): ConnectionState {
	const { isRegistered, isUserConnected, hasConnectedOwner } = useMyJetpackConnection();

	if ( ! isRegistered ) {
		// Reached by users who cannot connect: onboarding is skipped for them, so they land here.
		if ( ! currentUserCan( 'manage_options' ) ) {
			return {
				label: __( 'Site not connected', 'jetpack-my-jetpack' ),
				description: __(
					'A site admin will need to connect this site to Jetpack.',
					'jetpack-my-jetpack'
				),
				status: 'error',
			};
		}

		return {
			label: __( 'Site not connected', 'jetpack-my-jetpack' ),
			description: __( 'Connect your site with one click.', 'jetpack-my-jetpack' ),
			action: 'CONNECT_SITE',
			status: 'error',
		};
	}

	// We are here, which means the site is connected.

	if ( isUserConnected ) {
		if ( error.hasConnectionError ) {
			return {
				label: error.errorTitle,
				status: error.severity ?? 'error',
				isDiagnosis: true,
			};
		}

		return {
			label: __( 'Site and account connected', 'jetpack-my-jetpack' ),
			description: __( 'Everything looks good.', 'jetpack-my-jetpack' ),
			status: 'success',
		};
	}

	// Connecting the account stays the prompt; a live error only tints the line, at
	// the package's severity.
	const status = error.hasConnectionError ? ( error.severity ?? 'error' ) : 'warning';

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
