/**
 * The script data the toolkit reads, declared here so that projects type-checking
 * the toolkit's source see it without reaching into another package.
 */
import '@automattic/jetpack-script-data';

declare module '@automattic/jetpack-script-data' {
	interface PremiumAnalyticsScriptData {
		// Whether CSV export controls should render. Defaults to true server-side.
		csv_exports_enabled?: boolean;
	}

	interface JetpackScriptData {
		premium_analytics?: PremiumAnalyticsScriptData;
	}
}
