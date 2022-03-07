/**
 * Internal dependencies
 */
import {
	antiSpamProductData,
	backupProductData,
	boostProductData,
	crmProductData,
	extrasProductData,
	scanProductData,
	searchProductData,
	securityProductData,
	videoPressProductData,
} from './mock-data.js';

const mapResponse = {
	'anti-spam': antiSpamProductData,
	backup: backupProductData,
	boost: boostProductData,
	crm: crmProductData,
	extras: extrasProductData,
	scan: scanProductData,
	search: searchProductData,
	security: securityProductData,
	videopress: videoPressProductData,
};

/**
 * Helper function that returns the story mock data.
 *
 * @param {string} product - Product slug
 * @returns {Array}          Story mock data
 */
export function getMockData( product ) {
	const isArray = product.constructor === Array;
	const productSlugs = isArray ? product : [ product ];

	return productSlugs.map( productSlug => {
		return {
			url: `my-jetpack/v1/site/products/${ productSlug }?_locale=user`,
			method: 'GET',
			status: 200,
			response: mapResponse[ productSlug ],
		};
	} );
}

/**
 * Return all product mocked data.
 *
 * @returns {Array} All products mocked data.
 */
export function getAllMockData() {
	return getMockData( [
		'anti-spam',
		'backup',
		'boost',
		'crm',
		'extras',
		'scan',
		'search',
		'security',
		'videopress',
	] );
}
