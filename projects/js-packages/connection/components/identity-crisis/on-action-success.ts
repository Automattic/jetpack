import { goTo, reloadPage } from './navigate';
import type { IdentityCrisisActionResult } from './types';

/**
 * What the Safe Mode screen does after an action succeeds, unless its host says otherwise.
 *
 * Exported so a host can override one action and hand the rest back.
 *
 * @param {IdentityCrisisActionResult} result - The action's result.
 */
export function onIdentityCrisisActionSuccess( result: IdentityCrisisActionResult ): void {
	if ( result.action === 'start-fresh' ) {
		goTo( result.connectUrl );
	} else if ( result.action === 'confirm-safe-mode' ) {
		reloadPage();
	}
	// Migrate shows its done view first; its button reloads.
}
