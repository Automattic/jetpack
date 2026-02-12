/**
 * Analytics utilities for Newsletter settings
 *
 * Uses `@automattic/jetpack-analytics` to track events with consistent naming
 * and properties across all site types (Simple, Atomic, Jetpack).
 */

import analytics from '@automattic/jetpack-analytics';
import type { JetpackNewsletterSettings } from './types';

/**
 * Site types for analytics tracking
 */
export type SiteType = 'simple' | 'atomic' | 'jetpack';

/**
 * Get the site type from settings
 *
 * @param {JetpackNewsletterSettings | undefined} settings - Settings from PHP
 * @return {SiteType} The site type
 */
export function getSiteType( settings: JetpackNewsletterSettings | undefined ): SiteType {
	if ( ! settings ) {
		return 'jetpack';
	}

	if ( settings.isWpcomSimple ) {
		return 'simple';
	}

	if ( settings.isWpcomPlatform ) {
		return 'atomic';
	}

	return 'jetpack';
}

/**
 * Track the newsletter module toggle (enable/disable)
 *
 * @param {boolean}  enabled  - Whether the module is now enabled
 * @param {SiteType} siteType - The site type
 */
export function trackModuleToggle( enabled: boolean, siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_module_toggle', {
		site_type: siteType,
		enabled,
	} );
}

/**
 * Track a boolean setting toggle
 *
 * @param {string}   setting  - The setting key
 * @param {boolean}  enabled  - Whether the setting is now enabled
 * @param {SiteType} siteType - The site type
 */
export function trackSettingToggle( setting: string, enabled: boolean, siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_setting_toggle', {
		site_type: siteType,
		setting,
		enabled,
	} );
}

/**
 * Track a non-boolean setting change
 *
 * @param {string}   setting  - The setting key
 * @param {string}   value    - The new value
 * @param {SiteType} siteType - The site type
 */
export function trackSettingChange( setting: string, value: string, siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_setting_change', {
		site_type: siteType,
		setting,
		value,
	} );
}

/**
 * Track clicking the "Manage subscribers" link
 *
 * @param {SiteType} siteType - The site type
 */
export function trackManageSubscribersClick( siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_manage_subscribers_click', {
		site_type: siteType,
	} );
}

/**
 * Track clicking the "Add/Manage Plans" button
 *
 * @param {boolean}  hasActivePlan - Whether the site has an active paid plan
 * @param {SiteType} siteType      - The site type
 */
export function trackPaidPlansClick( hasActivePlan: boolean, siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_paid_plans_click', {
		site_type: siteType,
		has_active_plan: hasActivePlan,
	} );
}

/**
 * Track clicking a template edit link
 *
 * @param {string}   template - The template being edited
 * @param {SiteType} siteType - The site type
 */
export function trackEditLinkClick( template: string, siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_edit_link_click', {
		site_type: siteType,
		template,
	} );
}

/**
 * Track saving a settings section
 *
 * @param {string}   section  - The section being saved
 * @param {SiteType} siteType - The site type
 */
export function trackSectionSave( section: string, siteType: SiteType ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
		site_type: siteType,
		section,
	} );
}
