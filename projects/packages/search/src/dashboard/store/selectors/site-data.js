const siteDataSelectors = {
	getAPIRootUrl: state => state.siteData?.WP_API_root ?? null,
	getAPINonce: state => state.siteData?.WP_API_nonce ?? null,
	getRegistrationNonce: state => state.siteData?.registrationNonce ?? null,
	getSiteAdminUrl: state => state.siteData?.adminUrl ?? null,
	isInstantSearchPromotionActive: state => state.siteData?.showPromotions ?? true,
	getBlogId: state => state.siteData?.blogId ?? 0,
	getVersion: state => state.siteData?.version ?? 'development',
	getCalypsoSlug: state => state.siteData?.calypsoSlug,
	getPriceBefore: state => state.siteData.pricing.full_price ?? 0,
	getPriceAfter: state => state.siteData.pricing.discount_price ?? 0,
	getPriceCurrencyCode: state => state.siteData.pricing.currency_code ?? 'USD',
};

export default siteDataSelectors;
