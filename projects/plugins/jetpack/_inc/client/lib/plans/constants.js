/**
 * External dependencies
 */
import { includes } from 'lodash';

// plans constants
export const PLAN_BUSINESS = 'business-bundle';
export const PLAN_BUSINESS_2_YEARS = 'business-bundle-2y';
export const PLAN_BUSINESS_MONTHLY = 'business-bundle-monthly';
export const PLAN_ECOMMERCE = 'ecommerce-bundle';
export const PLAN_ECOMMERCE_2_YEARS = 'ecommerce-bundle-2y';
export const PLAN_ECOMMERCE_MONTHLY = 'ecommerce-bundle-monthly';
export const PLAN_PREMIUM = 'value_bundle';
export const PLAN_PREMIUM_2_YEARS = 'value_bundle-2y';
export const PLAN_PREMIUM_MONTHLY = 'value_bundle-monthly';
export const PLAN_PERSONAL = 'personal-bundle';
export const PLAN_PERSONAL_2_YEARS = 'personal-bundle-2y';
export const PLAN_PERSONAL_MONTHLY = 'personal-bundle-monthly';
export const PLAN_FREE = 'free_plan';
export const PLAN_JETPACK_FREE = 'jetpack_free';
export const PLAN_JETPACK_PREMIUM = 'jetpack_premium';
export const PLAN_JETPACK_BUSINESS = 'jetpack_business';
export const PLAN_JETPACK_PERSONAL = 'jetpack_personal';
export const PLAN_JETPACK_PREMIUM_MONTHLY = 'jetpack_premium_monthly';
export const PLAN_JETPACK_BUSINESS_MONTHLY = 'jetpack_business_monthly';
export const PLAN_JETPACK_PERSONAL_MONTHLY = 'jetpack_personal_monthly';
export const PLAN_JETPACK_BACKUP_DAILY = 'jetpack_backup_daily';
export const PLAN_JETPACK_BACKUP_DAILY_MONTHLY = 'jetpack_backup_daily_monthly';
export const PLAN_JETPACK_BACKUP_REALTIME = 'jetpack_backup_realtime';
export const PLAN_JETPACK_BACKUP_REALTIME_MONTHLY = 'jetpack_backup_realtime_monthly';
export const PLAN_JETPACK_SEARCH = 'jetpack_search';
export const PLAN_JETPACK_SEARCH_MONTHLY = 'jetpack_search_monthly';
export const PLAN_JETPACK_SECURITY_DAILY = 'jetpack_security_daily';
export const PLAN_JETPACK_SECURITY_DAILY_MONTHLY = 'jetpack_security_daily_monthly';
export const PLAN_JETPACK_SECURITY_REALTIME = 'jetpack_security_realtime';
export const PLAN_JETPACK_SECURITY_REALTIME_MONTHLY = 'jetpack_security_realtime_monthly';
export const PLAN_JETPACK_COMPLETE = 'jetpack_complete';
export const PLAN_JETPACK_COMPLETE_MONTHLY = 'jetpack_complete_monthly';
export const PLAN_WPCOM_SEARCH = 'wpcom_search';
export const PLAN_WPCOM_SEARCH_MONTHLY = 'wpcom_search_monthly';
export const PLAN_JETPACK_SCAN = 'jetpack_scan';
export const PLAN_JETPACK_SCAN_MONTHLY = 'jetpack_scan_monthly';
export const PLAN_JETPACK_ANTI_SPAM = 'jetpack_anti_spam';
export const PLAN_JETPACK_ANTI_SPAM_MONTHLY = 'jetpack_anti_spam_monthly';
export const PLAN_HOST_BUNDLE = 'host-bundle';
export const PLAN_WPCOM_ENTERPRISE = 'wpcom-enterprise';
export const PLAN_VIP = 'vip';
export const PLAN_CHARGEBACK = 'chargeback';

