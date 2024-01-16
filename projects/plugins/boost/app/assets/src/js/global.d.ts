/**
 * Type definitions for the global namespace. i.e.: things we expect to find in window.
 */

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
		version: string;
		api: {
			namespace: string;
			prefix: string;
		};
		site: {
			domain: string;
			url: string;
			online: boolean;
			isAtomic: boolean;
		};
		assetPath: string;
		pluginDirUrl: string;
		canResizeImages: boolean;
		postTypes: {
			[ key: string ]: string;
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
