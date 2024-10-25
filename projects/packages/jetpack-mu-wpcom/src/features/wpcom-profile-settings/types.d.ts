declare global {
	interface Window {
		wpcomProfileSettingsLinkToWpcom: {
			language: {
				link: string;
				text: string;
			};
			synced: {
				link: string;
				text: string;
			};
			email: {
				link: string;
				text: string;
			};
			password: {
				link: string;
				text: string;
			};
			isWpcomAtomicClassic: boolean;
		};
	}
}

export {};
