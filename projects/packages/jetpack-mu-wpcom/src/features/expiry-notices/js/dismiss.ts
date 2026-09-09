import apiFetch from '@wordpress/api-fetch';

/**
 * Record a notice dismissal for the current user. The server stamps its own
 * time; the value sent is only a trigger.
 *
 * @param metaKey   - The notice's dismissal meta key.
 * @param keepalive - Let the write survive a page unload the caller is starting.
 * @return The pending write.
 */
export const recordDismissal = ( metaKey: string, keepalive = false ): Promise< unknown > =>
	apiFetch( {
		path: '/wp/v2/users/me',
		method: 'POST',
		data: { meta: { [ metaKey ]: 1 } },
		keepalive,
	} );
