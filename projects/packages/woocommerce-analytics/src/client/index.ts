/* global jQuery */

/**
 * Internal dependencies
 */
import { Analytics } from './analytics';
import { consentManager } from './consent';
import SessionManager from './session-manager';

jQuery( () => {
	if ( ! window.wcAnalytics ) {
		return;
	}

	// Check for consent before initializing analytics
	if ( consentManager.hasStatisticsConsent() ) {
		initializeAnalytics();
		return;
	}

	// Set up consent change listener to initialize when consent is granted
	consentManager.addConsentChangeListener( ( hasConsent: boolean ) => {
		if ( hasConsent ) {
			initializeAnalytics();
		}
	} );

	/**
	 * Initialize analytics
	 */
	function initializeAnalytics() {
		const sessionManager = new SessionManager();
		const analytics = new Analytics( sessionManager, {
			eventQueue: window.wcAnalytics.eventQueue,
			commonProps: window.wcAnalytics.commonProps,
			features: window.wcAnalytics.features,
			pages: window.wcAnalytics.pages,
		} );
		analytics.init();
	}
} );
