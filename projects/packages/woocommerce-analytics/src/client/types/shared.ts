/**
 * Shared type definitions for WooCommerce Analytics
 */

export interface SessionCookieData {
	sessionId: string;
	landingPage: string;
	expires: string;
	isEngaged?: boolean;
}

export interface AnalyticsConfig {
	eventQueue: Array< { eventName: string; props?: Record< string, unknown > } >;
	commonProps: Record< string, unknown >;
	features: Record< string, boolean >;
	pages: Record< string, boolean >;
}

export type RecordEventFunction = ( event: string, properties?: Record< string, unknown > ) => void;

export interface QueuedEvent {
	eventName: string;
	props?: Record< string, unknown >;
}
