/**
 * Utility functions for newsletter settings
 */
import type { JetpackNewsletterSettings } from './types';

/**
 * Helper function to get "Manage all subscribers" URL
 *
 * @param {JetpackNewsletterSettings | undefined} jetpackSettings - Settings passed from PHP
 * @return {string} URL to manage subscribers
 */
export function getManageSubscribersUrl(
	jetpackSettings: JetpackNewsletterSettings | undefined
): string {
	if ( ! jetpackSettings ) {
		return '#';
	}

	if ( jetpackSettings.wpAdminSubscriberManagementEnabled ) {
		return `${ jetpackSettings.siteAdminUrl }admin.php?page=subscribers`;
	}

	// Fallback to WordPress.com URL (prefer siteRawUrl, fallback to blogID)
	const site = jetpackSettings.siteRawUrl || jetpackSettings.blogID;
	return `https://wordpress.com/subscribers/${ site }`;
}
