declare global {
	interface Window {
		wpcomProfileSettingsLinkToWpcom: {
			email: {
				link: string;
				text: string;
			};
			password: {
				link: string;
				text: string;
			};
			isWpcomSimple: boolean;
		};
	}
}

export {};
