/**
 * API helper for the package-owned Newsletter Mode route.
 *
 * The mode flag is deliberately NOT part of the shared settings object, so it
 * is persisted through the newsletter package's own REST route rather than the
 * shared `updateSettings()` path. Uses `@wordpress/api-fetch`, which is already
 * configured with the site REST root + nonce on this admin page (the same way
 * `fetchCategoriesViaWpApi()` in ./api.ts reaches `/wp/v2/categories`).
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * Persist the Newsletter Mode flag.
 *
 * @param enabled - Whether the mode should be switched on.
 * @return The resulting enabled state as reported by the server.
 */
export async function updateNewsletterMode( enabled: boolean ): Promise< boolean > {
	const result = ( await apiFetch( {
		path: '/jetpack-newsletter/v1/mode',
		method: 'POST',
		data: { enabled },
	} ) ) as { enabled?: boolean };

	return Boolean( result.enabled );
}
