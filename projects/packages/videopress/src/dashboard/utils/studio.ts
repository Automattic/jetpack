/**
 * Whether the Studio expansion of the dashboard is enabled.
 *
 * Mirrors the PHP-side `Admin_UI::is_studio_enabled()` gate via the inlined
 * initial state, guarding for environments (tests, the legacy page) where the
 * `var JPVIDEOPRESS_INITIAL_STATE` is absent. Defaults to false.
 *
 * @return Whether the Studio-gated UI should be shown.
 */
export function isStudioEnabled(): boolean {
	const state =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' ? JPVIDEOPRESS_INITIAL_STATE : undefined;

	return state?.features?.studio ?? false;
}
