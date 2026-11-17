import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * The Safe Mode support page.
 *
 * @return The URL.
 */
export function getSupportUrl(): string {
	return getRedirectUrl( 'jetpack-support-safe-mode' );
}
