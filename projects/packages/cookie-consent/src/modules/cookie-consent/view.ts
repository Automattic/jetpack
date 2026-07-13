/**
 * Cookie Consent Controls Interactivity
 *
 * Single store handling both GDPR cookie banner and CCPA opt-out functionality.
 * Uses separate contexts for each UI component while sharing actions and initialization.
 */

import { store, getContext, getConfig, withSyncEvent } from '@wordpress/interactivity';
import { isFeatureEnabled } from './features';
import {
	trackPrivacyBannerAccept,
	trackPrivacyBannerCustomize,
	trackPrivacyBannerReject,
	trackPrivacyBannerView,
	trackPrivacyManageOpen,
	trackPrivacyPolicyOptOut,
} from './tracks';
import { ensureTracksLoaded } from './tracks-utils';
import {
	UNKNOWN_COUNTRY_CODE,
	getCookie,
	setCookie,
	hasConsentSet,
	hasAnalyticsConsent,
	readConsentChoices,
	saveConsentChoices,
	isGdprCountry,
	pertainsToCCPA,
	handleConsentByRegion,
	getConsentChoices,
	type GeoConfig,
} from './utils';
import type { ConsentEvent, ConsentEventChoices } from './types';

interface GeoState {
	initialized: boolean;
	countryCode: string | null;
	region: string | null;
}

interface CookieBannerContext {
	showBanner: boolean;
	showModal: boolean;
	categories: ConsentEventChoices;
	textExpanded: boolean;
}

interface CcpaContext {
	isCcpaRegion: boolean;
	showSnackbar: boolean;
	snackbarTimeout: ReturnType< typeof setTimeout > | null;
}

interface GdprManageLinkContext {
	isGdprManageLink: boolean;
}

interface FooterLinksFallbackContext {
	fallbackExpanded: boolean;
	isCcpaRegion: boolean;
	isGdprManageLink: boolean;
}

interface StoreConfig {
	geo: GeoConfig;
	cookiePolicyUrl: string;
	gdprHonorsGpc: boolean;
	forcePreview: boolean;
	geoEnabled?: boolean;
}

interface GeoApiResponse {
	country_short?: string;
	region?: string;
}

// Set the default consent model to "opt-in".
// This serves as a safe initial state until the user's country code and region are determined.
// Important: Set this as early as possible to prevent misdetection of the consent model
// elsewhere in the code before geolocation or cookie state is resolved.
window.wp_consent_type = 'optin';

// Shared geolocation state (singleton pattern)
let geoState: GeoState = {
	initialized: false,
	countryCode: null,
	region: null,
};

// Tracks whether the modal was opened from the footer "Manage Privacy Preferences" link
// vs the banner's "Customize" button, so closeModal() knows whether to show the banner.
let openedFromFooter = false;
let openModalFromFooter: ( () => void ) | null = null;
let manageLinkConsentListenerRegistered = false;
let tracksConsentListenerRegistered = false;
const gdprManageLinkContexts = new Set< GdprManageLinkContext >();

function shouldShowManagePreferencesLink( config: StoreConfig ): boolean {
	return (
		geoState.countryCode !== null &&
		isGdprCountry( geoState.countryCode, config ) &&
		hasConsentSet()
	);
}

function focusModal(): void {
	setTimeout( () => {
		document.querySelector< HTMLElement >( '.jetpack-cookie-consent__modal' )?.focus();
	}, 0 );
}

const SCROLL_LOCK_CLASS = 'jetpack-cookie-consent-scroll-lock';

function lockScrollAndFocusModal(): void {
	document.body.classList.add( SCROLL_LOCK_CLASS );
	focusModal();
}

function unlockScroll(): void {
	document.body.classList.remove( SCROLL_LOCK_CLASS );
}

function hideConsentUi( context: CookieBannerContext ): void {
	context.showBanner = false;
	context.showModal = false;
	unlockScroll();
	openedFromFooter = false;
}

