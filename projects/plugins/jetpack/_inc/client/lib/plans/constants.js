import { includes } from 'lodash';

// plans constants
export const PLAN_BUSINESS = 'business-bundle';
export const PLAN_BUSINESS_2_YEARS = 'business-bundle-2y';
export const PLAN_BUSINESS_3_YEARS = 'business-bundle-3y';
export const PLAN_BUSINESS_MONTHLY = 'business-bundle-monthly';
export const PLAN_BUSINESS_TRIAL = 'wp_bundle_hosting_trial_monthly';
export const PLAN_MIGRATION_TRIAL = 'wp_bundle_migration_trial_monthly';
export const PLAN_100_YEARS = 'wp_com_hundred_year_bundle_centennially';
export const PLAN_ECOMMERCE = 'ecommerce-bundle';
export const PLAN_ECOMMERCE_2_YEARS = 'ecommerce-bundle-2y';
export const PLAN_ECOMMERCE_3_YEARS = 'ecommerce-bundle-3y';
export const PLAN_ECOMMERCE_MONTHLY = 'ecommerce-bundle-monthly';
export const PLAN_WOOEXPRESS_ESSENTIALS = 'wooexpress-small-bundle-yearly';
export const PLAN_WOOEXPRESS_ESSENTIALS_MONTHLY = 'wooexpress-small-bundle-monthly';
export const PLAN_WOOEXPRESS_PERFORMANCE = 'wooexpress-medium-bundle-yearly';
export const PLAN_WOOEXPRESS_PERFORMANCE_MONTHLY = 'wooexpress-medium-bundle-monthly';
export const PLAN_WOOEXPRESS_TRIAL = 'ecommerce-trial-bundle-monthly';
export const PLAN_PREMIUM = 'value_bundle';
export const PLAN_PREMIUM_2_YEARS = 'value_bundle-2y';
export const PLAN_PREMIUM_3_YEARS = 'value_bundle-3y';
export const PLAN_PREMIUM_MONTHLY = 'value_bundle-monthly';
export const PLAN_PERSONAL = 'personal-bundle';
export const PLAN_PERSONAL_2_YEARS = 'personal-bundle-2y';
export const PLAN_PERSONAL_3_YEARS = 'personal-bundle-3y';
export const PLAN_PERSONAL_MONTHLY = 'personal-bundle-monthly';
export const PLAN_STARTER = 'starter-plan';
export const PLAN_PRO = 'pro-plan';
export const PLAN_FREE = 'free_plan';
export const PLAN_JETPACK_FREE = 'jetpack_free';
export const PLAN_JETPACK_PREMIUM = 'jetpack_premium';
export const PLAN_JETPACK_BUSINESS = 'jetpack_business';
export const PLAN_JETPACK_PERSONAL = 'jetpack_personal';
export const PLAN_JETPACK_PREMIUM_MONTHLY = 'jetpack_premium_monthly';
export const PLAN_JETPACK_BUSINESS_MONTHLY = 'jetpack_business_monthly';
export const PLAN_JETPACK_PERSONAL_MONTHLY = 'jetpack_personal_monthly';
export const PLAN_JETPACK_BACKUP_T0_YEARLY = 'jetpack_backup_t0_yearly';
export const PLAN_JETPACK_BACKUP_T0_MONTHLY = 'jetpack_backup_t0_monthly';
export const PLAN_JETPACK_BACKUP_T1_BI_YEARLY = 'jetpack_backup_t1_bi_yearly';
export const PLAN_JETPACK_BACKUP_T1_YEARLY = 'jetpack_backup_t1_yearly';
export const PLAN_JETPACK_BACKUP_T1_MONTHLY = 'jetpack_backup_t1_monthly';
export const PLAN_JETPACK_BACKUP_T2_YEARLY = 'jetpack_backup_t2_yearly';
export const PLAN_JETPACK_BACKUP_T2_MONTHLY = 'jetpack_backup_t2_monthly';
export const PLAN_JETPACK_SEARCH_BI_YEARLY = 'jetpack_search_bi_yearly';
export const PLAN_JETPACK_SEARCH = 'jetpack_search';
export const PLAN_JETPACK_SEARCH_FREE = 'jetpack_search_free';
export const PLAN_JETPACK_SEARCH_MONTHLY = 'jetpack_search_monthly';
export const PLAN_JETPACK_STARTER = 'jetpack_starter_yearly';
export const PLAN_JETPACK_STARTER_MONTHLY = 'jetpack_starter_monthly';
export const PLAN_JETPACK_SECURITY_T1_BI_YEARLY = 'jetpack_security_t1_bi_yearly';
export const PLAN_JETPACK_SECURITY_T1_YEARLY = 'jetpack_security_t1_yearly';
export const PLAN_JETPACK_SECURITY_T1_MONTHLY = 'jetpack_security_t1_monthly';
export const PLAN_JETPACK_SECURITY_T2_YEARLY = 'jetpack_security_t2_yearly';
export const PLAN_JETPACK_SECURITY_T2_MONTHLY = 'jetpack_security_t2_monthly';
export const PLAN_JETPACK_COMPLETE_BI_YEARLY = 'jetpack_complete_bi_yearly';
export const PLAN_JETPACK_COMPLETE = 'jetpack_complete';
export const PLAN_JETPACK_COMPLETE_MONTHLY = 'jetpack_complete_monthly';
export const PLAN_JETPACK_BOOST_BI_YEARLY = 'jetpack_boost_bi_yearly';
export const PLAN_JETPACK_BOOST = 'jetpack_boost_yearly';
export const PLAN_JETPACK_BOOST_MONTHLY = 'jetpack_boost_monthly';
export const PLAN_JETPACK_AI_MONTHLY = 'jetpack_ai_monthly';
export const PLAN_JETPACK_AI_YEARLY = 'jetpack_ai_yearly';
export const PLAN_JETPACK_AI_BI_YEARLY = 'jetpack_ai_bi_yearly';
export const PLAN_WPCOM_SEARCH = 'wpcom_search';
export const PLAN_WPCOM_SEARCH_MONTHLY = 'wpcom_search_monthly';
export const PLAN_JETPACK_SCAN_BI_YEARLY = 'jetpack_scan_bi_yearly';
export const PLAN_JETPACK_SCAN = 'jetpack_scan';
export const PLAN_JETPACK_SCAN_MONTHLY = 'jetpack_scan_monthly';
export const PLAN_JETPACK_ANTI_SPAM_BI_YEARLY = 'jetpack_anti_spam_bi_yearly';
export const PLAN_JETPACK_ANTI_SPAM = 'jetpack_anti_spam';
export const PLAN_JETPACK_ANTI_SPAM_MONTHLY = 'jetpack_anti_spam_monthly';
export const PLAN_JETPACK_VIDEOPRESS_BI_YEARLY = 'jetpack_videopress_bi_yearly';
export const PLAN_JETPACK_VIDEOPRESS = 'jetpack_videopress';
export const PLAN_JETPACK_VIDEOPRESS_MONTHLY = 'jetpack_videopress_monthly';
export const PLAN_HOST_BUNDLE = 'host-bundle';
export const PLAN_WPCOM_ENTERPRISE = 'wpcom-enterprise';
export const PLAN_VIP = 'vip';
export const PLAN_CHARGEBACK = 'chargeback';
export const PLAN_JETPACK_SOCIAL_BASIC_BI_YEARLY = 'jetpack_social_basic_bi_yearly';
export const PLAN_JETPACK_SOCIAL_BASIC = 'jetpack_social_basic_yearly';
export const PLAN_JETPACK_SOCIAL_BASIC_MONTHLY = 'jetpack_social_basic_monthly';
export const PLAN_JETPACK_SOCIAL_ADVANCED_BI_YEARLY = 'jetpack_social_advanced_bi_yearly';
export const PLAN_JETPACK_SOCIAL_ADVANCED = 'jetpack_social_advanced_yearly';
export const PLAN_JETPACK_SOCIAL_ADVANCED_MONTHLY = 'jetpack_social_advanced_monthly';
export const PLAN_JETPACK_SOCIAL_V1_BI_YEARLY = 'jetpack_social_v1_bi_yearly';
export const PLAN_JETPACK_SOCIAL_V1 = 'jetpack_social_v1_yearly';
export const PLAN_JETPACK_SOCIAL_V1_MONTHLY = 'jetpack_social_v1_monthly';
export const PLAN_JETPACK_GOLDEN_TOKEN_LIFETIME = 'jetpack_golden_token_lifetime';
export const PLAN_JETPACK_CREATOR_MONTHLY = 'jetpack_creator_monthly';
export const PLAN_JETPACK_CREATOR_YEARLY = 'jetpack_creator_yearly';
export const PLAN_JETPACK_CREATOR_BI_YEARLY = 'jetpack_creator_bi_yearly';
// DEPRECATED: Daily and Real-time variations will soon be retired.
// Remove after all customers are migrated to new products.
export const PLAN_JETPACK_BACKUP_DAILY = 'jetpack_backup_daily';
export const PLAN_JETPACK_BACKUP_DAILY_MONTHLY = 'jetpack_backup_daily_monthly';
export const PLAN_JETPACK_BACKUP_REALTIME = 'jetpack_backup_realtime';
export const PLAN_JETPACK_BACKUP_REALTIME_MONTHLY = 'jetpack_backup_realtime_monthly';
export const PLAN_JETPACK_SECURITY_DAILY = 'jetpack_security_daily';
export const PLAN_JETPACK_SECURITY_DAILY_MONTHLY = 'jetpack_security_daily_monthly';
export const PLAN_JETPACK_SECURITY_REALTIME = 'jetpack_security_realtime';
export const PLAN_JETPACK_SECURITY_REALTIME_MONTHLY = 'jetpack_security_realtime_monthly';
export const PLAN_JETPACK_STATS_BI_YEARLY = 'jetpack_stats_bi_yearly';
export const PLAN_JETPACK_STATS = 'jetpack_stats';
export const PLAN_JETPACK_STATS_MONTHLY = 'jetpack_stats_monthly';
export const PLAN_JETPACK_STATS_PWYW_YEARLY = 'jetpack_stats_pwyw_yearly';
export const PLAN_JETPACK_STATS_FREE = 'jetpack_stats_free_yearly';

