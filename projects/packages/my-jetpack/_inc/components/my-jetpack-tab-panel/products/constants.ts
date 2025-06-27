export const JETPACK_PRODUCTS_WITH_CARD = [
	'anti-spam',
	'backup',
	'boost',
	'crm',
	'jetpack-ai',
	'protect',
	'search',
	'social',
	'stats',
	'videopress',
] as const;

export const JETPACK_PRODUCTS_WITHOUT_CARD = [
	'complete',
	'creator',
	'extras',
	'newsletter',
	'protect',
	'related-posts',
	'security',
	'site-accelerator',
] as const;

export const PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN = [ 'anti-spam', 'boost', 'crm' ];

/**
 * Non-paid here means that the module is available for free users,
 * i.e. it does not have a paid plan associated with it.
 */
export const JETPACK_NON_PAID_MODULES = [
	'account-protection',
	'blaze',
	'blocks',
	'carousel',
	'comment-likes',
	'comments',
	'contact-form',
	'copy-post',
	'google-fonts',
	'gravatar-hovercards',
	'infinite-scroll',
	'json-api',
	'latex',
	'likes',
	'markdown',
	'monitor',
	'notes',
	'photon',
	'photon-cdn',
	'post-by-email',
	'post-list',
	'protect',
	'related-posts',
	'seo-tools',
	'sharedaddy',
	'shortcodes',
	'shortlinks',
	'sitemaps',
	'sso',
	'subscriptions',
	'tiled-gallery',
	'verification-tools',
	'waf',
	'widget-visibility',
	'widgets',
] as const;

export const JETPACK_PAID_MODULES = [
	'publicize',
	'search',
	'stats',
	'vaultpress',
	'videopress',
	'woocommerce-analytics',
	'wordads',
] as const;

export const JETPACK_MODULES = [ ...JETPACK_NON_PAID_MODULES, ...JETPACK_PAID_MODULES ] as const;
