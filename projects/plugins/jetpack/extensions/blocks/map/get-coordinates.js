export function getCoordinates( address, apiKey ) {
	return fetch(
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${ encodeURIComponent(
			address
		) }.json?access_token=${ apiKey }`
	).then( res => res.json() );
}
