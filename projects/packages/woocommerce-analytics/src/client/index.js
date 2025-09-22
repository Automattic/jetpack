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
	const analytics = new Analytics( sessionManager, {
		eventQueue: window.wcAnalytics.eventQueue,
		commonProps: window.wcAnalytics.commonProps,
		features: window.wcAnalytics.features,
		pages: window.wcAnalytics.pages,
	} );
	analytics.init();
} );
