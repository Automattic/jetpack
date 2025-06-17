export const JETPACK_PRODUCTS_WITH_CARD = [
	'ai',
	'jetpack-ai',
	'anti-spam',
	'backup',
	'boost',
	'crm',
	'scan',
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

// TODO Update this list
export const JETPACK_NON_PAID_MODULES = [
	'account-protection',
	'carousel',
	'comment-likes',
	'likes',
	'monitor',
	'sharedaddy',
	'shortlinks',
	'sso',
	'waf',
] as const;

// TODO Update this list
export const JETPACK_PAID_MODULES = [
	'blaze',
	'blocks',
	'comments',
	'contact-form',
	'copy-post',
	'custom-content-types',
	'google-fonts',
	'gravatar-hovercards',
	'infinite-scroll',
	'json-api',
	'latex',
	'markdown',
	'notes',
	'photon',
	'photon-cdn',
	'post-by-email',
	'post-list',
	'protect',
	'publicize',
	'related-posts',
	'search',
	'seo-tools',
	'shortcodes',
	'sitemaps',
	'stats',
	'subscriptions',
	'tiled-gallery',
	'vaultpress',
	'verification-tools',
	'videopress',
	'widget-visibility',
	'widgets',
	'woocommerce-analytics',
	'wordads',
] as const;

export const JETPACK_MODULES = [ ...JETPACK_NON_PAID_MODULES, ...JETPACK_PAID_MODULES ] as const;
