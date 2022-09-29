import {
	JETPACK_COMPLETE_BUNDLES,
	JETPACK_SECURITY_BUNDLES,
	JETPACK_BACKUP_PRODUCTS,
	JETPACK_ANTI_SPAM_PRODUCTS,
	JETPACK_VIDEOPRESS_PRODUCTS,
	JETPACK_SEARCH_PRODUCTS,
	JETPACK_SCAN_PRODUCTS,
} from 'lib/plans/constants';

export const RECOMMENDATION_WIZARD_STEP = {
	NOT_STARTED: 'not-started',
	SITE_TYPE: 'site-type-question',
	PRODUCT_SUGGESTIONS: 'product-suggestions',
	PRODUCT_PURCHASED: 'product-purchased',
	AGENCY: 'agency',
	WOOCOMMERCE: 'woocommerce',
	MONITOR: 'monitor',
	RELATED_POSTS: 'related-posts',
	CREATIVE_MAIL: 'creative-mail',
	SITE_ACCELERATOR: 'site-accelerator',
	PUBLICIZE: 'publicize',
	PROTECT: 'protect',
	ANTI_SPAM: 'anti-spam',
	VIDEOPRESS: 'videopress',
	BACKUP_PLAN: 'backup-plan',
	WELCOME__BACKUP: 'welcome__backup',
	WELCOME__COMPLETE: 'welcome__complete',
	WELCOME__SECURITY: 'welcome__security',
	WELCOME__ANTISPAM: 'welcome__antispam',
	WELCOME__VIDEOPRESS: 'welcome__videopress',
	WELCOME__SEARCH: 'welcome__search',
	WELCOME__SCAN: 'welcome__scan',
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
export const ONBOARDING_JETPACK_BACKUP = 'JETPACK_BACKUP';
export const ONBOARDING_JETPACK_ANTI_SPAM = 'JETPACK_ANTI_SPAM';
export const ONBOARDING_JETPACK_VIDEOPRESS = 'JETPACK_VIDEOPRESS';
export const ONBOARDING_JETPACK_SEARCH = 'JETPACK_SEARCH';
export const ONBOARDING_JETPACK_SCAN = 'JETPACK_SCAN';

export const ONBOARDING_ORDER = [
	ONBOARDING_JETPACK_COMPLETE,
	ONBOARDING_JETPACK_SECURITY,
	ONBOARDING_JETPACK_BACKUP,
	ONBOARDING_JETPACK_ANTI_SPAM,
	ONBOARDING_JETPACK_VIDEOPRESS,
	ONBOARDING_JETPACK_SEARCH,
	ONBOARDING_JETPACK_SCAN,
];

export const ONBOARDING_NAME_BY_PRODUCT_SLUG = {
	[ ONBOARDING_JETPACK_COMPLETE ]: JETPACK_COMPLETE_BUNDLES,
	[ ONBOARDING_JETPACK_SECURITY ]: JETPACK_SECURITY_BUNDLES,
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
	[ ONBOARDING_JETPACK_BACKUP ]: {
		name: 'Backup',
		slugs: [ 'backup-activated' ],
	},
	[ ONBOARDING_JETPACK_ANTI_SPAM ]: {
		name: 'Anti-Spam',
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
};

/**
 * Function to get an onboarding for the specific product
 *
 * @param {string} productSlug - slug of the product
 * @returns {string} onboarding name or null if onboarding not found
 */
export function getOnboardingNameByProductSlug( productSlug ) {
	const foundIndex = Object.values( ONBOARDING_NAME_BY_PRODUCT_SLUG ).findIndex( slugs =>
		slugs.includes( productSlug )
	);

	if ( -1 === foundIndex ) {
		return null;
	}

	return Object.keys( ONBOARDING_NAME_BY_PRODUCT_SLUG )[ foundIndex ];
}

/**
 * Function to get an onboarding priority
 *
 * @param {string} name - onboarding name
 * @returns {number} the onboarding priority or 999 (max priority) if onboarding not found
 */
export function getOnboardingPriority( name ) {
	const index = ONBOARDING_ORDER.indexOf( name );

	return index > -1 ? index : 999;
}

/**
 * Sorting function for array of recommendation onboardings.
 *
 * @param {Object} a - left Onboarding object to compare
 * @param {Object} b - right Onboarding object to compare
 * @returns {number} Value ( -1, 0, 1) to sort array in descending order
 */
export function sortByOnboardingPriority( a, b ) {
	return getOnboardingPriority( a ) - getOnboardingPriority( b );
}
