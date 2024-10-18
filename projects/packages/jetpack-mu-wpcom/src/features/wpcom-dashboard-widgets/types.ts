export interface Site {
	name: string;
	domain: string;
	iconUrl: string;
	siteIntent: string;
}

export interface DashboardWidgetsData {
	site: Site;
}

export interface ConfigData {}

declare global {
	interface Window {
		wpcomDashboardWidgetsData: DashboardWidgetsData;
		configData: ConfigData;
	}
}
