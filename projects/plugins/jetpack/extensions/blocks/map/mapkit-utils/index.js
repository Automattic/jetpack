const earthRadius = 6.371e6;

function getMetersPerPixel( latitude ) {
	return Math.abs( ( earthRadius * Math.cos( ( latitude * Math.PI ) / 180 ) * 2 * Math.PI ) / 256 );
}

function convertZoomLevelToCameraDistance( zoomLevel, latitude ) {
	const altitude = ( 512 / Math.pow( 2, zoomLevel ) ) * 0.5; // altitude in pixels
	return altitude * getMetersPerPixel( latitude );
}

function convertCameraDistanceToZoomLevel( cameraDistance, latitude ) {
	const altitude = cameraDistance / getMetersPerPixel( latitude );
	return Math.log2( 512 / ( altitude / 0.5 ) );
}

export { convertZoomLevelToCameraDistance, convertCameraDistanceToZoomLevel };