export const POPULAR_PLANS = [ PLAN_PREMIUM ];
export const NEW_PLANS = [ PLAN_JETPACK_PERSONAL, PLAN_JETPACK_PERSONAL_MONTHLY ];
export const JETPACK_MONTHLY_PLANS = [
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
	PLAN_JETPACK_COMPLETE_MONTHLY,
];
export const JETPACK_LEGACY_PLANS = [
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
];
export const JETPACK_BUNDLES = [
	PLAN_JETPACK_SECURITY_DAILY,
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
];

export const JETPACK_BACKUP_PRODUCTS = [
	PLAN_JETPACK_BACKUP_DAILY,
	PLAN_JETPACK_BACKUP_DAILY_MONTHLY,
	PLAN_JETPACK_BACKUP_REALTIME,
	PLAN_JETPACK_BACKUP_REALTIME_MONTHLY,
];

export const JETPACK_SEARCH_PRODUCTS = [
	PLAN_JETPACK_SEARCH,
	PLAN_JETPACK_SEARCH_MONTHLY,
	PLAN_WPCOM_SEARCH,
	PLAN_WPCOM_SEARCH_MONTHLY,
];

export const JETPACK_SCAN_PRODUCTS = [ PLAN_JETPACK_SCAN, PLAN_JETPACK_SCAN_MONTHLY ];

