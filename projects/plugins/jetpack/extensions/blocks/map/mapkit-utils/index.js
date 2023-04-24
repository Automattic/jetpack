import { waitForObject } from '../../../shared/block-editor-asset-loader';

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

function pointsToMapRegion( mapkit, points ) {
	if ( points.length === 0 ) {
		return null;
	}

	const topLeftCoord = new mapkit.Coordinate( -90, 180 );
	const bottomRightCoord = new mapkit.Coordinate( 90, -180 );

	points.forEach( point => {
		topLeftCoord.latitude = Math.max( topLeftCoord.latitude, point.coordinates.latitude );
		topLeftCoord.longitude = Math.min( topLeftCoord.longitude, point.coordinates.longitude );
		bottomRightCoord.latitude = Math.min( bottomRightCoord.latitude, point.coordinates.latitude );
		bottomRightCoord.longitude = Math.max(
			bottomRightCoord.longitude,
			point.coordinates.longitude
		);
	} );

	const center = new mapkit.Coordinate(
		topLeftCoord.latitude - ( topLeftCoord.latitude - bottomRightCoord.latitude ) * 0.5,
		topLeftCoord.longitude + ( bottomRightCoord.longitude - topLeftCoord.longitude ) * 0.5
	);

	const span = new mapkit.CoordinateSpan(
		Math.abs( topLeftCoord.latitude - bottomRightCoord.latitude ) * 1.3,
		Math.abs( bottomRightCoord.longitude - topLeftCoord.longitude ) * 1.3
	);

	return new mapkit.CoordinateRegion( center, span );
}

function createCalloutElementCallback( currentDoc, callback ) {
	return () => {
		const element = currentDoc.createElement( 'div' );
		element.classList.add( 'mapkit-popup-content' );
		callback( element );
		return element;
	};
}

function waitUntilMapkitIsInitialized( currentWindow ) {
	return new Promise( ( resolve, reject ) => {
		const check = () => {
			if ( typeof currentWindow.mapkitIsInitializing === 'undefined' ) {
				reject();
			} else if ( currentWindow.mapkitIsInitializing === false ) {
				resolve();
			} else {
				currentWindow.requestAnimationFrame( check );
			}
		};
		check();
	} );
}

function loadMapkitLibrary( currentDoc, currentWindow ) {
	return new Promise( resolve => {
		if ( currentWindow.mapkitScriptIsLoading ) {
			waitForObject( currentWindow, 'mapkit' ).then( mapkitObj => {
				resolve( mapkitObj );
			} );
		} else {
			currentWindow.mapkitScriptIsLoading = true;

			const element = currentDoc.createElement( 'script' );
			element.addEventListener(
				'load',
				async () => {
					const mapkitObj = await waitForObject( currentWindow, 'mapkit' );
					currentWindow.mapkitScriptIsLoading = false;

					resolve( mapkitObj );
				},
				{ once: true }
			);
			element.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
			element.crossOrigin = 'anonymous';
			currentDoc.head.appendChild( element );
		}
	} );
}

function fetchMapkitKey( mapkitObj, blogId, currentWindow ) {
	return new Promise( ( resolve, reject ) => {
		if ( currentWindow.mapkitIsInitialized ) {
			resolve();
		} else if ( currentWindow.mapkitIsInitializing ) {
			waitUntilMapkitIsInitialized( currentWindow ).then( () => {
				resolve();
			} );
		} else {
			currentWindow.mapkitIsInitializing = true;
			currentWindow.mapkitIsInitialized = false;
			mapkitObj.init( {
				authorizationCallback: async done => {
					try {
						const response = await fetch( `https://public-api.wordpress.com/wpcom/v2/mapkit` );
						if ( response.status === 200 ) {
							const data = await response.json();
							done( data.wpcom_mapkit_access_token );
						} else {
							reject();
						}
						currentWindow.mapkitIsInitializing = false;
						currentWindow.mapkitIsInitialized = true;
						resolve();
					} catch ( error ) {
						reject();
					}
				},
			} );
		}
	} );
}

export {
	convertZoomLevelToCameraDistance,
	convertCameraDistanceToZoomLevel,
	createCalloutElementCallback,
	fetchMapkitKey,
	loadMapkitLibrary,
	pointsToMapRegion,
};
