import type {
	ConnectionErrorObject,
	ConnectionErrorSeverity,
	ConnectionErrorViewer,
} from './types.ts';

/**
 * Rate a set of displayable errors for the viewer looking at them.
 *
 * Only the owner can restore their own token: a reconnect by anyone else
 * deregisters the site rather than repairing it, so for every other viewer a
 * break confined to the owner's token is news rather than a task.
 *
 * @param {ConnectionErrorObject[]} errors - The errors this viewer is being shown.
 * @param {ConnectionErrorViewer}   viewer - Who is looking.
 * @return {ConnectionErrorSeverity|null} How much of a problem they are, or null when there are none.
 */
export function getConnectionErrorSeverity(
	errors: ConnectionErrorObject[],
	viewer: ConnectionErrorViewer = {}
): ConnectionErrorSeverity | null {
	if ( ! errors.length ) {
		return null;
	}

	const onlyOwnersToFix = ! viewer.isOwner && errors.every( error => error.audience === 'owner' );

	return onlyOwnersToFix ? 'warning' : 'error';
}