export const POPULAR_PLANS = [ PLAN_PREMIUM ];
export const NEW_PLANS = [ PLAN_JETPACK_PERSONAL, PLAN_JETPACK_PERSONAL_MONTHLY ];
export const JETPACK_MONTHLY_PLANS = [
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
	PLAN_JETPACK_STARTER_MONTHLY,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
	PLAN_JETPACK_SECURITY_T2_MONTHLY,
	PLAN_JETPACK_COMPLETE_MONTHLY,

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
];
export const JETPACK_LEGACY_PLANS = [
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
];
export const JETPACK_LEGACY_PLANS_WITH_SECURITY_FEATURES = [
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
];
export const JETPACK_BUNDLES = [
	PLAN_JETPACK_STARTER,
	PLAN_JETPACK_STARTER_MONTHLY,
	PLAN_JETPACK_SECURITY_T1_BI_YEARLY,
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
	PLAN_JETPACK_SECURITY_T2_YEARLY,
	PLAN_JETPACK_SECURITY_T2_MONTHLY,
	PLAN_JETPACK_GOLDEN_TOKEN_LIFETIME,

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	PLAN_JETPACK_SECURITY_DAILY,
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
];
export const JETPACK_PLANS_WITH_BACKUP = [
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
	PLAN_JETPACK_STARTER,
	PLAN_JETPACK_STARTER_MONTHLY,
	PLAN_JETPACK_SECURITY_T1_BI_YEARLY,
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
	PLAN_JETPACK_SECURITY_T2_YEARLY,
	PLAN_JETPACK_SECURITY_T2_MONTHLY,
	PLAN_JETPACK_COMPLETE_BI_YEARLY,
	PLAN_JETPACK_COMPLETE,
	PLAN_JETPACK_COMPLETE_MONTHLY,
	PLAN_JETPACK_GOLDEN_TOKEN_LIFETIME,
];

