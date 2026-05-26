// Identity default for `Singleton_Template_Cpt`-backed dashboard configs
// (overlay + search template). Empty defaults so a missing initial-state
// blob safely renders as "no customization, no link" instead of crashing
// on undefined property reads.
const singletonTemplateConfigDefault = {
	enabled: false,
	editorUrl: null,
	postType: null,
	isCustomized: false,
};

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
	isBlockOverlayEnabled: state => state.siteData?.blockOverlayEnabled ?? false,
	// Editor affordances for the blocks-powered Overlay. Surface in the
	// Overlay search card when the active experience is `overlay_blocks`
	// (the PHP gate). Returns the whole config blob so callers can
	// destructure `{ enabled, editorUrl, postType, isCustomized }` in one
	// go. `postType` is the CPT slug the "Restore default" link passes to
	// `restApi.resetSearchTemplate()`; it's null when the admin lacks the
	// edit gate so the link is hidden in that state.
	getBlockTemplateOverlayConfig: state =>
		state.siteData?.blockTemplateOverlay ?? singletonTemplateConfigDefault,
	// Same shape as `getBlockTemplateOverlayConfig`, sibling under the
	// same singleton-CPT pattern — see `Singleton_Template_Cpt` on the
	// PHP side. Used by the Embedded card on classic themes (which
	// can't reach the Site Editor) to surface "Edit search template" +
	// "Restore default" links pointed at the `Search_Template` CPT
	// instead of the FSE template editor.
	getSearchTemplateConfig: state =>
		state.siteData?.searchTemplate ?? singletonTemplateConfigDefault,
	isWooCommerceActive: state => state.siteData?.isWooCommerceActive ?? false,
	getActiveThemeStylesheet: state => state.siteData?.activeThemeStylesheet ?? '',
	// Defaults to true so Embedded is never blocked when the flag is absent
	// (older initial state) — fail open rather than hide a working option.
	isBlockTheme: state => state.siteData?.themeSupportsBlocks ?? true,
};

export default siteDataSelectors;
