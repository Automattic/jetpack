export const MY_JETPACK_MY_PLANS_MANAGE_SOURCE = 'my-jetpack-my-plans-manage';
export const MY_JETPACK_MY_PLANS_PURCHASE_SOURCE = 'my-jetpack-my-plans-purchase';
export const MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE = 'my-jetpack-my-plans-purchase-no-site';
export const MY_JETPACK_PRODUCT_CHECKOUT = 'my-jetpack-product-checkout';

export const MyJetpackRoutes = {
	Home: '/:section',
	Connection: '/connection',
	ConnectionSkipPricing: '/connection?skip_pricing=true',
	AddAkismet: '/add-akismet',
	AddAntiSpam: '/add-anti-spam', // Old route for Anti Spam
	AddBackup: '/add-backup',
	AddBoost: '/add-boost',
	AddComplete: '/add-complete',
	AddCRM: '/add-crm',
	AddJetpackAI: '/add-jetpack-ai',
	AddExtras: '/add-extras',
	AddGrowth: '/add-growth',
	AddProtect: '/add-protect/:feature?',
	AddScan: '/add-scan',
	AddSocial: '/add-social',
	AddSearch: '/add-search',
	AddSecurity: '/add-security',
	AddVideoPress: '/add-videopress',
	AddStats: '/add-stats',
	AddLicense: '/add-license',
	JetpackAi: '/jetpack-ai',
	ProtectDetails: '/protect-details',
	RedeemToken: '/redeem-token',
} as const;

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	MODULE_DISABLED: 'module_disabled',
	SITE_CONNECTION_ERROR: 'site_connection_error',
	ABSENT: 'plugin_absent',
	ABSENT_WITH_PLAN: 'plugin_absent_with_plan',
	NEEDS_PLAN: 'needs_plan',
	NEEDS_ACTIVATION: 'needs_activation',
	NEEDS_FIRST_SITE_CONNECTION: 'needs_first_site_connection',
	USER_CONNECTION_ERROR: 'user_connection_error',
	CAN_UPGRADE: 'can_upgrade',
	EXPIRING_SOON: 'expiring',
	EXPIRED: 'expired',
	NEEDS_ATTENTION__ERROR: 'needs_attention_error',
	NEEDS_ATTENTION__WARNING: 'needs_attention_warning',
};

export const JETPACK_PRODUCTS_WITH_CARD = [
	'anti-spam',
	'backup',
	'boost',
	'crm',
	'jetpack-ai',
	'jetpack-forms',
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
	'scan',
	'security',
	'site-accelerator',
] as const;

export const JETPACK_PRODUCTS = [
	...JETPACK_PRODUCTS_WITH_CARD,
	...JETPACK_PRODUCTS_WITHOUT_CARD,
] as const;

export const JETPACK_PRODUCTS_NOT_FOR_MULTISITE: Array< ( typeof JETPACK_PRODUCTS )[ number ] > = [
	'backup',
	'scan',
];

export const PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN = [ 'anti-spam', 'boost', 'crm' ];

/**
 * Non-paid here means that the module is available for free users,
 * i.e. it does not have a paid plan associated with it.
 */
export const JETPACK_NON_PAID_MODULES = [
	'account-protection',
	'blaze',
	'blocks',
	'canonical-urls',
	'carousel',
	'comment-likes',
	'comments',
	'contact-form',
	'copy-post',
	'custom-content-types',
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
	'podcast',
	'post-by-email',
	'post-list',
	'protect',
	'wpcom-reader',
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