export const JETPACK_PLANS_WITH_ANTI_SPAM = [
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
	PLAN_JETPACK_STARTER,
	PLAN_JETPACK_STARTER_MONTHLY,
	PLAN_JETPACK_SECURITY_T1_BI_YEARLY,
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
	PLAN_JETPACK_SECURITY_T2_YEARLY,
	PLAN_JETPACK_SECURITY_T2_MONTHLY,
	PLAN_JETPACK_COMPLETE_BI_YEARLY,
	PLAN_JETPACK_COMPLETE,
	PLAN_JETPACK_COMPLETE_MONTHLY,

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	PLAN_JETPACK_SECURITY_DAILY,
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
];

export const JETPACK_COMPLETE_BUNDLES = [
	PLAN_JETPACK_COMPLETE_BI_YEARLY,
	PLAN_JETPACK_COMPLETE,
	PLAN_JETPACK_COMPLETE_MONTHLY,
];

export const JETPACK_GOLDEN_TOKEN_BUNDLES = [ PLAN_JETPACK_GOLDEN_TOKEN_LIFETIME ];

export const JETPACK_SECURITY_BUNDLES = [
	PLAN_JETPACK_SECURITY_T1_BI_YEARLY,
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
	PLAN_JETPACK_SECURITY_T2_YEARLY,
	PLAN_JETPACK_SECURITY_T2_MONTHLY,

	// WoA plans.
	PLAN_BUSINESS,
	PLAN_BUSINESS_2_YEARS,
	PLAN_BUSINESS_3_YEARS,
	PLAN_BUSINESS_MONTHLY,
	PLAN_ECOMMERCE,
	PLAN_ECOMMERCE_2_YEARS,
	PLAN_ECOMMERCE_3_YEARS,
	PLAN_ECOMMERCE_MONTHLY,
	PLAN_PRO,

	// VIP.
	PLAN_VIP,
	PLAN_WPCOM_ENTERPRISE,

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	PLAN_JETPACK_SECURITY_DAILY,
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
];

export const JETPACK_STARTER_BUNDLES = [ PLAN_JETPACK_STARTER, PLAN_JETPACK_STARTER_MONTHLY ];

export const JETPACK_BACKUP_PRODUCTS = [
	PLAN_JETPACK_BACKUP_T0_YEARLY,
	PLAN_JETPACK_BACKUP_T0_MONTHLY,
	PLAN_JETPACK_BACKUP_T1_BI_YEARLY,
	PLAN_JETPACK_BACKUP_T1_YEARLY,
	PLAN_JETPACK_BACKUP_T1_MONTHLY,
	PLAN_JETPACK_BACKUP_T2_YEARLY,
	PLAN_JETPACK_BACKUP_T2_MONTHLY,

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	PLAN_JETPACK_BACKUP_DAILY,
	PLAN_JETPACK_BACKUP_DAILY_MONTHLY,
	PLAN_JETPACK_BACKUP_REALTIME,
	PLAN_JETPACK_BACKUP_REALTIME_MONTHLY,
];

export const JETPACK_SEARCH_PRODUCTS = [
	PLAN_JETPACK_SEARCH_BI_YEARLY,
	PLAN_JETPACK_SEARCH,
	PLAN_JETPACK_SEARCH_MONTHLY,
	PLAN_JETPACK_SEARCH_FREE,
	PLAN_WPCOM_SEARCH,
	PLAN_WPCOM_SEARCH_MONTHLY,
];

export const JETPACK_SCAN_PRODUCTS = [
	PLAN_JETPACK_SCAN_BI_YEARLY,
	PLAN_JETPACK_SCAN,
	PLAN_JETPACK_SCAN_MONTHLY,
];

