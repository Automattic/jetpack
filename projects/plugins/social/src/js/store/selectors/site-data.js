const siteDataSelectors = {
	getAdminUrl: state => state.siteData?.adminUrl ?? null,
	getAPIRootUrl: state => state.siteData?.apiRoot ?? null,
	getAPINonce: state => state.siteData?.apiNonce ?? null,
	getRegistrationNonce: state => state.siteData?.registrationNonce ?? null,
	getSiteSuffix: state => state.siteData?.siteSuffix ?? null,
	getPluginVersion: state => state.siteData?.pluginVersion ?? null,
};

export default siteDataSelectors;
