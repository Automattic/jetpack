declare global {
	interface Window {
		wpcomSiteUrl: {
			siteUrl: string;
			homeUrl: string;
			siteSlug: string;
			optionsGeneralUrl: string;
		};
	}
}

export {};
