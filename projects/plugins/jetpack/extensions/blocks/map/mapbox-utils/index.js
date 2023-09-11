export const googlePoint2Mapbox = google_point =>
	google_point.hasOwnProperty( 'lat' ) && google_point.hasOwnProperty( 'lng' )
		? google_point // Already a valid Mapbox point.
		: {
				// Legacy point, supported here to avoid block deprecation.
				lat: google_point.latitude || 0,
				lng: google_point.longitude || 0,
		  };

export function getMapBounds( mapboxgl, points ) {
	const bounds = new mapboxgl.LngLatBounds();
	points.forEach( point => {
		bounds.extend( [ point.coordinates.longitude, point.coordinates.latitude ] );
	} );
	return bounds;
}

export function fitMapToBounds( map, bounds ) {
	map.fitBounds( bounds, {
		padding: {
			top: 80,
			bottom: 80,
			left: 40,
			right: 40,
		},
	} );
}

export function setMarkerHTML( el, markerColor ) {
	el.innerHTML = `
		<?xml version="1.0" encoding="UTF-8"?>
		<svg version="1.1" viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			<g fill-rule="evenodd">
				<path id="d" d="m16 38s16-11.308 16-22-7.1634-16-16-16-16 5.3076-16 16 16 22 16 22z" fill="${ markerColor }"/>
			</g>
		</svg>
	`;
}

export function createInfoWindowPopup( mapboxgl ) {
	return new mapboxgl.Popup( {
		closeButton: true,
		closeOnClick: false,
		offset: {
			left: [ 0, 0 ],
			top: [ 0, 5 ],
			right: [ 0, 0 ],
			bottom: [ 0, -40 ],
		},
	} );
}
