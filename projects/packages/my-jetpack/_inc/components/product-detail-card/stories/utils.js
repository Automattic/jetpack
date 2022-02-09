/**
 * Internal dependencies
 */
import { backupProductData, boostProductData, scanProductData, searchProductData } from './mock-data.js';
const mapResponse = {
	backup: backupProductData,
	boost: boostProductData,
	scan: scanProductData,
	search: searchProductData,
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
