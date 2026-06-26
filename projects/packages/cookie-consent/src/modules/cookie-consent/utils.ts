/**
 * Shared utility functions for cookie consent
 */

import { trackPrivacyBannerView } from './tracks';
import type { ConsentType, ConsentEventType, ConsentEventChoices } from './types';

export const UNKNOWN_COUNTRY_CODE = 'UNKNOWN';

interface Config {
	gdprCountries: string[];
	ccpaRegions: string[];
	// Whether a Global Privacy Control signal force-denies non-essential cookies in GDPR
	// regions. Conservative default (honor GPC) applies when the flag is omitted.
	gdprHonorsGpc?: boolean;
}

interface Context {
	showBanner: boolean;
}

type SameSiteValue = 'Lax' | 'Strict' | 'None';

export function getCookie( name: string ): string | null {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) {
		return parts.pop()?.split( ';' ).shift() || null;
	}
	return null;
}

export function setCookie(
	name: string,
	value: string,
	durationSeconds: number,
	sameSite: SameSiteValue = 'Strict'
): void {
	const date = new Date();
	date.setTime( date.getTime() + durationSeconds * 1000 );
	const expires = `expires=${ date.toUTCString() }`;
	// Host-only cookie (no domain attribute), matching the WP Consent API. Deriving a
	// cross-subdomain domain from the hostname breaks on multi-level TLDs (e.g. `.co.uk`,
	// `.com.br`), where the last two labels are a public suffix that browsers reject.
	document.cookie = `${ name }=${ value };${ expires };path=/;SameSite=${ sameSite }`;
}

export function hasConsentSet(): boolean {
	// If user has made a choice, the functional cookie should be set.
	return getCookie( 'wp_consent_functional' ) !== null;
}

export function readConsentChoices(): {
	analytics: boolean;
	advertising: boolean;
} {
	return {
		analytics: getCookie( 'wp_consent_statistics' ) === 'allow',
		advertising: getCookie( 'wp_consent_marketing' ) === 'allow',
	};
}

export function saveConsentChoices(
	choices: ConsentEventChoices,
	eventType: ConsentEventType = 'accept_selected'
): void {
	if ( ! window.wp_set_consent ) {
		// If WP Consent API is not available, don't do anything
		return;
	}

	// Define a flat mapping of categories to WP Consent API categories for flexibility
	const categoryMap: Record< keyof ConsentEventChoices, string[] > = {
		analytics: [ 'statistics', 'statistics-anonymous' ],
		advertising: [ 'marketing' ],
	};
	// Always allow functional/required cookies
	window.wp_set_consent( 'functional', 'allow' );

	// Set consent for each mapped WP category, merging and deduplicating where appropriate
	const categories: Array< keyof ConsentEventChoices > = [ 'analytics', 'advertising' ];
	categories.forEach( category => {
		if ( category in choices && choices[ category ] !== undefined ) {
			const value = choices[ category ];
			const mappedCategories = categoryMap[ category ];
			mappedCategories.forEach(
				wpCategory => window.wp_set_consent?.( wpCategory, value ? 'allow' : 'deny' )
			);
		}
	} );

	// Trigger a custom event to notify other parts of the code that the consent has been set
	window.dispatchEvent(
		new CustomEvent( 'wp_consent_saved', {
			detail: {
				eventType,
				choices,
			},
		} )
	);
}

export function setConsentType( consentType: ConsentType ): void {
	window.wp_consent_type = consentType;
	window.dispatchEvent( new CustomEvent( 'wp_consent_type_defined' ) );
}

export function isGdprCountry( countryCode: string, config: Config ): boolean {
	return countryCode === UNKNOWN_COUNTRY_CODE || config.gdprCountries.includes( countryCode );
}

export function pertainsToCCPA( countryCode: string, region: string, config: Config ): boolean {
	const _region = ( region || '' ).toLowerCase();
	return countryCode === 'US' && config.ccpaRegions.includes( _region );
}

export function hasOptedOutViaGlobalPrivacyControl(): boolean {
	return window.navigator?.globalPrivacyControl === true;
}

export function handleConsentByRegion(
	countryCode: string,
	region: string,
	config: Config,
	context: Context
): void {
	if ( isGdprCountry( countryCode, config ) ) {
		// GDPR: Opt-in model - show banner for explicit consent
		setConsentType( 'optin' );

		// A Global Privacy Control signal is a clear opt-out request, so honor it as a
		// rejection: force-deny non-essential categories and skip the banner. The shopper
		// can still grant consent later via the "Manage Privacy Preferences" footer link.
		// Gated by a config flag so the legal decision is a value, not a code change;
		// the conservative default (honor GPC) applies when the flag is omitted.
		if ( config.gdprHonorsGpc !== false && hasOptedOutViaGlobalPrivacyControl() ) {
			context.showBanner = false;
			saveConsentChoices(
				{
					analytics: false,
					advertising: false,
				},
				'opt-out'
			);
			return;
		}

		context.showBanner = true;
		trackPrivacyBannerView();
		return;
	}

	if ( pertainsToCCPA( countryCode, region, config ) ) {
		// CCPA: Opt-out model - set consent by default, show banner for opt-out option
		context.showBanner = false;
		setConsentType( 'optout' );

		if ( hasOptedOutViaGlobalPrivacyControl() ) {
			saveConsentChoices(
				{
					analytics: false,
					advertising: false,
				},
				'opt-out'
			);
			return;
		}

		// Automatically set consent for CCPA (opt-out model)
		saveConsentChoices(
			{
				analytics: true,
				advertising: true,
			},
			'auto_granted'
		);
		return;
	}

	// Non-regulated region: Set implied consent
	setConsentType( undefined );
	saveConsentChoices(
		{
			analytics: true,
			advertising: true,
		},
		'auto_granted'
	);
}