export const JETPACK_ANTI_SPAM_PRODUCTS = [
	PLAN_JETPACK_ANTI_SPAM_BI_YEARLY,
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_ANTI_SPAM_MONTHLY,
];

export const JETPACK_VIDEOPRESS_PRODUCTS = [
	PLAN_JETPACK_VIDEOPRESS_BI_YEARLY,
	PLAN_JETPACK_VIDEOPRESS,
	PLAN_JETPACK_VIDEOPRESS_MONTHLY,
];

export const JETPACK_SOCIAL_BASIC_PRODUCTS = [
	PLAN_JETPACK_SOCIAL_BASIC_BI_YEARLY,
	PLAN_JETPACK_SOCIAL_BASIC,
	PLAN_JETPACK_SOCIAL_BASIC_MONTHLY,
];

export const JETPACK_SOCIAL_ADVANCED_PRODUCTS = [
	PLAN_JETPACK_SOCIAL_ADVANCED_BI_YEARLY,
	PLAN_JETPACK_SOCIAL_ADVANCED,
	PLAN_JETPACK_SOCIAL_ADVANCED_MONTHLY,
];

export const JETPACK_SOCIAL_V1_PRODUCTS = [
	PLAN_JETPACK_SOCIAL_V1_BI_YEARLY,
	PLAN_JETPACK_SOCIAL_V1,
	PLAN_JETPACK_SOCIAL_V1_MONTHLY,
];

export const JETPACK_SOCIAL_PRODUCTS = [
	...JETPACK_SOCIAL_BASIC_PRODUCTS,
	...JETPACK_SOCIAL_ADVANCED_PRODUCTS,
	...JETPACK_SOCIAL_V1_PRODUCTS,
];

export const JETPACK_BOOST_PRODUCTS = [
	PLAN_JETPACK_BOOST_BI_YEARLY,
	PLAN_JETPACK_BOOST,
	PLAN_JETPACK_BOOST_MONTHLY,
];

export const JETPACK_AI_PRODUCTS = [
	PLAN_JETPACK_AI_BI_YEARLY,
	PLAN_JETPACK_AI_YEARLY,
	PLAN_JETPACK_AI_MONTHLY,
];

export const JETPACK_STATS_PRODUCTS = [
	PLAN_JETPACK_STATS_BI_YEARLY,
	PLAN_JETPACK_STATS,
	PLAN_JETPACK_STATS_MONTHLY,
	PLAN_JETPACK_STATS_PWYW_YEARLY,
	PLAN_JETPACK_STATS_FREE,
];

export const JETPACK_CREATOR_PRODUCTS = [
	PLAN_JETPACK_CREATOR_MONTHLY,
	PLAN_JETPACK_CREATOR_YEARLY,
	PLAN_JETPACK_CREATOR_BI_YEARLY,
];

export const PLAN_MONTHLY_PERIOD = 31;
export const PLAN_ANNUAL_PERIOD = 365;

// features constants
export const FEATURE_WP_SUBDOMAIN = 'wordpress-subdomain';
export const FEATURE_CUSTOM_DOMAIN = 'custom-domain';
export const FEATURE_JETPACK_ESSENTIAL = 'jetpack-essential';
export const FEATURE_3GB_STORAGE = '3gb-storage';
export const FEATURE_6GB_STORAGE = '6gb-storage';
export const FEATURE_13GB_STORAGE = '13gb-storage';
export const FEATURE_UNLIMITED_STORAGE = 'unlimited-storage';
export const FEATURE_COMMUNITY_SUPPORT = 'community-support';
export const FEATURE_EMAIL_LIVE_CHAT_SUPPORT = 'email-live-chat-support';
export const FEATURE_PREMIUM_SUPPORT = 'priority-support';
export const FEATURE_BASIC_DESIGN = 'basic-design';
export const FEATURE_ADVANCED_DESIGN = 'advanced-design';
export const FEATURE_GOOGLE_ANALYTICS = 'google-analytics';
export const FEATURE_LIVE_CHAT_SUPPORT = 'live-chat-support';
export const FEATURE_NO_ADS = 'no-adverts';
export const FEATURE_VIDEO_UPLOADS = 'video-upload';
export const FEATURE_VIDEO_UPLOADS_JETPACK_PREMIUM = 'video-upload-jetpack-premium';
export const FEATURE_VIDEO_UPLOADS_JETPACK_PRO = 'video-upload-jetpack-pro';
export const FEATURE_AUDIO_UPLOADS = 'audio-upload';
export const FEATURE_WORDADS_INSTANT = 'wordads-instant';
export const FEATURE_NO_BRANDING = 'no-wp-branding';
export const FEATURE_ADVANCED_SEO = 'advanced-seo';
export const FEATURE_BUSINESS_ONBOARDING = 'business-onboarding';
export const FEATURE_UPLOAD_PLUGINS = 'upload-plugins';

