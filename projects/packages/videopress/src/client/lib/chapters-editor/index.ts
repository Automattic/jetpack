/**
 * Whether the chapters editor is enabled in the block editor.
 *
 * Mirrors the PHP-side `Admin_UI::is_chapters_editor_enabled()` gate (the
 * `jetpack_videopress_chapters_editor` filter, default true) via the
 * `videoPressEditorState` object localized by
 * `Block_Editor_Extensions::enqueue_extensions()`, guarding for environments
 * (tests, front end, a stale build) where the global is absent. Falls back to
 * false there: an absent global is no evidence the feature is on, so the
 * conservative answer stays right even though the PHP default flipped.
 *
 * `wp_localize_script()` casts every scalar to a string, so a PHP `true`
 * arrives as `'1'` and a PHP `false` as `''` — the same shape the neighboring
 * `isVideoPressModuleActive` / `isStandaloneActive` flags already have. Both
 * the string and the raw-boolean forms are accepted so the gate keeps working
 * if the payload ever moves to a JSON channel; anything else (including the
 * string `'0'`, which is truthy in JS) reads as disabled.
 *
 * Block-editor-only: the dashboard reads its own channel — see
 * `src/dashboard/utils/chapters-editor` — because the two surfaces are
 * localized by different PHP classes.
 *
 * @return Whether the chapters-editor UI should be shown.
 */
export function isChaptersEditorEnabled(): boolean {
	const enabled = window?.videoPressEditorState?.chaptersEditorEnabled;

	return enabled === true || enabled === '1';
}
