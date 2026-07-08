/**
 * Cookie Consent Tracking
 *
 * Privacy-specific tracking wrappers for Tracks.
 */

import { getCategoryPreferenceKey } from './category-preferences';
import { recordEvent, recordCookielessStat, getCommonProperties } from './tracks-utils';
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
	recordCookielessStat( 'privacy-banner-view' );
}

/**
 * Track privacy banner accept button click
 *
 * Fired on both "Accept All" and "Save preferences". When analytics consent is
 * declined (e.g. saving preferences with analytics unchecked), loading the
 * cookie-setting Tracks bundle would contradict the visitor's choice, so the
 * accept is recorded as an identity-free aggregate stat instead.
 *
 * @param preferences         Object with consent preferences, keyed by category preference key (e.g. required, analytics, advertising, plus any custom registered categories).
 * @param hasAnalyticsConsent Whether the saved preferences allow analytics.
 */
export function trackPrivacyBannerAccept(
	preferences: ConsentPreferences,
	hasAnalyticsConsent: boolean
): void {
	if ( ! hasAnalyticsConsent ) {
		recordCookielessStat( 'privacy-banner-button-accept' );
		return;
	}

	// Analytics granted: allowlisted consent-record event documenting the choice.
	recordEvent( 'privacy_banner_button_accept', getPreferenceProperties( preferences ) );
}

/**
 * Track privacy banner reject button click
 *
 * Fired when the visitor clicks "Reject All" in customize modal.
 */
export function trackPrivacyBannerReject(): void {
	// Rejecting analytics must not load the cookie-setting Tracks bundle, so record
	// the rejection as an identity-free aggregate stat instead.
	recordCookielessStat( 'privacy-banner-button-reject' );
}

/**
 * Track privacy banner customize button click
 *
 * Fired when the visitor clicks "Customize" to open the preferences modal.
 */
export function trackPrivacyBannerCustomize(): void {
	recordCookielessStat( 'privacy-banner-button-customize' );
}

/**
 * Track "Manage Privacy Preferences" link click
 *
 * Fired when the visitor opens preferences modal from the footer link.
 *
 * @param hasPriorConsent     Whether the visitor already has stored consent choices.
 * @param hasAnalyticsConsent Whether those stored choices allow analytics.
 */
export function trackPrivacyManageOpen(
	hasPriorConsent: boolean,
	hasAnalyticsConsent: boolean
): void {
	// Without analytics consent — a fresh visitor, or a returning one who declined
	// analytics — count the open through the identity-free aggregate stat instead of
	// loading the cookie-setting Tracks bundle.
	if ( ! hasPriorConsent || ! hasAnalyticsConsent ) {
		recordCookielessStat( 'privacy-manage-open' );
		return;
	}

	// The caller has verified analytics consent above, so loading w.js is allowed.
	recordEvent( 'privacy_manage_open', getCommonProperties() );
}

/**
 * Track CCPA opt-out button click
 *
 * Fired when the visitor submits the CCPA "Do Not Sell/Share" opt-out.
 */
export function trackPrivacyPolicyOptOut(): void {
	// Opting out must not load the cookie-setting Tracks bundle, so record the
	// opt-out as an identity-free aggregate stat instead.
	recordCookielessStat( 'privacy-policy-page-button-opt-out' );
}
