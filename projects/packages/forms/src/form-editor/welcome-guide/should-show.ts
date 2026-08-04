/**
 * Welcome guide visibility rules
 *
 * Pure functions for deciding whether the form editor welcome guide
 * should open, with no side effects.
 *
 * @package
 */

/**
 * Query argument that force-opens the guide regardless of the stored
 * preference. Intended for testing the first-run experience repeatedly
 * without having to reset user preferences between loads.
 */
export const FORCE_QUERY_ARG = 'jetpack_forms_welcome_guide';

export interface WelcomeGuideContext {
	/**
	 * The stored `jetpack/forms` → `welcomeGuide` preference. `true` means the
	 * guide has not been dismissed yet. `undefined` when the user has no
	 * persisted value, which is the first-run case.
	 */
	preference: boolean | undefined;
	/** Whether the force query argument is present and enabled. */
	isForced: boolean;
}

/**
 * Determines whether the welcome guide should be shown.
 *
 * The force flag wins over everything so the guide can be re-tested on demand.
 * Otherwise the guide shows until the user dismisses it, including the
 * first-run case where no preference has been persisted yet.
 *
 * @param context - Current guide context
 * @return Whether the guide should be shown
 */
export function shouldShowWelcomeGuide( context: WelcomeGuideContext ): boolean {
	if ( context.isForced ) {
		return true;
	}

	return context.preference !== false;
}

/**
 * Reads the force query argument from a URL search string.
 *
 * Treats the argument as enabled unless it is explicitly falsy, so both
 * `?jetpack_forms_welcome_guide` and `?jetpack_forms_welcome_guide=1` work.
 *
 * @param search - The URL search string, e.g. `window.location.search`
 * @return Whether the guide should be force-opened
 */
export function isWelcomeGuideForced( search: string ): boolean {
	const params = new URLSearchParams( search );

	if ( ! params.has( FORCE_QUERY_ARG ) ) {
		return false;
	}

	const value = params.get( FORCE_QUERY_ARG );

	return value !== '0' && value !== 'false';
}
