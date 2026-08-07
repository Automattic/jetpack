/**
 * Whether the chapters editor is enabled on the dashboard.
 *
 * Mirrors the PHP-side `Admin_UI::is_chapters_editor_enabled()` gate (the
 * `jetpack_videopress_chapters_editor` filter, default false) via the inlined
 * initial state, guarding for environments (tests, the legacy page) where the
 * `var JPVIDEOPRESS_INITIAL_STATE` is absent. Defaults to false.
 *
 * Dashboard-only: the block editor reads its own channel — see
 * `src/client/lib/chapters-editor` — because the two surfaces are localized by
 * different PHP classes. Never import this module from `src/client`.
 *
 * @return Whether the chapters-editor UI should be shown.
 */
export function isChaptersEditorEnabled(): boolean {
	const state =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' ? JPVIDEOPRESS_INITIAL_STATE : undefined;

	return state?.features?.chaptersEditor ?? false;
}