// jetpack features constants
export const FEATURE_STANDARD_SECURITY_TOOLS = 'standard-security-tools';
export const FEATURE_SITE_STATS = 'site-stats';
export const FEATURE_TRAFFIC_TOOLS = 'traffic-tools';
export const FEATURE_MANAGE = 'jetpack-manage';
export const FEATURE_SPAM_AKISMET_PLUS = 'spam-akismet-plus';
export const FEATURE_OFFSITE_BACKUP_VAULTPRESS_DAILY = 'offsite-backup-vaultpress-daily';
export const FEATURE_OFFSITE_BACKUP_VAULTPRESS_REALTIME = 'offsite-backup-vaultpress-realtime';
export const FEATURE_BACKUP_ARCHIVE_30 = 'backup-archive-30';
export const FEATURE_BACKUP_ARCHIVE_15 = 'backup-archive-15';
export const FEATURE_BACKUP_ARCHIVE_UNLIMITED = 'backup-archive-unlimited';
export const FEATURE_BACKUP_STORAGE_SPACE_UNLIMITED = 'backup-storage-space-unlimited';
export const FEATURE_AUTOMATED_RESTORES = 'automated-restores';
export const FEATURE_EASY_SITE_MIGRATION = 'easy-site-migration';
export const FEATURE_MALWARE_SCANNING_DAILY = 'malware-scanning-daily';
export const FEATURE_MALWARE_SCANNING_DAILY_AND_ON_DEMAND = 'malware-scanning-daily-and-on-demand';
export const FEATURE_ONE_CLICK_THREAT_RESOLUTION = 'one-click-threat-resolution';
export const FEATURE_POLLS_PRO = 'polls-pro';
export const FEATURE_CORE_JETPACK = 'core-jetpack';
export const FEATURE_BASIC_SUPPORT_JETPACK = 'basic-support-jetpack';
export const FEATURE_BASIC_SECURITY_JETPACK = 'basic-security-jetpack';
export const FEATURE_SITE_BACKUPS_JETPACK = 'site-backups-jetpack';
export const FEATURE_REALTIME_BACKUPS_JETPACK = 'realtime-backups-jetpack';
export const FEATURE_SECURITY_SCANNING_JETPACK = 'security-scanning-jetpack';
export const FEATURE_REVENUE_GENERATION_JETPACK = 'revenue-generation-jetpack';
export const FEATURE_VIDEO_HOSTING_JETPACK = 'video-hosting-jetpack';
export const FEATURE_SECURITY_ESSENTIALS_JETPACK = 'security-essentials-jetpack';
export const FEATURE_PRIORITY_SUPPORT_JETPACK = 'priority-support-jetpack';
export const FEATURE_WORDADS_JETPACK = 'wordads-jetpack';
export const FEATURE_GOOGLE_ANALYTICS_JETPACK = 'google-analytics-jetpack';
export const FEATURE_SEARCH_JETPACK = 'search-jetpack';
export const FEATURE_VIDEOPRESS = 'videopress-jetpack';
export const FEATURE_SIMPLE_PAYMENTS_JETPACK = 'simple-payments-jetpack';

// Upsells
export const JETPACK_FEATURE_PRODUCT_UPSELL_MAP = {
	[ FEATURE_PRIORITY_SUPPORT_JETPACK ]: PLAN_JETPACK_SECURITY_T1_YEARLY,
	[ FEATURE_SEARCH_JETPACK ]: PLAN_JETPACK_SEARCH,
	[ FEATURE_SECURITY_SCANNING_JETPACK ]: PLAN_JETPACK_SCAN,
	[ FEATURE_SITE_BACKUPS_JETPACK ]: PLAN_JETPACK_BACKUP_T1_YEARLY,
	[ FEATURE_SPAM_AKISMET_PLUS ]: PLAN_JETPACK_ANTI_SPAM,
	[ FEATURE_VIDEO_HOSTING_JETPACK ]: PLAN_JETPACK_SECURITY_T1_YEARLY,
	[ FEATURE_WORDADS_JETPACK ]: PLAN_JETPACK_SECURITY_T1_YEARLY,
	[ FEATURE_GOOGLE_ANALYTICS_JETPACK ]: PLAN_JETPACK_SECURITY_T1_YEARLY,
	[ FEATURE_SPAM_AKISMET_PLUS ]: PLAN_JETPACK_ANTI_SPAM,
	[ FEATURE_VIDEOPRESS ]: PLAN_JETPACK_VIDEOPRESS,
	[ FEATURE_SIMPLE_PAYMENTS_JETPACK ]: PLAN_JETPACK_SECURITY_T1_YEARLY,
};

/**
 * Checks if a plan slug represents a monthly plan.
 *
 * @param {string} plan - The plan slug
 * @returns {boolean} True if it's monthly plan
 */
export function isMonthly( plan ) {
	return includes( JETPACK_MONTHLY_PLANS, plan );
}
/**
 * Checks if a plan slug is in the group of popular plans.
 *
 * @param {string} plan - The plan slug
 * @returns {boolean} True if it's popular plan
 */
export function isPopular( plan ) {
	return includes( POPULAR_PLANS, plan );
}
/**
 * Checks if a plan slug is a new plan.
 *
 * @param {string} plan - The plan slug
 * @returns {boolean} True if it's new plan
 */
export function isNew( plan ) {
	return includes( NEW_PLANS, plan );
}

/**
 * Determines if a plan includes Jetpack Anti-Spam.
 *
 * @param {string} plan - The plan slug
 * @returns {boolean} True if the plan includes Jetpack Anti-Spam
 */
export function isJetpackPlanWithAntiSpam( plan ) {
	return includes( JETPACK_PLANS_WITH_ANTI_SPAM, plan );
}

/**
 * Determines if a plan includes backup features.
 *
 * @param {string} plan - The plan slug
 * @returns {boolean} True if the plan contains backup features
 */
