export type ConsentType = 'optin' | 'optout' | undefined;

export interface ConsentCategory {
	key: string;
	preferenceKey?: string;
	required: boolean;
	defaultChecked: boolean;
	wpConsentMap: string[];
}

export type ConsentTypes = Record< string, boolean >;

export type ConsentEventChoices = Record< string, boolean | undefined >;

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
	[ key: string ]: boolean | undefined;
}

// Global window declarations
declare global {
	interface Window {
		jetpackCookieConsentConfig?: {
			apiUrl: string;
			eventPrefix?: string;
			// Feature toggles. Each feature is enabled unless the consumer sets it to
			// `false`; `tracks` is the only one read today, but the map stays open so new
			// features can be gated without a type change.
			features?: {
				tracks?: boolean;
				[ feature: string ]: boolean | undefined;
			};
			categories?: ConsentCategory[];
			nonce?: string;
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
