/**
 * External dependencies
 */

/**
 * Internal dependencies
 */

export const getMapboxImageUrl = ( attributes, token ) => {
	const width = 1000;
	const height = attributes.mapHeight ?? 400;
	const zoom = attributes.zoom ?? 13;
	const bearing = 0;
	const longitude = attributes.mapCenter.lng ?? -122.41941550000001;
	const latitude = attributes.mapCenter.lat ?? 37.7749295;
	// const showStreets = attributes.mapDetails ?? true;
	const markerColor = attributes.markerColor ? attributes.markerColor.replace( '#', '' ) : 'ff0000';
	const overlay = 'streets-v11';
	let markersSlug = '';

	// TODO: Add overlay switching logic.

	// Generate slug for all markers on the map.
	if ( attributes.points?.length ) {
		attributes.points.forEach( point => {
			let marker = markersSlug ? ',' : '';
			marker += `pin-s+${ markerColor }`;

			if ( point?.coordinates?.longitude && point?.coordinates?.latitude ) {
				marker += `(${ point.coordinates.longitude },${ point.coordinates.latitude })`;
				markersSlug += marker;
			}
		} );
		if ( markersSlug ) {
			markersSlug += '/';
		}
	}

	const urlBase = 'https://api.mapbox.com/styles/v1/mapbox';
	const urlWithPaths = `${ urlBase }/${ overlay }/static/${ markersSlug }${ longitude },${ latitude },${ zoom },${ bearing }/${ width }x${ height }@2x`;

	return `${ urlWithPaths }?access_token=${ token }`;
};
