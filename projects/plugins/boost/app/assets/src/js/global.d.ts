/**
 * Type definitions for the global namespace. i.e.: things we expect to find in window.
 */

import type { ConnectionStatus } from './stores/connection';
import type { CriticalCssStatus } from './stores/critical-css-status';
import type { Optimizations } from './stores/modules';
import type { BrowserInterfaceIframe, generateCriticalCSS } from 'jetpack-boost-critical-css-gen';

// <reference types ="@types/jquery"/>

declare global {
	const wpApiSettings: {
		root: string;
		nonce: string;
	};

	// Constants provided by the plugin.
	// eslint-disable-next-line camelcase
	const Jetpack_Boost: {
		preferences: {
			showRatingPrompt: boolean;
			showScorePrompt: boolean;
			prioritySupport: boolean;
		};
		version: string;
		api: {
			namespace: string;
			prefix: string;
		};
		connectionIframeOriginUrl: string;
		connection: ConnectionStatus;
		criticalCssStatus?: CriticalCssStatus;
		showRatingPromptNonce?: string;
		showScorePromptNonce?: string;
		criticalCssDismissedRecommendations: string[];
		dismissedScorePrompts: string[];
		site: {
			domain: string;
			url: string;
			online: boolean;
			assetPath: string;
			getStarted: boolean;
		};
		optimizations: Optimizations;
		shownAdminNoticeIds: string[];
		nonces: {
			[ key: string ]: string;
		};
		pricing: {
			yearly?: {
				priceBefore: number;
				priceAfter: number;
				currencyCode: string;
			};
		};
	};

	// Critical CSS Generator library.
	const CriticalCSSGenerator: {
		generateCriticalCSS: typeof generateCriticalCSS;
		BrowserInterfaceIframe: typeof BrowserInterfaceIframe;
	};

	type TracksEventProperties = { [ key: string ]: string | number };

	const jpTracksAJAX: {
		// eslint-disable-next-line camelcase
		record_ajax_event(
			eventName: string,
			eventType: string,
			eventProp: TracksEventProperites
		): JQueryXHR;
	};
}

export {};
