const siteDataSelectors = {
	getAPIRootUrl: state => state.siteData?.WP_API_root ?? null,
	getWpcomOriginApiUrl: state => state.siteData?.wpcomOriginApiUrl ?? null,
	getAPINonce: state => state.siteData?.WP_API_nonce ?? null,
	getRegistrationNonce: state => state.siteData?.registrationNonce ?? null,
	getSiteAdminUrl: state => state.siteData?.adminUrl ?? null,
	getReaderChatGuidelinesUrl: state => state.siteData?.readerChatGuidelinesUrl ?? '',
	isAIAgentAccessAvailable: state => state.siteData?.aiAgentAccessAvailable ?? false,
	getAIAgentAccessGuidelinesUrl: state => state.siteData?.aiAgentAccessGuidelinesUrl ?? '',
	isInstantSearchPromotionActive: state => state.siteData?.showPromotions ?? true,
	getBlogId: state => state.siteData?.blogId ?? 0,
	getVersion: state => state.siteData?.version ?? 'development',
	getCalypsoSlug: state => state.siteData?.calypsoSlug,
	getPostTypes: state => state.siteData?.postTypes,
	getSiteTitle: state => state.siteData?.title || '',
	isWpcom: state => state.siteData?.isWpcom ?? false,
	isPlanJustUpgraded: state => state.siteData?.isPlanJustUpgraded ?? false,
	isSearchBlocksEnabled: state => state.siteData?.searchBlocksEnabled ?? false,
	getActiveThemeStylesheet: state => state.siteData?.activeThemeStylesheet ?? '',
	// Defaults to true so Embedded is never blocked when the flag is absent
	// (older initial state) — fail open rather than hide a working option.
	isBlockTheme: state => state.siteData?.themeSupportsBlocks ?? true,
};

export default siteDataSelectors;
