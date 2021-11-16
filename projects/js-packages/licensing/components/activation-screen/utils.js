const JETPACK_ANTI_SPAM_PRODUCT_IDS = [ 2110, 2111 ];

const JETPACK_BACKUP_PRODUCT_IDS = [
	// Backup Daily
	2100,
	2101,
	// Backup Realtime
	2102,
	2103,
	// Backup Tier 1
	2112,
	2113,
	// Backup Tier 2
	2114,
	2115,
];

const JETPACK_COMPLETE_PRODUCT_IDS = [ 2014, 2015 ];

const JETPACK_SCAN_PRODUCT_IDS = [
	// Scan Daily
	2106,
	2107,
	// Scan Realtime
	2108,
	2109,
];

const JETPACK_SEARCH_PRODUCT_IDS = [ 2104, 2105 ];

const JETPACK_SECURITY_PRODUCT_IDS = [
	// Security Daily
	2010,
	2011,
	// Security Realtime
	2012,
	2013,
	// Security Tier 1
	2016,
	2017,
	// Security Tier 2
	2019,
	2020,
];

const JETPACK_VIDEOPRESS_PRODUCT_IDS = [ 2116, 2117 ];

const PRODUCT_GROUPS = {
	jetpack_anti_spam: JETPACK_ANTI_SPAM_PRODUCT_IDS,
	jetpack_backup: JETPACK_BACKUP_PRODUCT_IDS,
	jetpack_complete: JETPACK_COMPLETE_PRODUCT_IDS,
	jetpack_scan: JETPACK_SCAN_PRODUCT_IDS,
	jetpack_search: JETPACK_SEARCH_PRODUCT_IDS,
	jetpack_security: JETPACK_SECURITY_PRODUCT_IDS,
	jetpack_videopress: JETPACK_VIDEOPRESS_PRODUCT_IDS,
};

/**
 * Get a product specific URL given a product Id.
 *
 * @param {number} productId -- The id of the product
 * @param {string} siteRawUrl -- The URL of the site
 * @returns {string} The URL of a dashboard specific to the given product.
 */
export function getJetpackProductDashboardUrl( productId, siteRawUrl ) {
	const cloudDashboardBaseUrl = 'https://cloud.jetpack.com';

	const productGroup = getProductGroup( productId );

	const productToDashboardLink = {
		jetpack_anti_spam: `${ cloudDashboardBaseUrl }/landing/${ siteRawUrl }`,
		jetpack_backup: `${ cloudDashboardBaseUrl }/backup/${ siteRawUrl }`,
		jetpack_complete: `${ cloudDashboardBaseUrl }/backup/${ siteRawUrl }`,
		jetpack_scan: `${ cloudDashboardBaseUrl }/scan/${ siteRawUrl }`,
		jetpack_search: `${ cloudDashboardBaseUrl }/jetpack-search/${ siteRawUrl }`,
		jetpack_security: `${ cloudDashboardBaseUrl }/backup/${ siteRawUrl }`,
		jetpack_videopress: `${ cloudDashboardBaseUrl }/landing/${ siteRawUrl }`,
		default: `${ cloudDashboardBaseUrl }/landing/${ siteRawUrl }`,
	};
	return productToDashboardLink[ productGroup ];
}

/**
 * Get the group of a product given a product Id.
 *
 * @param {number} productId -- The id of the product
 * @returns {string} The group of the product.
 */
export function getProductGroup( productId ) {
	return (
		Object.keys( PRODUCT_GROUPS ).find( key => PRODUCT_GROUPS[ key ].includes( productId ) ) ||
		'default'
	);
}
