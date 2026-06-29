/**
 * Shared utility functions for cookie consent
 */

import { getCategoryPreferenceKey } from './category-preferences';
import { trackPrivacyBannerView } from './tracks';
import type { ConsentType, ConsentEventType, ConsentEventChoices, ConsentCategory } from './types';

export const UNKNOWN_COUNTRY_CODE = 'UNKNOWN';

export const DEFAULT_CONSENT_CATEGORIES: ConsentCategory[] = [
	{
		key: 'functional',
		preferenceKey: 'required',
		required: true,
		defaultChecked: true,
		wpConsentMap: [ 'functional' ],
	},
	{
		key: 'analytics',
		preferenceKey: 'analytics',
		required: false,
		defaultChecked: true,
		wpConsentMap: [ 'statistics', 'statistics-anonymous' ],
	},
	{
		key: 'marketing',
		preferenceKey: 'advertising',
		required: false,
		defaultChecked: false,
		wpConsentMap: [ 'marketing' ],
	},
];

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

export function getConsentCategories(): ConsentCategory[] {
	const configuredCategories = window.jetpackCookieConsentConfig?.categories;
	if ( Array.isArray( configuredCategories ) && configuredCategories.length ) {
		return configuredCategories;
	}

	return DEFAULT_CONSENT_CATEGORIES;
}

export function getConsentChoices( nonRequiredValue?: boolean ): ConsentEventChoices {
	return getConsentCategories().reduce< ConsentEventChoices >( ( choices, category ) => {
		const preferenceKey = getCategoryPreferenceKey( category );
		choices[ preferenceKey ] = category.required
			? true
			: nonRequiredValue ?? category.defaultChecked;
		return choices;
	}, {} );
}

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
	const requiredCategories = getConsentCategories().filter( category => category.required );
	const categoriesToCheck = requiredCategories.length ? requiredCategories : getConsentCategories();

	return categoriesToCheck.some( category =>
		category.wpConsentMap.some( wpCategory => getCookie( `wp_consent_${ wpCategory }` ) !== null )
	);
}

export function readConsentChoices(): ConsentEventChoices {
	return getConsentCategories().reduce< ConsentEventChoices >( ( choices, category ) => {
		const preferenceKey = getCategoryPreferenceKey( category );
		if ( category.required ) {
			choices[ preferenceKey ] = true;
			return choices;
		}

		choices[ preferenceKey ] = category.wpConsentMap.every(
			wpCategory => getCookie( `wp_consent_${ wpCategory }` ) === 'allow'
		);
		return choices;
	}, {} );
}

export function saveConsentChoices(
	choices: ConsentEventChoices,
	eventType: ConsentEventType = 'accept_selected'
): void {
	if ( ! window.wp_set_consent ) {
		// If WP Consent API is not available, don't do anything
		return;
	}

	getConsentCategories().forEach( category => {
		const preferenceKey = getCategoryPreferenceKey( category );
		const value = category.required ? true : choices[ preferenceKey ];

		if ( value === undefined ) {
			return;
		}

		category.wpConsentMap.forEach( wpCategory => {
			window.wp_set_consent?.( wpCategory, value ? 'allow' : 'deny' );
		} );
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
		// rejection: force-deny non-essential categories and skip the banner. The visitor
		// can still grant consent later via the "Manage Privacy Preferences" footer link.
		// Gated by a config flag so the legal decision is a value, not a code change;
		// the conservative default (honor GPC) applies when the flag is omitted.
		if ( config.gdprHonorsGpc !== false && hasOptedOutViaGlobalPrivacyControl() ) {
			context.showBanner = false;
			saveConsentChoices( getConsentChoices( false ), 'opt-out' );
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
			saveConsentChoices( getConsentChoices( false ), 'opt-out' );
			return;
		}

		// Automatically set consent for CCPA (opt-out model)
		saveConsentChoices( getConsentChoices( true ), 'auto_granted' );
		return;
	}

	// Non-regulated region: Set implied consent
	setConsentType( undefined );
	saveConsentChoices( getConsentChoices( true ), 'auto_granted' );
}