function setContextCategories(
	context: CookieBannerContext,
	choices: ConsentEventChoices
): ConsentEventChoices {
	context.categories = {
		...context.categories,
		...choices,
	};

	return context.categories;
}

function updateManageLinkContexts( config: StoreConfig ): void {
	const shouldShow = shouldShowManagePreferencesLink( config );
	gdprManageLinkContexts.forEach( context => {
		context.isGdprManageLink = shouldShow;
	} );
}

function registerTracksConsentListener(): void {
	if ( tracksConsentListenerRegistered ) {
		return;
	}

	tracksConsentListenerRegistered = true;
	window.addEventListener( 'wp_consent_saved', ( event: Event ) => {
		const consentEvent = event as CustomEvent< ConsentEvent >;
		if ( consentEvent.detail?.choices && hasAnalyticsConsent( consentEvent.detail.choices ) ) {
			ensureTracksLoaded();
		}
	} );
}

const { actions } = store( 'jetpack/cookie-consent', {
	state: {
		// Cookie banner state
		get showBanner() {
			const context = getContext< CookieBannerContext >();
			return context.showBanner;
		},
		get showModal() {
			const context = getContext< CookieBannerContext >();
			return context.showModal;
		},
		// CCPA state
		get isCcpaRegion() {
			const context = getContext< CcpaContext >();
			return context.isCcpaRegion;
		},
		get showSnackbar() {
			const context = getContext< CcpaContext >();
			return context.showSnackbar;
		},
		// Classic-theme fallback control: only surface it when there's a
		// region-specific required link to show (CCPA opt-out or GDPR manage
		// preferences). The Privacy Policy link just rides along when shown.
		get showFallbackControl() {
			const context = getContext< FooterLinksFallbackContext >();
			return context.isCcpaRegion || context.isGdprManageLink;
		},
	},
	actions: {
		/**
		 * Accept all cookies
		 */
		acceptAll() {
			const context = getContext< CookieBannerContext >();
			const choices = getConsentChoices( true );

			// Update context
			setContextCategories( context, choices );

			trackPrivacyBannerAccept( choices, hasAnalyticsConsent( choices ) );

			// Save consent to WP Consent API (this will set the cookies)
			saveConsentChoices( choices, 'accept_all' );

			hideConsentUi( context );
		},

		/**
		 * Reject all non-required cookies
		 */
		rejectAll() {
			const context = getContext< CookieBannerContext >();
			const choices = getConsentChoices( false );

			// Update context
			setContextCategories( context, choices );

			trackPrivacyBannerReject();

			// Save consent to WP Consent API (this will set the cookies)
			saveConsentChoices( choices, 'reject_all' );

			hideConsentUi( context );
		},

		/**
		 * Save custom preferences
		 */
		savePreferences() {
			const context = getContext< CookieBannerContext >();
			const choices = setContextCategories( context, {
				...getConsentChoices(),
				...context.categories,
			} );

			trackPrivacyBannerAccept( choices, hasAnalyticsConsent( choices ) );

			// Save consent to WP Consent API (this will set the cookies)
			saveConsentChoices( choices, 'accept_selected' );

			hideConsentUi( context );
		},

		/**
		 * Open customization modal
		 * Aligned with WooCommerce Bookings modal pattern
		 */
		openModal() {
			const context = getContext< CookieBannerContext >();

			trackPrivacyBannerCustomize();

			context.showModal = true;
			context.showBanner = false;
			openedFromFooter = false;

			lockScrollAndFocusModal();
		},

		/**
		 * Close customization modal
		 */
		closeModal() {
			const context = getContext< CookieBannerContext >();
			context.showModal = false;

			// When opened from the footer link, don't show the banner on close.
			if ( openedFromFooter ) {
				openedFromFooter = false;
				context.showBanner = false;
			} else {
				context.showBanner = true;
			}

			// Unlock page scroll
			unlockScroll();
		},

		/**
		 * Handle keyboard events on modal (Escape to close, Tab for focus trap)
		 * Aligned with WooCommerce Bookings modal pattern
		 */
		onModalKeyDown: withSyncEvent( ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				actions.closeModal();
			}

			if ( event.key === 'Tab' ) {
				const target = event.target;
				if ( ! ( target instanceof HTMLElement ) ) {
					return;
				}

				const modal = target.closest( '.jetpack-cookie-consent__modal' );
				if ( ! modal ) {
					return;
				}

				const focusableElementsSelectors =
					'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

				const focusableElements = modal.querySelectorAll< HTMLElement >(
					focusableElementsSelectors
				);

				if ( ! focusableElements.length ) {
					return;
				}

				const firstFocusableElement = focusableElements[ 0 ];
				const lastFocusableElement = focusableElements[ focusableElements.length - 1 ];

				if ( ! event.shiftKey && event.target === lastFocusableElement ) {
					event.preventDefault();
					firstFocusableElement.focus();
					return;
				}

				if ( event.shiftKey && event.target === firstFocusableElement ) {
					event.preventDefault();
					lastFocusableElement.focus();
				}
			}
		} ),

		/**
		 * Toggle a non-required cookie category.
		 */
		toggleCategory: withSyncEvent( ( event: Event ) => {
			const target = event.target;

			if ( ! ( target instanceof HTMLInputElement ) ) {
				return;
			}

			const category = target.dataset.consentCategory;
			if ( ! category ) {
				return;
			}

			const context = getContext< CookieBannerContext >();
			context.categories[ category ] = target.checked;
		} ),

		/**
		 * Toggle all categories expanded state
		 */
		toggleDescription() {
			const context = getContext< CookieBannerContext >();
			context.textExpanded = ! context.textExpanded;
		},

		/**
		 * Open consent modal from the footer "Manage Privacy Preferences" link.
		 */
		openManagePreferences: withSyncEvent( ( event: MouseEvent ) => {
			event.preventDefault();

			const hasPriorConsent = hasConsentSet();
			trackPrivacyManageOpen(
				hasPriorConsent,
				hasPriorConsent && hasAnalyticsConsent( readConsentChoices() )
			);

			openModalFromFooter?.();
		} ),

		/**
		 * CCPA Opt-Out action
		 */
		optOut() {
			const context = getContext< CcpaContext >();

			trackPrivacyPolicyOptOut();

			saveConsentChoices( getConsentChoices( false ), 'opt-out' );

			// Show confirmation snackbar
			context.showSnackbar = true;

			// Clear any existing timeout
			if ( context.snackbarTimeout ) {
				clearTimeout( context.snackbarTimeout );
			}

			// Auto-dismiss after 10 seconds
			context.snackbarTimeout = setTimeout( () => {
				context.showSnackbar = false;
				context.snackbarTimeout = null;
			}, 10000 );
		},

		/**
		 * Dismiss snackbar
		 */
		dismissSnackbar() {
			const context = getContext< CcpaContext >();

			// Clear timeout if exists
			if ( context.snackbarTimeout !== null ) {
				clearTimeout( context.snackbarTimeout );
				context.snackbarTimeout = null;
			}

			context.showSnackbar = false;
		},

		/**
		 * Toggle the classic-theme footer-links fallback panel.
		 */
		toggleFallbackPanel() {
			const context = getContext< FooterLinksFallbackContext >();
			context.fallbackExpanded = ! context.fallbackExpanded;
		},

		/**
		 * Handle keyboard events on the footer-links fallback control.
		 * Escape closes the panel and returns focus to the toggle button.
		 */
		onFallbackKeyDown: withSyncEvent( ( event: KeyboardEvent ) => {
			if ( event.key !== 'Escape' ) {
				return;
			}

			const context = getContext< FooterLinksFallbackContext >();
			if ( ! context.fallbackExpanded ) {
				return;
			}

			event.preventDefault();
			context.fallbackExpanded = false;

			// Return focus to the toggle button.
			document.getElementById( 'jetpack-cookie-consent-footer-links-toggle' )?.focus();
		} ),

		/**
		 * Initialize geolocation (singleton pattern - runs once)
		 */
		*initializeGeolocation() {
			// Already initialized, return cached state
			if ( geoState.initialized ) {
				return geoState;
			}

			// getConfig() is not typed, so we need to assert the type.
			const config = getConfig() as unknown as StoreConfig;

			// Geo-based rules are disabled: treat every visitor as unknown so the default
			// (opt-in/show-banner) path applies, without ever calling the geolocation provider.
			if ( config.geoEnabled === false ) {
				geoState = { initialized: true, countryCode: UNKNOWN_COUNTRY_CODE, region: '' };
				return geoState;
			}

			// PHP (class-cookie-consent.php) always emits a fully-normalized nested `geo`, so the
			// store config is already the resolved GeoConfig; no client-side reconciliation needed.
			const geoConfig = config.geo;

			// Check if we already have country code from cookies
			const cachedCountryCode = getCookie( geoConfig.countryCodeCookie );
			const cachedRegion = getCookie( geoConfig.regionCookie );

			if ( cachedCountryCode !== null && cachedRegion !== null ) {
				geoState = {
					initialized: true,
					countryCode: cachedCountryCode,
					region: cachedRegion,
				};
				return geoState;
			}

			// If either the country_code or region cookie is missing, fetch geolocation.
			// `no-store` avoids using the browser HTTP cache for this visitor-specific response.
			try {
				if ( ! geoConfig.apiUrl ) {
					throw new Error( 'Geolocation provider URL is not configured' );
				}

				const response = ( yield fetch( geoConfig.apiUrl, { cache: 'no-store' } ) ) as Response;
				if ( ! response.ok ) {
					throw new Error( 'Geolocation request failed' );
				}

				const data = ( yield response.json() ) as GeoApiResponse;
				const countryCode = data.country_short || UNKNOWN_COUNTRY_CODE;
				const region = data.region || '';

				// Store country code and region in cookies
				setCookie( geoConfig.countryCodeCookie, countryCode, geoConfig.cookieDuration );
				setCookie( geoConfig.regionCookie, region, geoConfig.cookieDuration );

				geoState = {
					initialized: true,
					countryCode,
					region,
				};
			} catch ( error: unknown ) {
				// A custom geo provider URL can fail independently (typo, CORS, 5xx, non-JSON), so
				// surface it at warn level to make a misconfigured endpoint diagnosable in production.
				// eslint-disable-next-line no-console
				console.warn( error );
				if ( ! geoConfig.showOnError ) {
					geoState = {
						initialized: true,
						countryCode: null,
						region: null,
					};
					return geoState;
				}

				// On error, set to unknown so the default path shows the banner.
				geoState = {
					initialized: true,
					countryCode: UNKNOWN_COUNTRY_CODE,
					region: '',
				};
				setCookie( geoConfig.countryCodeCookie, UNKNOWN_COUNTRY_CODE, geoConfig.cookieDuration );
			}

			return geoState;
		},

		/**
		 * Check geolocation and update context accordingly
		 */
		*updateContextFromGeolocation() {
			// Context is not typed, so we need to assert the type.
			const context = getContext() as
				| CookieBannerContext
				| CcpaContext
				| GdprManageLinkContext
				| FooterLinksFallbackContext
				| ( CookieBannerContext & CcpaContext );
			// getConfig() is not typed, so we need to assert the type.
			const config = getConfig() as unknown as StoreConfig;

			// Initialize geolocation (will use cache if already done)
			const geoData: GeoState = yield actions.initializeGeolocation();
			if ( null === geoData.countryCode ) {
				return;
			}

			// Always resolve region-driven consent (CCPA auto-grant, non-regulated implied
			// consent, GDPR+GPC opt-out) — that's independent of the banner. The banner
			// feature only controls whether the banner itself is surfaced; its markup may
			// still render on a banner-disabled site to back the footer modal, so we pass
			// the flag down rather than skipping the whole call.
			if ( 'showBanner' in context ) {
				handleConsentByRegion(
					geoData.countryCode || UNKNOWN_COUNTRY_CODE,
					geoData.region || '',
					config,
					context as CookieBannerContext,
					isFeatureEnabled( 'banner' )
				);
			}

			// Update CCPA context if present
			if ( 'isCcpaRegion' in context ) {
				( context as CcpaContext ).isCcpaRegion = pertainsToCCPA(
					geoData.countryCode || UNKNOWN_COUNTRY_CODE,
					geoData.region || '',
					config
				);
			}

			// Update GDPR manage preferences link context if present
			if ( 'isGdprManageLink' in context ) {
				context.isGdprManageLink = shouldShowManagePreferencesLink( config );
			}
		},
	},
	callbacks: {
		/**
		 * Initialize on mount
		 * This callback runs for each interactive element, but geolocation only happens once.
		 */
		async init(): Promise< void > {
			// Context is not typed, so we need to assert the type
			const context = getContext() as
				| CookieBannerContext
				| CcpaContext
				| GdprManageLinkContext
				| FooterLinksFallbackContext
				| ( CookieBannerContext & CcpaContext );

			registerTracksConsentListener();

			// Initialize CCPA-specific context if present.
			// The footer-links fallback context also exposes isCcpaRegion (to gate
			// the "Do Not Sell" link) but has no snackbar; only touch those keys
			// when this is the full CCPA context.
			if ( 'isCcpaRegion' in context ) {
				context.isCcpaRegion = false;
				if ( 'showSnackbar' in context ) {
					const ccpaCtx = context as CcpaContext;
					ccpaCtx.showSnackbar = false;
					ccpaCtx.snackbarTimeout = null;
				}
			}

			// Initialize cookie banner context if present
			if ( 'showBanner' in context ) {
				if ( ! window.wp_set_consent ) {
					// If WP Consent API is not available, don't do anything
					return;
				}

				const bannerContext = context as CookieBannerContext;

				openModalFromFooter = () => {
					const currentConsent = readConsentChoices();
					setContextCategories( bannerContext, currentConsent );
					bannerContext.showModal = true;
					bannerContext.showBanner = false;
					openedFromFooter = true;

					lockScrollAndFocusModal();
				};

				// getConfig() is not typed, so we need to assert the type.
				const config = getConfig() as unknown as StoreConfig;

				// Force-preview, like the auto-show above, only applies when the banner
				// feature is on (the markup may exist only to back the footer modal).
				if ( config.forcePreview && isFeatureEnabled( 'banner' ) ) {
					context.showBanner = true;
					trackPrivacyBannerView();
					return;
				}

				if ( hasConsentSet() ) {
					// User already made a choice, read from WP Consent API
					if ( hasAnalyticsConsent( readConsentChoices() ) ) {
						ensureTracksLoaded();
					}
					return;
				}
			}

			if ( 'isGdprManageLink' in context ) {
				gdprManageLinkContexts.add( context );

				// Keep the footer link visibility in sync after the visitor saves consent.
				// Without this, the link stays hidden until a full page reload.
				const config = getConfig() as unknown as StoreConfig;
				if ( ! manageLinkConsentListenerRegistered ) {
					manageLinkConsentListenerRegistered = true;
					window.addEventListener( 'wp_consent_saved', () => {
						updateManageLinkContexts( config );
					} );
				}
			}

			// Update context from geolocation (runs once, cached after that)
			await actions.updateContextFromGeolocation();
		},
	},
} );
