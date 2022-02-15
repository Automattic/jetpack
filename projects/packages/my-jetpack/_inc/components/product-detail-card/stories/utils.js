/**
 * Internal dependencies
 */
import {
	antiSpamProductData,
	backupProductData,
	boostProductData,
	scanProductData,
	searchProductData,
	securityProductData,
	videoPressProductData,
} from './mock-data.js';

const mapResponse = {
	'anti-spam': antiSpamProductData,
	backup: backupProductData,
	boost: boostProductData,
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
	const response = mapResponse[ product ];
	return [
		{
			url: `my-jetpack/v1/site/products/${ product }?_locale=user`,
			method: 'GET',
			status: 200,
			response,
		},
	];
}
