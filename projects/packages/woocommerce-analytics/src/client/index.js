/* global jQuery */

/**
 * Internal dependencies
 */
import { Analytics } from './analytics';
import SessionManager from './session-manager';

jQuery( document ).ready( () => {
	if ( ! window.wcAnalytics ) {
		return;
	}

	const sessionManager = new SessionManager();

	// Only initialize session manager if ClickHouse feature is enabled.
	// Session events are only needed if ClickHouse is enabled.
	if ( window.wcAnalytics.features.ch ) {
		sessionManager.init();
	}

	const analytics = new Analytics( sessionManager, {
		eventQueue: window.wcAnalytics.eventQueue,
		commonProps: window.wcAnalytics.commonProps,
		features: window.wcAnalytics.features,
		pages: window.wcAnalytics.pages,
	} );
	analytics.init();
} );
