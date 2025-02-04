interface Window {
	myJetpackInitialState?: {
		siteSuffix?: string;
		adminUrl?: string;
		lifecycleStats?: {
			ownedProducts?: string[];
		};
		userIsAdmin?: boolean;
		loadAddLicenseScreen?: boolean;
	};
	myJetpackRest?: {
		apiRoot?: string;
		apiNonce?: string;
		registrationNonce?: string;
	};
}