export function isJetpackPlanWithBackup( plan ) {
	return includes( JETPACK_PLANS_WITH_BACKUP, plan );
}

/**
 * Determines if a product is Jetpack Backup.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is Jetpack Backup
 */
export function isJetpackBackup( product ) {
	return includes( JETPACK_BACKUP_PRODUCTS, product );
}

/**
 * Checks if a product slug is Jetpack Search.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is Jetpack Search
 */
export function isJetpackSearch( product ) {
	return includes( JETPACK_SEARCH_PRODUCTS, product );
}

/**
 * Checks if a product slug is Jetpack Scan.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is Jetpack Scan
 */
export function isJetpackScan( product ) {
	return JETPACK_SCAN_PRODUCTS.includes( product );
}

/**
 * Checks if a product slug is Jetpack Anti-Spam.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is Jetpack Anti-Spam
 */
export function isJetpackAntiSpam( product ) {
	return JETPACK_ANTI_SPAM_PRODUCTS.includes( product );
}

/**
 * Determines if a product is Jetpack VideoPress.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack VideoPress, false otherwise.
 */
export function isJetpackVideoPress( product ) {
	return JETPACK_VIDEOPRESS_PRODUCTS.includes( product );
}

/**
 * Determines if a product is Jetpack Social.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack Social, false otherwise.
 */
export function isJetpackSocial( product ) {
	return JETPACK_SOCIAL_PRODUCTS.includes( product );
}

/**
 * Determines if a product is Jetpack Boost.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack Social, false otherwise.
 */
export function isJetpackBoost( product ) {
	return JETPACK_BOOST_PRODUCTS.includes( product );
}

/**
 * Determines if a product is Jetpack AI.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack AI, false otherwise.
 */
export function isJetpackAI( product ) {
	return JETPACK_AI_PRODUCTS.includes( product );
}

/**
 * Determines if a product is Jetpack Stats.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack Stats, false otherwise.
 */
export function isJetpackStats( product ) {
	return JETPACK_STATS_PRODUCTS.includes( product );
}

/**
 * Determines if a product is Jetpack Creator.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack Creator, false otherwise.
 */
export function isJetpackCreator( product ) {
	return JETPACK_CREATOR_PRODUCTS.includes( product );
}

/**
 * Checks if a product slug is a Jetpack product.
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is Jetpack product.
 */
export function isJetpackProduct( product ) {
	return (
		isJetpackBackup( product ) ||
		isJetpackSearch( product ) ||
		isJetpackScan( product ) ||
		isJetpackAntiSpam( product ) ||
		isJetpackVideoPress( product ) ||
		isJetpackSocial( product ) ||
		isJetpackBoost( product ) ||
		isJetpackAI( product ) ||
		isJetpackStats( product ) ||
		isJetpackCreator( product )
	);
}

/**
 * Checks if the product slug is a Jetpack bundle.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is Jetpack bundle
 */
export function isJetpackBundle( product ) {
	return JETPACK_BUNDLES.includes( product );
}

/**
 * Checks if the product slug is a Jetpack Starter bundle.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is Jetpack Starter bundle
 */
export function isJetpackStarterBundle( product ) {
	return JETPACK_STARTER_BUNDLES.includes( product );
}

/**
 * Determine if the given product is a Security Bundle.
 *
 * @param {number} product - productId to check
 * @returns {boolean} if the given product is a Security Bundle
 */
export function isJetpackSecurityBundle( product ) {
	return JETPACK_SECURITY_BUNDLES.includes( product );
}

/**
 * Checks if the product slug is a legacy Jetpack plan.
 *
 * @param {string} product - The product slug
 * @returns {boolean} True if the product is a legacy Jetpack plan
 */
export function isJetpackLegacyPlan( product ) {
	return JETPACK_LEGACY_PLANS.includes( product );
}

/**
 * Identify legacy plans that contain features comparable to a security bundle
 *
 * @param {string} product - The product id.
 * @returns {boolean} True if the product is a legacy Jetpack plan with security features, false otherwise.
 */
export function isSecurityComparableJetpackLegacyPlan( product ) {
	return JETPACK_LEGACY_PLANS_WITH_SECURITY_FEATURES.includes( product );
}

/**
 * Retrieves the upsell for a feature.
 *
 * @param {string} feature - The feature slug.
 * @returns {string} The product slug required for the feature.
 */
export function getJetpackProductUpsellByFeature( feature ) {
	return JETPACK_FEATURE_PRODUCT_UPSELL_MAP[ feature ];
}

/**
 * Gets the CSS class to use for the plans section, given the plan slug.
 *
 * @param {string} plan - The plan slug.
 * @returns {string} The CSS class to use.
 */
