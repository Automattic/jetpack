// The site does not apply overlapping `/wp/v2/settings` requests in order, and each answer replaces the whole
// `root/site` record, so every hook that saves site settings goes through this one queue.
let queue: Promise< unknown > = Promise.resolve();

/**
 * Send a site settings save once every earlier one has settled.
 *
 * @param send - Sends the save.
 * @return The save's own result.
 */
export function enqueueSiteSettingsSave< T >( send: () => Promise< T > ): Promise< T > {
	const save = queue.then( send, send );
	queue = save;
	return save;
}

/**
 * Drop any pending saves. Test-only.
 */
export function resetSiteSettingsQueueForTesting() {
	queue = Promise.resolve();
}
