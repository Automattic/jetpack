export interface JetpackSeoInitialState {
	adminUrl: string;
	seoAdminUrl: string;
	siteUrl: string;
	siteSuffix: string;
	blogId: number | null;
	isSiteConnected: boolean;
	isUserConnected: boolean;
	isAtomic: boolean;
	isSimple: boolean;
	userIsAdmin: boolean;
	seoEnabled: boolean;
	packageVersion: string;
}
