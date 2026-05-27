/**
 * Shared TypeScript types for the akismet/v1 REST surface.
 *
 * Mirrors the response shapes in `class.akismet-experimental-rest-api.php`.
 * Hooks consume these via the `queryOptions()` factories in `src/data/queries.ts`.
 */

/**
 * The `/akismet/v1/key` response. `valid` is a coarse structural signal
 * (non-empty + plausible format) — not a WPCOM round-trip verification.
 */
export type ApiKeyState = {
	key: string;
	valid: boolean;
};

/**
 * The `/akismet/v1/settings` response.
 *
 * Akismet stores these as strings in `wp_options`, with `'0' | '1'` semantics:
 * - `akismet_strictness`: `'0'` = review spam, `'1'` = silently discard worst.
 * - `akismet_show_user_comments_approved`: toggle showing the per-commenter
 *   approved-comment count next to the name.
 */
export type AkismetSettings = {
	akismet_strictness: '0' | '1';
	akismet_show_user_comments_approved: '0' | '1';
};
