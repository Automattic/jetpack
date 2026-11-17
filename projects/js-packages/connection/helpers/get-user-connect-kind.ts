import { __ } from '@wordpress/i18n';
import type { ConnectionOwner } from '../types.ts';

/**
 * What connecting their account means for a viewer whose account is not linked:
 * - `reconnect-owner`: they own the connection and their token is broken.
 * - `take-over`: the owner is unusable and connecting can make them the new owner.
 * - `locked-owner`: the owner's token is broken, but connecting would only link them.
 * - `secondary`: a connected owner exists, so they connect as an additional user.
 * - `first`: there is no owner of record.
 */
export type UserConnectKind =
	'reconnect-owner' | 'take-over' | 'locked-owner' | 'secondary' | 'first';

/**
 * Classify what connecting their account means for the viewer.
 *
 * The owner of record is withheld from viewers without `jetpack_connect`, so for them a broken
 * owner reads as `first`.
 *
 * @param {object}               state                   - Connection state.
 * @param {boolean}              state.isRegistered      - Whether the site has a blog token.
 * @param {boolean}              state.hasConnectedOwner - Whether the owner's token is stored and well-formed.
 * @param {ConnectionOwner|null} state.owner             - The owner of record, from `master_user`.
 * @param {number|undefined}     state.currentUserId     - The viewer's local user ID.
 * @param {boolean|null}         state.canTakeOwnerSlot  - The server's `Manager::can_take_owner_slot()`. Absent from older servers, which promised a takeover whenever the owner's token was missing.
 * @return {UserConnectKind} The kind of connection the viewer would make.
 */
export function getUserConnectKind( {
	isRegistered,
	hasConnectedOwner,
	owner,
	currentUserId,
	canTakeOwnerSlot,
}: {
	isRegistered: boolean;
	hasConnectedOwner: boolean;
	owner: ConnectionOwner | null;
	currentUserId: number | undefined;
	canTakeOwnerSlot?: boolean | null;
} ): UserConnectKind {
	// An unregistered site has no owner to reconnect, whatever `master_user` still says.
	const ownerOfRecord = isRegistered ? owner : null;
	// JS callers pass the store's owner unchecked, so an unknown viewer must not match a partial owner.
	const viewerIsOwner =
		!! ownerOfRecord && currentUserId !== undefined && ownerOfRecord.id === currentUserId;

	if ( ownerOfRecord && ! viewerIsOwner && canTakeOwnerSlot ) {
		// Covers a token WordPress.com rejects, which still reads as a connected owner.
		return 'take-over';
	}

	if ( hasConnectedOwner ) {
		return 'secondary';
	}

	if ( ownerOfRecord ) {
		if ( viewerIsOwner ) {
			return 'reconnect-owner';
		}

		return false === canTakeOwnerSlot ? 'locked-owner' : 'take-over';
	}

	return 'first';
}

/**
 * The connect prompt for a viewer whose account is not linked.
 *
 * `take-over` names only what a plain account connection does. The connection-error notice's
 * reconnect can be a full reconnect, which disconnects every other user; its copy doesn't say so.
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
				"The connection owner's WordPress.com account isn't working. If you connect your account, you can become the new connection owner.",
				'jetpack-connection-js'
			);
		case 'locked-owner':
			return __(
				'The connection owner needs to reconnect their WordPress.com account to restore the connection. You can still connect your own WordPress.com account.',
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
