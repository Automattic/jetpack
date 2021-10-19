/**
 * getCoordinates() geocodes provided address into coordinates
 *
 * @param  {string} address - physical / location address (e.g. "London") that we want to geocode into coordinates (longitude and latitude)
 * @param  {string} apiKey - Mapbox API key
 * @returns {Promise} When the fetch() is successeful, `response` will contain the response from Mapbox API
 */
export function getCoordinates( address, apiKey ) {
	return fetch(
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${ encodeURIComponent(
			address
		) }.json?access_token=${ encodeURIComponent( apiKey ) }`
	).then( response => response.json() );
}
