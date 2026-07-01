/**
 * Cookie Consent Tracking
 *
 * Privacy-specific tracking wrappers for Tracks.
 */

import { getCategoryPreferenceKey } from './category-preferences';
import { recordEvent, getCommonProperties } from './tracks-utils';
import type { ConsentPreferences, TrackingProperties } from './types';

const DEFAULT_TRACKS_PREFERENCE_KEYS = new Set( [ 'required', 'analytics', 'advertising' ] );

function getPreferenceProperties( preferences: ConsentPreferences ): TrackingProperties {
	const properties: TrackingProperties = {
		...getCommonProperties(),
		preferences_required: preferences.required ?? false,
		preferences_analytics: preferences.analytics ?? false,
		preferences_advertising: preferences.advertising ?? false,
	};

	window.jetpackCookieConsentConfig?.categories?.forEach( category => {
		const preferenceKey = getCategoryPreferenceKey( category );

		if ( DEFAULT_TRACKS_PREFERENCE_KEYS.has( preferenceKey ) ) {
			return;
		}

		properties[ `preferences_${ category.key }` ] = preferences[ preferenceKey ] === true;
	} );

	return properties;
}

/**
 * Track privacy banner view
 *
 * Fired when the cookie consent banner is displayed to the visitor.
 */
export function trackPrivacyBannerView(): void {
	recordEvent( 'privacy_banner_view', getCommonProperties() );
}

/**
 * Track privacy banner accept button click
 *
 * @param preferences Object with consent preferences, keyed by category preference key (e.g. required, analytics, advertising, plus any custom registered categories).
 */
export function trackPrivacyBannerAccept( preferences: ConsentPreferences ): void {
	recordEvent( 'privacy_banner_button_accept', getPreferenceProperties( preferences ) );
}

/**
 * Track privacy banner reject button click
 *
 * Fired when the visitor clicks "Reject All" in customize modal.
 */
export function trackPrivacyBannerReject(): void {
	recordEvent( 'privacy_banner_button_reject', getCommonProperties() );
}

/**
 * Track privacy banner customize button click
 *
 * Fired when the visitor clicks "Customize" to open the preferences modal.
 */
export function trackPrivacyBannerCustomize(): void {
	recordEvent( 'privacy_banner_button_customize', getCommonProperties() );
}

/**
 * Track "Manage Privacy Preferences" link click
 *
 * Fired when the visitor opens preferences modal from the footer link.
 */
export function trackPrivacyManageOpen(): void {
	recordEvent( 'privacy_manage_open', getCommonProperties() );
}

/**
 * Track CCPA opt-out button click
 *
 * Fired when the visitor submits the CCPA "Do Not Sell/Share" opt-out.
 */
export function trackPrivacyPolicyOptOut(): void {
	recordEvent( 'privacy_policy_page_button_opt_out', getCommonProperties() );
}
