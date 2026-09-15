import type { InitialState } from './types.ts';

/**
 * Fallback when the localized state is missing.
 *
 * `upgrade` is the only prompt that is never wrong for an unknown site;
 * `activate` could offer to start a transfer for a site with no plan.
 */
const FALLBACK: InitialState = {
	state: 'upgrade',
	domain: '',
	blockers: [],
	upgradeUrl: 'https://wordpress.com/plans/',
	activateUrl: 'https://wordpress.com/backup/',
	supportUrl: 'https://wordpress.com/support/backups/',
};

/**
 * Read the state PHP localized onto the page.
 *
 * @return The initial state, or a safe fallback if the global is absent.
 */
export function getInitialState(): InitialState {
	return window.wpcomSimpleBackupInitialState ?? FALLBACK;
}
