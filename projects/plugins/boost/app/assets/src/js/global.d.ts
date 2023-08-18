/**
 * Type definitions for the global namespace. i.e.: things we expect to find in window.
 */

import type { ConnectionStatus } from './stores/connection';
import type { Optimizations } from './stores/modules';
import type { BrowserInterfaceIframe, generateCriticalCSS } from 'jetpack-boost-critical-css-gen';

// <reference types ="@types/jquery"/>

declare global {
	const wpApiSettings: {
		root: string;
		nonce: string;
	};

	const jbImageGuide: {
		proxyNonce: string;
		ajax_url: string;
	};

	// Constants provided by the plugin.
	const Jetpack_Boost: {
		preferences: {
			showRatingPrompt: boolean;
			showScorePrompt: boolean;
			prioritySupport: boolean;
		};
		isPremium: boolean;
		version: string;
		api: {
			namespace: string;
			prefix: string;
		};
		connectionIframeOriginUrl: string;
		connection: ConnectionStatus;
		showRatingPromptNonce?: string;
		showScorePromptNonce?: string;
		dismissedScorePrompts: string[];
		superCache: {
			pluginActive: boolean;
			cacheEnabled: boolean;
			cachePageSecret?: string;
		};
		site: {
			domain: string;
			url: string;
			online: boolean;
			assetPath: string;
			getStarted: boolean;
			canResizeImages: boolean;
			postTypes: {
				[ key: string ]: string;
			};
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
				isIntroductoryOffer: boolean;
			};
		};
	};

	// Critical CSS Generator library.
	const CriticalCSSGenerator: {
		generateCriticalCSS: typeof generateCriticalCSS;
		BrowserInterfaceIframe: typeof BrowserInterfaceIframe;
	};

	const jpTracksAJAX: {
		record_ajax_event(
			eventName: string,
			eventType: string,
			eventProp: TracksEventProperites
		): JQueryXHR;
	};

	const jetpackBoostAnalytics: {
		tracksData: {
			userData: {
				userid: number;
				username: string;
			};
			blogId: number;
		};
	};
}

export {};
