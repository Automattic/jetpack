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

	const getRequests = productSlugs.map( productSlug => {
		return {
			url: `my-jetpack/v1/site/products/${ productSlug }?_locale=user`,
			method: 'GET',
			status: 200,
			response: mapResponse[ productSlug ],
		};
	} );

	const postRequests = productSlugs.map( productSlug => {
		return {
			url: `my-jetpack/v1/site/products/${ productSlug }?_locale=user`,
			method: 'POST',
			status: 200,
			response: {
				...mapResponse[ productSlug ],
				status: mapResponse[ productSlug ].status === 'active' ? 'inactive' : 'active',
			},
		};
	} );

	return [ ...getRequests, ...postRequests ];
}

/**
 * Return all product mocked data.
 *
 * @returns {Array} All products mocked data.
 */
export function getAllMockData() {
	return getMockData( [ ...Object.keys( mapResponse ) ] );
}

/**
 * Return product slugs list
 *
 * @param {boolean} includeBundles - Whether to include product bundles
 * @returns {Array} product slugs list.
 */
export function getProductSlugs( includeBundles = false ) {
	const slugs = Object.keys( mapResponse );
	if ( includeBundles ) {
		return slugs;
	}

	return slugs.filter( slug => ! mapResponse[ slug ].is_bundle );
}