export function getPlanClass( plan ) {
	switch ( plan ) {
		case PLAN_JETPACK_FREE:
		case PLAN_FREE:
			return 'is-free-plan';
		case PLAN_PERSONAL:
		case PLAN_PERSONAL_2_YEARS:
		case PLAN_PERSONAL_3_YEARS:
		case PLAN_PERSONAL_MONTHLY:
		case PLAN_STARTER:
		case PLAN_JETPACK_PERSONAL:
		case PLAN_JETPACK_PERSONAL_MONTHLY:
			return 'is-personal-plan';
		case PLAN_PREMIUM:
		case PLAN_PREMIUM_2_YEARS:
		case PLAN_PREMIUM_3_YEARS:
		case PLAN_PREMIUM_MONTHLY:
		case PLAN_JETPACK_PREMIUM:
		case PLAN_JETPACK_PREMIUM_MONTHLY:
			return 'is-premium-plan';
		case PLAN_BUSINESS:
		case PLAN_BUSINESS_2_YEARS:
		case PLAN_BUSINESS_3_YEARS:
		case PLAN_BUSINESS_MONTHLY:
		case PLAN_JETPACK_BUSINESS:
		case PLAN_JETPACK_BUSINESS_MONTHLY:
		case PLAN_ECOMMERCE:
		case PLAN_ECOMMERCE_2_YEARS:
		case PLAN_ECOMMERCE_3_YEARS:
		case PLAN_ECOMMERCE_MONTHLY:
		case PLAN_PRO:
		case PLAN_BUSINESS_TRIAL:
		case PLAN_MIGRATION_TRIAL:
		case PLAN_100_YEARS:
		case PLAN_WOOEXPRESS_ESSENTIALS:
		case PLAN_WOOEXPRESS_ESSENTIALS_MONTHLY:
		case PLAN_WOOEXPRESS_PERFORMANCE:
		case PLAN_WOOEXPRESS_PERFORMANCE_MONTHLY:
		case PLAN_WOOEXPRESS_TRIAL:
			return 'is-business-plan';
		case PLAN_JETPACK_STARTER:
		case PLAN_JETPACK_STARTER_MONTHLY:
			return 'is-jetpack-starter-plan';
		case PLAN_JETPACK_SECURITY_T1_BI_YEARLY:
		case PLAN_JETPACK_SECURITY_T1_YEARLY:
		case PLAN_JETPACK_SECURITY_T1_MONTHLY:
			return 'is-security-t1-plan';
		case PLAN_JETPACK_SECURITY_T2_YEARLY:
		case PLAN_JETPACK_SECURITY_T2_MONTHLY:
			return 'is-security-t2-plan';
		case PLAN_JETPACK_COMPLETE_BI_YEARLY:
		case PLAN_JETPACK_COMPLETE:
		case PLAN_JETPACK_COMPLETE_MONTHLY:
		case PLAN_VIP:
			return 'is-complete-plan';
		case PLAN_JETPACK_BACKUP_T0_YEARLY:
		case PLAN_JETPACK_BACKUP_T0_MONTHLY:
			return 'is-backup-t0-plan';
		case PLAN_JETPACK_BACKUP_T1_BI_YEARLY:
		case PLAN_JETPACK_BACKUP_T1_YEARLY:
		case PLAN_JETPACK_BACKUP_T1_MONTHLY:
			return 'is-backup-t1-plan';
		case PLAN_JETPACK_BACKUP_T2_YEARLY:
		case PLAN_JETPACK_BACKUP_T2_MONTHLY:
			return 'is-backup-t2-plan';
		case PLAN_JETPACK_SEARCH_BI_YEARLY:
		case PLAN_JETPACK_SEARCH:
		case PLAN_JETPACK_SEARCH_MONTHLY:
		case PLAN_WPCOM_SEARCH:
		case PLAN_WPCOM_SEARCH_MONTHLY:
			return 'is-search-plan';
		case PLAN_JETPACK_SEARCH_FREE:
			return 'is-free-search-plan';
		case PLAN_JETPACK_SCAN_BI_YEARLY:
		case PLAN_JETPACK_SCAN:
		case PLAN_JETPACK_SCAN_MONTHLY:
			return 'is-scan-plan';
		case PLAN_JETPACK_ANTI_SPAM_BI_YEARLY:
		case PLAN_JETPACK_ANTI_SPAM:
		case PLAN_JETPACK_ANTI_SPAM_MONTHLY:
			return 'is-anti-spam-plan';
		case PLAN_JETPACK_VIDEOPRESS_BI_YEARLY:
		case PLAN_JETPACK_VIDEOPRESS:
		case PLAN_JETPACK_VIDEOPRESS_MONTHLY:
			return 'is-videopress-plan';
		case PLAN_JETPACK_GOLDEN_TOKEN_LIFETIME:
			return 'is-jetpack-golden-token-plan';
		case PLAN_JETPACK_CREATOR_BI_YEARLY:
		case PLAN_JETPACK_CREATOR_YEARLY:
		case PLAN_JETPACK_CREATOR_MONTHLY:
			return 'is-jetpack-creator-plan';

		// DEPRECATED: Daily and Real-time variations will soon be retired.
		// Remove after all customers are migrated to new products.
		case PLAN_JETPACK_SECURITY_DAILY:
		case PLAN_JETPACK_SECURITY_DAILY_MONTHLY:
			return 'is-daily-security-plan';
		case PLAN_JETPACK_SECURITY_REALTIME:
		case PLAN_JETPACK_SECURITY_REALTIME_MONTHLY:
			return 'is-realtime-security-plan';
		case PLAN_JETPACK_BACKUP_DAILY:
		case PLAN_JETPACK_BACKUP_DAILY_MONTHLY:
			return 'is-daily-backup-plan';
		case PLAN_JETPACK_BACKUP_REALTIME:
		case PLAN_JETPACK_BACKUP_REALTIME_MONTHLY:
			return 'is-realtime-backup-plan';
		case PLAN_JETPACK_SOCIAL_BASIC_BI_YEARLY:
		case PLAN_JETPACK_SOCIAL_BASIC:
		case PLAN_JETPACK_SOCIAL_BASIC_MONTHLY:
			return 'is-jetpack-social-basic-plan';
		case PLAN_JETPACK_SOCIAL_ADVANCED_BI_YEARLY:
		case PLAN_JETPACK_SOCIAL_ADVANCED:
		case PLAN_JETPACK_SOCIAL_ADVANCED_MONTHLY:
			return 'is-jetpack-social-advanced-plan';
		case PLAN_JETPACK_SOCIAL_V1_BI_YEARLY:
		case PLAN_JETPACK_SOCIAL_V1:
		case PLAN_JETPACK_SOCIAL_V1_MONTHLY:
			return 'is-jetpack-social-v1-plan';
		case PLAN_JETPACK_BOOST_BI_YEARLY:
		case PLAN_JETPACK_BOOST:
		case PLAN_JETPACK_BOOST_MONTHLY:
			return 'is-jetpack-boost-plan';
		case PLAN_JETPACK_AI_BI_YEARLY:
		case PLAN_JETPACK_AI_MONTHLY:
		case PLAN_JETPACK_AI_YEARLY:
			return 'is-jetpack-ai-plan';
		case PLAN_JETPACK_STATS_BI_YEARLY:
		case PLAN_JETPACK_STATS:
		case PLAN_JETPACK_STATS_MONTHLY:
		case PLAN_JETPACK_STATS_PWYW_YEARLY:
			return 'is-jetpack-stats-plan';
		case PLAN_JETPACK_STATS_FREE:
			return 'is-free-jetpack-stats-plan';

		default:
			return '';
	}
}

