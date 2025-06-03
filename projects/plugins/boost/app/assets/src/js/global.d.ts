/**
 * Type definitions for the global namespace. i.e.: things we expect to find in window.
 */

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
			hasCache: boolean;
		};
		assetPath: string;
		pluginDirUrl: string;
		canResizeImages: boolean;
		postTypes: {
			[ key: string ]: string;
		};
		developmentFeatures: string[];
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
