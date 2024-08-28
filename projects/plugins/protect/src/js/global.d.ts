declare module '*.scss';
declare module '*.png';

interface Window {
	jetpackProtectInitialState?: {
		status?: Record< string, unknown >;
		fixerStatus?: Record< string, unknown >;
		scanHistory?: Record< string, unknown >;
		credentials?: unknown[];
		hasPlan?: boolean;
		jetpackScan?: Record< string, unknown >;
		waf?: Record< string, unknown >;
		onboardingProgress?: string[];
		adminUrl?: string;
	};
}
