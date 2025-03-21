export const MY_JETPACK_MY_PLANS_MANAGE_SOURCE = 'my-jetpack-my-plans-manage';
export const MY_JETPACK_MY_PLANS_PURCHASE_SOURCE = 'my-jetpack-my-plans-purchase';
export const MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE = 'my-jetpack-my-plans-purchase-no-site';
export const MY_JETPACK_PRODUCT_CHECKOUT = 'my-jetpack-product-checkout';

export const MyJetpackRoutes = {
	Home: '/',
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
	Onboarding: '/onboarding',
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
