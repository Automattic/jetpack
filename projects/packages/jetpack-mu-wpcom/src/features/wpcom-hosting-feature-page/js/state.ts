import type { InitialState, InitialStateVar } from './types.ts';

/**
 * Fallback when the localized state is missing.
 *
 * `upgrade` is the only prompt that is never wrong for an unknown site;
 * `activate` could offer to start a transfer for a site with no plan.
 */
const FALLBACK: InitialState = {
	state: 'upgrade',
	domain: '',
	isEligible: true,
	errors: [],
	warnings: [],
	upgradeUrl: 'https://wordpress.com/plans/',
	activateUrl: 'https://wordpress.com/setup/transferring-hosted-site',
	supportUrl: 'https://wordpress.com/help/contact',
	hasRevertedTransfer: false,
	transferFailed: false,
	checkoutPending: false,
};

/**
 * Read the state PHP localized onto the page.
 *
 * @param stateVar - The global the page's state was printed to.
 * @return The initial state, or a safe fallback if the global is absent.
 */
export function getInitialState( stateVar: InitialStateVar ): InitialState {
	return window[ stateVar ] ?? FALLBACK;
}