/**
 * Retrieve the monthly equivalent of a yearly plan.
 *
 * @param {string} plan - The plan slug of the yearly plan.
 * @returns {string} The monthly plan if it exists, otherwise, an empty string.
 */
export function getMonthlyPlanByYearly( plan ) {
	switch ( plan ) {
		case PLAN_JETPACK_PREMIUM:
			return PLAN_JETPACK_PREMIUM_MONTHLY;
		case PLAN_JETPACK_BUSINESS:
			return PLAN_JETPACK_BUSINESS_MONTHLY;
		case PLAN_JETPACK_PERSONAL:
			return PLAN_JETPACK_PERSONAL_MONTHLY;
		case PLAN_JETPACK_STARTER:
			return PLAN_JETPACK_STARTER_MONTHLY;
		case PLAN_JETPACK_SECURITY_T1_BI_YEARLY:
			return PLAN_JETPACK_SECURITY_T1_MONTHLY;
		case PLAN_JETPACK_SECURITY_T1_YEARLY:
			return PLAN_JETPACK_SECURITY_T1_MONTHLY;
		case PLAN_JETPACK_SECURITY_T2_YEARLY:
			return PLAN_JETPACK_SECURITY_T2_MONTHLY;
		case PLAN_JETPACK_COMPLETE:
			return PLAN_JETPACK_COMPLETE_MONTHLY;

		// DEPRECATED: Daily and Real-time variations will soon be retired.
		// Remove after all customers are migrated to new products.
		case PLAN_JETPACK_SECURITY_DAILY:
			return PLAN_JETPACK_SECURITY_DAILY_MONTHLY;
		case PLAN_JETPACK_SECURITY_REALTIME:
			return PLAN_JETPACK_SECURITY_REALTIME_MONTHLY;
		default:
			return '';
	}
}

/**
 * Determines if the plan or product is a special gifted offering.
 *
 * @param {string} planOrProductSlug - A plan or product slug.
 * @returns {boolean} True if the plan or product is a special gifted offering, false otherwise.
 */
export function containsGiftedPlanOrProduct( planOrProductSlug ) {
	return [ PLAN_JETPACK_GOLDEN_TOKEN_LIFETIME ].includes( planOrProductSlug );
}

/**
 * Determines if the plan class contains backup daily.
 *
 * @param {string} planClass - A plan class.
 * @returns {boolean} True if the plan class contains backup daily, false otherwise.
 */
// DEPRECATED: Daily and Real-time variations will soon be retired.
// Remove after all customers are migrated to new products.
export function containsBackupDaily( planClass ) {
	return [
		'is-personal-plan',
		'is-premium-plan',
		'is-daily-security-plan',
		'is-daily-backup-plan',
	].includes( planClass );
}

/**
 * Determines if the plan class contains backup realtime.
 *
 * @param {string} planClass - A plan class.
 * @returns {boolean} True if the plan class contains backup realtime, false otherwise.
 */
export function containsBackupRealtime( planClass ) {
	return [
		'is-business-plan',
		'is-backup-t0-plan',
		'is-backup-t1-plan',
		'is-backup-t2-plan',
		'is-startup-plan',
		'is-security-t1-plan',
		'is-security-t2-plan',
		'is-complete-plan',
		'is-jetpack-golden-token-plan',

		// DEPRECATED: Daily and Real-time variations will soon be retired.
		// Remove after all customers are migrated to new products.
		'is-realtime-security-plan',
		'is-realtime-backup-plan',
	].includes( planClass );
}
