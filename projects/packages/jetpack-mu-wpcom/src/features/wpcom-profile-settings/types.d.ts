interface WpcomProfileSettingsLinkToWpcom {
	emailSettingsLinkText: string;
}

declare global {
	interface Window {
		wpcomProfileSettingsLinkToWpcom: WpcomProfileSettingsLinkToWpcom;
	}
}

export {};
