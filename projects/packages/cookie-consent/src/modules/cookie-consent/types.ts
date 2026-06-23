export type ConsentType = 'optin' | 'optout' | undefined;

export interface ConsentTypes {
	functional: boolean;
	analytics: boolean;
	marketing: boolean;
}

export interface ConsentEventChoices {
	analytics?: boolean;
	advertising?: boolean;
}

export type ConsentEventType =
	| 'accept_all'
	| 'accept_selected'
	| 'reject_all'
	| 'auto_granted'
	| 'opt-out';

export interface ConsentEvent {
	eventType: ConsentEventType;
	choices: ConsentEventChoices;
}

export interface TrackingProperties {
	path: string;
	domain: string;
	[ key: string ]: string | number | boolean | undefined;
}

export interface ConsentPreferences {
	required: boolean;
	analytics: boolean;
	advertising: boolean;
}

// Global window declarations
declare global {
	interface Window {
		jetpackCookieConsentConfig?: {
			apiUrl: string;
			nonceUrl: string;
			eventPrefix?: string;
		};
		wp_set_consent?: ( category: string, value: 'allow' | 'deny' ) => void;
		wp_consent_type?: ConsentType;
		_tkq?: Array< [ string, ...unknown[] ] >;
		_stq?: Array< [ string, ...unknown[] ] >;
	}
	interface Navigator {
		globalPrivacyControl?: boolean;
	}
}
