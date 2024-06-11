export const MY_JETPACK_MY_PLANS_MANAGE_SOURCE = 'my-jetpack-my-plans-manage';
export const MY_JETPACK_MY_PLANS_PURCHASE_SOURCE = 'my-jetpack-my-plans-purchase';
export const MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE = 'my-jetpack-my-plans-purchase-no-site';
export const MY_JETPACK_PRODUCT_CHECKOUT = 'my-jetpack-product-checkout';

export const MyJetpackRoutes = {
	Home: '/',
	Connection: '/connection',
	AddAkismet: '/add-akismet',
	AddAntiSpam: '/add-anti-spam', // Old route for Anti Spam
	AddBackup: '/add-backup',
	AddBoost: '/add-boost',
	AddCRM: '/add-crm',
	AddCreator: '/add-creator',
	AddJetpackAI: '/add-jetpack-ai',
	AddExtras: '/add-extras',
	AddProtect: '/add-protect',
	AddScan: '/add-scan',
	AddSocial: '/add-social',
	AddSearch: '/add-search',
	AddVideoPress: '/add-videopress',
	AddStats: '/add-stats',
	AddLicense: '/add-license',
	RedeemToken: '/redeem-token',
} as const;

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	MODULE_DISABLED: 'module_disabled',
	SITE_CONNECTION_ERROR: 'site_connection_error',
	ABSENT: 'plugin_absent',
	ABSENT_WITH_PLAN: 'plugin_absent_with_plan',
	NEEDS_PURCHASE: 'needs_purchase',
	NEEDS_PURCHASE_OR_FREE: 'needs_purchase_or_free',
	NEEDS_FIRST_SITE_CONNECTION: 'needs_first_site_connection',
	USER_CONNECTION_ERROR: 'user_connection_error',
	CAN_UPGRADE: 'can_upgrade',
};
