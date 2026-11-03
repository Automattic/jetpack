// Modules whose Security tab settings live on the Protect page, when it is on.
export const PROTECT_PAGE_MODULES = [ 'waf', 'protect', 'account-protection', 'monitor', 'sso' ];

// Modules whose Security tab card points to the Backup page instead, when the Protect page is on.
export const BACKUP_MODULES = [ 'backup', 'vaultpress' ];

// Modules with no Settings card at all once the Protect page replaces the Security tab.
export const HIDDEN_WITH_PROTECT_PAGE = [ 'protect-dashboard' ];

/**
 * Build the URL of the Protect page's Settings tab.
 *
 * @param {string} siteAdminUrl - The site's wp-admin URL, with a trailing slash.
 * @return {string} The URL.
 */
export function getProtectSettingsUrl( siteAdminUrl ) {
	return `${ siteAdminUrl }admin.php?page=jetpack-protect&p=${ encodeURIComponent(
		'/?tab=settings'
	) }`;
}

/**
 * Leave Settings for the Protect page's Settings tab, without a history entry for the old route.
 *
 * @param {string} siteAdminUrl - The site's wp-admin URL, with a trailing slash.
 */
export function openProtectSettings( siteAdminUrl ) {
	window.location.replace( getProtectSettingsUrl( siteAdminUrl ) );
}
