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

/**
 * Time intervals the Overview tab queries can request. Mirrors the
 * `enum` on the PHP REST routes added in Plan 2 (stats / blackbox /
 * woocommerce). Kept in `types.ts` (not a hook file) so `query-keys.ts`
 * can import it without depending on React.
 */
export type StatsInterval = '30-days' | '60-days' | '6-months' | 'all';

/**
 * Blackbox-side categories the proxy understands. Maps 1:1 to the
 * `category` enum on `GET /akismet/v1/blackbox/aggregates`.
 */
export type BlackboxCategory = 'logins' | 'bots' | 'brute-force' | 'forms';
