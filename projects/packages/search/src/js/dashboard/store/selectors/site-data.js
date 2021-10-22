const siteDataSelectors = {
	getAPIRootUrl: state => state.siteData?.WP_API_root ?? null,
	getAPINonce: state => state.siteData?.WP_API_nonce ?? null,
	getRegistrationNonce: state => state.siteData?.registrationNonce ?? null,
	getSiteAdminUrl: state => state.siteData?.siteAdminUrl ?? null,
	isInstantSearchPromotionActive: state => state.siteData?.showPromotions ?? true,
};

export default siteDataSelectors;
