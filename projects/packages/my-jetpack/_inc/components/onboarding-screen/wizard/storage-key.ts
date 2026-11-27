import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';

/**
 * A session storage key for this site and this user.
 *
 * Subdirectory multisite puts every site on one origin, so an unscoped run
 * started on one site came back on the next, and Continue applied its switches there.
 *
 * @param base - The key's own name.
 * @return The key, scoped when the page says what to scope it to.
 */
export function scopedKey( base: string ): string {
	const scope = getMyJetpackWindowInitialState( 'onboardingWizard' )?.runScope;

	return scope ? `${ base }:${ scope }` : base;
}