export const JETPACK_ANTI_SPAM_PRODUCTS = [
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_ANTI_SPAM_MONTHLY,
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

// Upsells
export const JETPACK_FEATURE_PRODUCT_UPSELL_MAP = {
	[ FEATURE_PRIORITY_SUPPORT_JETPACK ]: PLAN_JETPACK_SECURITY_DAILY,
	[ FEATURE_SEARCH_JETPACK ]: PLAN_JETPACK_SEARCH,
	[ FEATURE_SECURITY_SCANNING_JETPACK ]: PLAN_JETPACK_SCAN,
	[ FEATURE_SITE_BACKUPS_JETPACK ]: PLAN_JETPACK_BACKUP_DAILY,
	[ FEATURE_SPAM_AKISMET_PLUS ]: PLAN_JETPACK_ANTI_SPAM,
	[ FEATURE_VIDEO_HOSTING_JETPACK ]: PLAN_JETPACK_SECURITY_DAILY,
	[ FEATURE_WORDADS_JETPACK ]: PLAN_JETPACK_SECURITY_DAILY,
	[ FEATURE_GOOGLE_ANALYTICS_JETPACK ]: PLAN_JETPACK_SECURITY_DAILY,
	[ FEATURE_SPAM_AKISMET_PLUS ]: PLAN_JETPACK_ANTI_SPAM,
};

export function isMonthly( plan ) {
	return includes( JETPACK_MONTHLY_PLANS, plan );
}

export function isPopular( plan ) {
	return includes( POPULAR_PLANS, plan );
}

export function isNew( plan ) {
	return includes( NEW_PLANS, plan );
}

export function isJetpackBackup( product ) {
	return includes( JETPACK_BACKUP_PRODUCTS, product );
}

export function isJetpackSearch( product ) {
	return includes( JETPACK_SEARCH_PRODUCTS, product );
}

export function isJetpackScan( product ) {
	return JETPACK_SCAN_PRODUCTS.includes( product );
}

export function isJetpackAntiSpam( product ) {
	return JETPACK_ANTI_SPAM_PRODUCTS.includes( product );
}

export function isJetpackProduct( product ) {
	return (
		isJetpackBackup( product ) ||
		isJetpackSearch( product ) ||
		isJetpackScan( product ) ||
		isJetpackAntiSpam( product )
	);
}

export function isJetpackBundle( product ) {
	return JETPACK_BUNDLES.includes( product );
}

export function isJetpackLegacyPlan( product ) {
	return JETPACK_LEGACY_PLANS.includes( product );
}

export function getJetpackProductUpsellByFeature( feature ) {
	return JETPACK_FEATURE_PRODUCT_UPSELL_MAP[ feature ];
}

export function getPlanClass( plan ) {
	switch ( plan ) {
		case PLAN_JETPACK_FREE:
		case PLAN_FREE:
			return 'is-free-plan';
		case PLAN_PERSONAL:
		case PLAN_PERSONAL_2_YEARS:
		case PLAN_PERSONAL_MONTHLY:
		case PLAN_JETPACK_PERSONAL:
		case PLAN_JETPACK_PERSONAL_MONTHLY:
			return 'is-personal-plan';
		case PLAN_PREMIUM:
		case PLAN_PREMIUM_2_YEARS:
		case PLAN_PREMIUM_MONTHLY:
		case PLAN_JETPACK_PREMIUM:
		case PLAN_JETPACK_PREMIUM_MONTHLY:
			return 'is-premium-plan';
		case PLAN_BUSINESS:
		case PLAN_BUSINESS_2_YEARS:
		case PLAN_BUSINESS_MONTHLY:
		case PLAN_JETPACK_BUSINESS:
		case PLAN_JETPACK_BUSINESS_MONTHLY:
		case PLAN_VIP:
		case PLAN_ECOMMERCE:
		case PLAN_ECOMMERCE_2_YEARS:
		case PLAN_ECOMMERCE_MONTHLY:
			return 'is-business-plan';
		case PLAN_JETPACK_SECURITY_DAILY:
		case PLAN_JETPACK_SECURITY_DAILY_MONTHLY:
			return 'is-daily-security-plan';
		case PLAN_JETPACK_SECURITY_REALTIME:
		case PLAN_JETPACK_SECURITY_REALTIME_MONTHLY:
			return 'is-realtime-security-plan';
		case PLAN_JETPACK_COMPLETE:
		case PLAN_JETPACK_COMPLETE_MONTHLY:
			return 'is-complete-plan';
		case PLAN_JETPACK_BACKUP_DAILY:
		case PLAN_JETPACK_BACKUP_DAILY_MONTHLY:
			return 'is-daily-backup-plan';
		case PLAN_JETPACK_BACKUP_REALTIME:
		case PLAN_JETPACK_BACKUP_REALTIME_MONTHLY:
			return 'is-realtime-backup-plan';
		case PLAN_JETPACK_SEARCH:
		case PLAN_JETPACK_SEARCH_MONTHLY:
		case PLAN_WPCOM_SEARCH:
		case PLAN_WPCOM_SEARCH_MONTHLY:
			return 'is-search-plan';
		case PLAN_JETPACK_SCAN:
		case PLAN_JETPACK_SCAN_MONTHLY:
			return 'is-scan-plan';
		case PLAN_JETPACK_ANTI_SPAM:
		case PLAN_JETPACK_ANTI_SPAM_MONTHLY:
			return 'is-anti-spam-plan';
		default:
			return '';
	}
}

export function getMonthlyPlanByYearly( plan ) {
	switch ( plan ) {
		case PLAN_JETPACK_PREMIUM:
			return PLAN_JETPACK_PREMIUM_MONTHLY;
		case PLAN_JETPACK_BUSINESS:
			return PLAN_JETPACK_BUSINESS_MONTHLY;
		case PLAN_JETPACK_PERSONAL:
			return PLAN_JETPACK_PERSONAL_MONTHLY;
		case PLAN_JETPACK_SECURITY_DAILY:
			return PLAN_JETPACK_SECURITY_DAILY_MONTHLY;
		case PLAN_JETPACK_SECURITY_REALTIME:
			return PLAN_JETPACK_SECURITY_REALTIME_MONTHLY;
		case PLAN_JETPACK_COMPLETE:
			return PLAN_JETPACK_COMPLETE_MONTHLY;
		default:
			return '';
	}
}

/**
 * Determines if the plan class contains backup daily.
 *
 * @param {string} planClass - A plan class.
 * @returns {boolean} True if the plan class contains backup daily, false otherwise.
 */
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
		'is-realtime-security-plan',
		'is-complete-plan',
		'is-realtime-backup-plan',
	].includes( planClass );
}
