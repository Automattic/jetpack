import { __ } from '@wordpress/i18n';
import type { ConnectionOwner } from '../types.ts';

/**
 * What connecting their account means for a viewer whose account is not linked:
 * - `reconnect-owner`: they own the connection and their token is broken.
 * - `take-over`: the owner's token is broken, so connecting makes them the new owner.
 * - `secondary`: a connected owner exists, so they connect as an additional user.
 * - `first`: there is no owner of record.
 */
export type UserConnectKind = 'reconnect-owner' | 'take-over' | 'secondary' | 'first';

/**
 * Classify what connecting their account means for the viewer.
 *
 * The owner of record is withheld from viewers without `jetpack_connect`, so for them a broken
 * owner reads as `first`.
 *
 * @param {object}               state                   - Connection state.
 * @param {boolean}              state.isRegistered      - Whether the site has a blog token.
 * @param {boolean}              state.hasConnectedOwner - Whether the owner's token works.
 * @param {ConnectionOwner|null} state.owner             - The owner of record, from `master_user`.
 * @param {number|undefined}     state.currentUserId     - The viewer's local user ID.
 * @return {UserConnectKind} The kind of connection the viewer would make.
 */
export function getUserConnectKind( {
	isRegistered,
	hasConnectedOwner,
	owner,
	currentUserId,
}: {
	isRegistered: boolean;
	hasConnectedOwner: boolean;
	owner: ConnectionOwner | null;
	currentUserId: number | undefined;
} ): UserConnectKind {
	if ( hasConnectedOwner ) {
		return 'secondary';
	}

	// An unregistered site has no owner to reconnect, whatever `master_user` still says.
	if ( owner && isRegistered ) {
		// JS callers pass the store's owner unchecked, so an unknown viewer must not match a partial owner.
		return currentUserId !== undefined && owner.id === currentUserId
			? 'reconnect-owner'
			: 'take-over';
	}

	return 'first';
}

/**
 * The connect prompt for a viewer whose account is not linked.
 *
 * `take-over` names only what a plain account connection does. The connection-error notice's
 * reconnect is a full reconnect, which also disconnects every other user, so its copy says more.
 *
 * @param {UserConnectKind} kind - What connecting means for the viewer, from getUserConnectKind().
 * @return {string} The prompt text.
 */
export function getUserConnectMessage( kind: UserConnectKind ): string {
	// One literal per return; see the minification note in use-connection-error-notice/error-details.ts.
	switch ( kind ) {
		case 'reconnect-owner':
			return __(
				'Your WordPress.com account is no longer connected to this site. Reconnect it to restore full functionality.',
				'jetpack-connection-js'
			);
		case 'take-over':
			return __(
				"The connection owner's WordPress.com account is no longer connected. If you connect your account, you will become the new connection owner.",
				'jetpack-connection-js'
			);
		case 'secondary':
			return __(
				'Connect your user account to unlock more features and sign in via WordPress.com (SSO).',
				'jetpack-connection-js'
			);
		case 'first':
			return __(
				'Your site is registered with WordPress.com. Connect your user account to unlock full functionality.',
				'jetpack-connection-js'
			);
	}
}
