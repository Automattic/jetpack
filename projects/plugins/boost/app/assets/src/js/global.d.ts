/**
 * Type definitions for the global namespace. i.e.: things we expect to find in window.
 */

/**
 * Internal dependencies
 */
import type { ConnectionStatus } from './stores/connection';
import type { CriticalCssStatus } from './stores/critical-css-status';
import type { ModulesState } from './stores/modules';
import type { BrowserInterfaceIframe, generateCriticalCSS } from 'jetpack-boost-critical-css-gen';

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
		criticalCssDismissRecommendationsNonce?: string;
		criticalCssDismissedRecommendations: string[];
		site: {
			url: string;
			online: boolean;
			assetPath: string;
		};
		config: ModulesState;
		shownAdminNoticeIds: string[];
	};

	// Critical CSS Generator library.
	const CriticalCSSGenerator: {
		generateCriticalCSS: typeof generateCriticalCSS;
		BrowserInterfaceIframe: typeof BrowserInterfaceIframe;
	};
}

export {};
