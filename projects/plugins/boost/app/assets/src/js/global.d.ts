/**
 * Type definitions for the global namespace. i.e.: things we expect to find in window.
 */

import type { BrowserInterfaceIframe, generateCriticalCSS } from 'jetpack-boost-critical-css-gen';

type ProductStatus =
	| 'active'
	| 'inactive'
	| 'module_disabled'
	| 'site_connection_error'
	| 'plugin_absent'
	| 'plugin_absent_with_plan'
	| 'needs_plan'
	| 'needs_activation'
	| 'needs_first_site_connection'
	| 'user_connection_error'
	| 'can_upgrade';

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
			host: string;
		};
		assetPath: string;
		pluginDirUrl: string;
		canResizeImages: boolean;
		postTypes: {
			[ key: string ]: string;
		};
		product?: {
			tiers: string[];
			features_by_tier: Array< {
				name: string;
				info: {
					title?: string;
					content: string;
				};
				tiers: {
					free: {
						included: boolean;
						description?: string;
						info?: {
							title?: string;
							content: string;
							class?: string;
						};
					};
					upgraded: {
						included: boolean;
						description?: string;
						info?: {
							title?: string;
							content: string;
							class?: string;
						};
					};
				};
			} >;
		};
	};

	// Critical CSS Generator library.
	const CriticalCSSGenerator: {
		generateCriticalCSS: typeof generateCriticalCSS;
		BrowserInterfaceIframe: typeof BrowserInterfaceIframe;
	};

	const jpTracksAJAX: {
		record_ajax_event: (
			eventName: string,
			eventType: string,
			eventProp: TracksEventProperites
		) => JQueryXHR;
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
