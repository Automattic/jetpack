import { __ } from '@wordpress/i18n';
import {
	JETPACK_COMPLETE_BUNDLES,
	JETPACK_SECURITY_BUNDLES,
	JETPACK_STARTER_BUNDLES,
	JETPACK_BACKUP_PRODUCTS,
	JETPACK_ANTI_SPAM_PRODUCTS,
	JETPACK_VIDEOPRESS_PRODUCTS,
	JETPACK_SEARCH_PRODUCTS,
	JETPACK_SCAN_PRODUCTS,
	JETPACK_GOLDEN_TOKEN_BUNDLES,
} from 'lib/plans/constants';

export const RECOMMENDATION_WIZARD_STEP = {
	NOT_STARTED: 'not-started',
	SITE_TYPE: 'site-type-question',
	PRODUCT_SUGGESTIONS: 'product-suggestions',
	PRODUCT_PURCHASED: 'product-purchased',
	AGENCY: 'agency',
	WOOCOMMERCE: 'woocommerce',
	MONITOR: 'monitor',
	NEWSLETTER: 'newsletter',
	RELATED_POSTS: 'related-posts',
	CREATIVE_MAIL: 'creative-mail',
	SITE_ACCELERATOR: 'site-accelerator',
	VAULTPRESS_BACKUP: 'vaultpress-backup',
	VAULTPRESS_FOR_WOOCOMMERCE: 'vaultpress-for-woocommerce',
	PUBLICIZE: 'publicize',
	PROTECT: 'protect',
	ANTI_SPAM: 'anti-spam',
	VIDEOPRESS: 'videopress',
	BACKUP_PLAN: 'backup-plan',
	WELCOME__BACKUP: 'welcome__backup',
	WELCOME__COMPLETE: 'welcome__complete',
	WELCOME__SECURITY: 'welcome__security',
	WELCOME__STARTER: 'welcome__starter',
	WELCOME__ANTISPAM: 'welcome__antispam',
	WELCOME__VIDEOPRESS: 'welcome__videopress',
	WELCOME__SEARCH: 'welcome__search',
	WELCOME__SCAN: 'welcome__scan',
	WELCOME__GOLDEN_TOKEN: 'welcome__golden_token',
	BACKUP_ACTIVATED: 'backup-activated',
	SCAN_ACTIVATED: 'scan-activated',
	ANTISPAM_ACTIVATED: 'antispam-activated',
	VIDEOPRESS_ACTIVATED: 'videopress-activated',
	SEARCH_ACTIVATED: 'search-activated',
	SERVER_CREDENTIALS: 'server-credentials',
	BOOST: 'boost',
	SUMMARY: 'summary',
};

export const DEFAULT_ILLUSTRATION = 'assistant-site-type';

export const ONBOARDING_JETPACK_COMPLETE = 'JETPACK_COMPLETE';
export const ONBOARDING_JETPACK_SECURITY = 'JETPACK_SECURITY';
export const ONBOARDING_JETPACK_STARTER = 'JETPACK_STARTER';
export const ONBOARDING_JETPACK_BACKUP = 'JETPACK_BACKUP';
export const ONBOARDING_JETPACK_ANTI_SPAM = 'JETPACK_ANTI_SPAM';
export const ONBOARDING_JETPACK_VIDEOPRESS = 'JETPACK_VIDEOPRESS';
export const ONBOARDING_JETPACK_SEARCH = 'JETPACK_SEARCH';
export const ONBOARDING_JETPACK_SCAN = 'JETPACK_SCAN';
export const ONBOARDING_JETPACK_GOLDEN_TOKEN = 'JETPACK_GOLDEN_TOKEN';

export const ONBOARDING_SUPPORT_START_TIMESTAMP = 1664323200000; // 2022-09-28

export const ONBOARDING_ORDER = [
	ONBOARDING_JETPACK_GOLDEN_TOKEN,
	ONBOARDING_JETPACK_COMPLETE,
	ONBOARDING_JETPACK_SECURITY,
	ONBOARDING_JETPACK_STARTER,
	ONBOARDING_JETPACK_BACKUP,
	ONBOARDING_JETPACK_ANTI_SPAM,
	ONBOARDING_JETPACK_VIDEOPRESS,
	ONBOARDING_JETPACK_SEARCH,
	ONBOARDING_JETPACK_SCAN,
];

export const ONBOARDING_NAME_BY_PRODUCT_SLUG = {
	[ ONBOARDING_JETPACK_GOLDEN_TOKEN ]: JETPACK_GOLDEN_TOKEN_BUNDLES,
	[ ONBOARDING_JETPACK_COMPLETE ]: JETPACK_COMPLETE_BUNDLES,
	[ ONBOARDING_JETPACK_SECURITY ]: JETPACK_SECURITY_BUNDLES,
	[ ONBOARDING_JETPACK_STARTER ]: JETPACK_STARTER_BUNDLES,
	[ ONBOARDING_JETPACK_BACKUP ]: JETPACK_BACKUP_PRODUCTS,
	[ ONBOARDING_JETPACK_ANTI_SPAM ]: JETPACK_ANTI_SPAM_PRODUCTS,
	[ ONBOARDING_JETPACK_VIDEOPRESS ]: JETPACK_VIDEOPRESS_PRODUCTS,
	[ ONBOARDING_JETPACK_SEARCH ]: JETPACK_SEARCH_PRODUCTS,
	[ ONBOARDING_JETPACK_SCAN ]: JETPACK_SCAN_PRODUCTS,
};

export const SUMMARY_SECTION_BY_ONBOARDING_NAME = {
	[ ONBOARDING_JETPACK_COMPLETE ]: {
		name: 'Complete',
		slugs: [
			'backup-activated',
			'scan-activated',
			'antispam-activated',
			'videopress-activated',
			'search-activated',
		],
	},
	[ ONBOARDING_JETPACK_SECURITY ]: {
		name: 'Security',
		slugs: [ 'backup-activated', 'scan-activated', 'antispam-activated' ],
	},
	[ ONBOARDING_JETPACK_STARTER ]: {
		name: 'Starter',
		slugs: [ 'backup-activated', 'antispam-activated' ],
	},
	[ ONBOARDING_JETPACK_BACKUP ]: {
		name: 'VaultPress Backup',
		slugs: [ 'backup-activated' ],
	},
	[ ONBOARDING_JETPACK_ANTI_SPAM ]: {
		name: 'Akismet Anti-Spam',
		slugs: [ 'antispam-activated' ],
	},
	[ ONBOARDING_JETPACK_VIDEOPRESS ]: {
		name: 'VideoPress',
		slugs: [ 'videopress-activated' ],
	},
	[ ONBOARDING_JETPACK_SEARCH ]: {
		name: 'Search',
		slugs: [ 'search-activated' ],
	},
	[ ONBOARDING_JETPACK_SCAN ]: {
		name: 'Scan',
		slugs: [ 'scan-activated' ],
	},
	[ ONBOARDING_JETPACK_GOLDEN_TOKEN ]: {
		name: __( 'Jetpack Golden Token', 'jetpack' ),
		slugs: [
			RECOMMENDATION_WIZARD_STEP.BACKUP_ACTIVATED,
			RECOMMENDATION_WIZARD_STEP.SCAN_ACTIVATED,
		],
	},
};
