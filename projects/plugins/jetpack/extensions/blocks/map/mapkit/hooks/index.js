import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { select } from '@wordpress/data';
import { useContext, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash';
import { getLoadContext } from '../../../../shared/block-editor-asset-loader';
import {
	convertZoomLevelToCameraDistance,
	convertCameraDistanceToZoomLevel,
	fetchMapkitKey,
	loadMapkitLibrary,
	pointsToMapRegion,
} from '../../mapkit-utils';
import { MapkitContext } from '../context';

const DEFAULT_LATITUDE = 37.7577;
const DEFAULT_LONGITUDE = -122.4376;
const DEFAULT_CAMERA_DISTANCE = convertZoomLevelToCameraDistance( 13, DEFAULT_LATITUDE );

const useMapkit = () => {
	return useContext( MapkitContext );
};

// mapRef can be a ref to the element that will render the map
// or a ref to the element that will be on the page when the map is rendered.
// It is only used here to determine the document and window to use.
const useMapkitSetup = mapRef => {
	const [ loaded, setLoaded ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ mapkit, setMapkit ] = useState( null );
	const [ _currentWindow, setCurrentWindow ] = useState( null );
	const [ _currentDoc, setCurrentDoc ] = useState( null );

	useEffect( () => {
		const blog_id = select( CONNECTION_STORE_ID ).getBlogId();
		const { currentDoc, currentWindow } = getLoadContext( mapRef.current );

		if ( mapRef.current ) {
			setCurrentWindow( currentWindow );
			setCurrentDoc( currentDoc );

			const fetchMapkitKeyErrorMessage = __(
				'Failed to retrieve a Mapkit API token. Please try refreshing.',
				'jetpack'
			);

			// If mapkit is already loaded, reuse it.
			if ( currentWindow.mapkit ) {
				setMapkit( currentWindow.mapkit );
				// Fetch API key in the off chance that mapkit is available but not initialized for some reason
				// It will just resolve in case it is already initialized.
				fetchMapkitKey( currentWindow.mapkit, blog_id, currentWindow ).then(
					() => {
						setLoaded( true );
					},
					() => {
						setError( fetchMapkitKeyErrorMessage );
					}
				);
			} else {
				loadMapkitLibrary( currentDoc, currentWindow ).then( mapkitObj => {
					setMapkit( mapkitObj );

					fetchMapkitKey( mapkitObj, blog_id, currentWindow ).then(
						() => {
							setLoaded( true );
						},
						() => {
							setError( fetchMapkitKeyErrorMessage );
						}
					);
				} );
			}
		}
	}, [ mapRef ] );

	return { loaded, error, mapkit, currentDoc: _currentDoc, currentWindow: _currentWindow };
};

const useMapkitInit = ( mapkit, loaded, mapRef ) => {
	const [ map, setMap ] = useState( null );
	useEffect( () => {
		if ( mapkit && loaded ) {
			setMap( new mapkit.Map( mapRef.current ) );
		}
	}, [ mapkit, loaded, mapRef ] );
	return { map };
};

const useMapkitCenter = ( center, setCenter ) => {
	const { mapkit, map } = useMapkit();
	const memoizedCenter = useRef( center );
	const memoizedSetCenter = useRef( setCenter );

	useEffect( () => {
		if ( ! mapkit || ! map || ! memoizedCenter.current ) {
			return;
		}
		if (
			typeof memoizedCenter.current.lat === 'undefined' ||
			typeof memoizedCenter.current.lng === 'undefined'
		) {
			map.center = new mapkit.Coordinate( DEFAULT_LATITUDE, DEFAULT_LONGITUDE );
		} else {
			map.center = new mapkit.Coordinate( memoizedCenter.current.lat, memoizedCenter.current.lng );
		}
	}, [ mapkit, map, memoizedCenter ] );

	useEffect( () => {
		if ( ! mapkit || ! map ) {
			return;
		}

		const changeRegion = () => {
			if ( map.center ) {
				const { latitude, longitude } = map.center;
				memoizedSetCenter.current( { lat: latitude, lng: longitude } );
			}
		};

		map.addEventListener( 'region-change-end', debounce( changeRegion, 1000 ) );

		return () => {
			map.removeEventListener( 'region-change-end', changeRegion );
		};
	}, [ mapkit, map, memoizedSetCenter ] );
};

const useMapkitType = mapStyle => {
	const { mapkit, map } = useMapkit();

	useEffect( () => {
		if ( ! mapkit || ! map ) {
			return;
		}
		map.mapType = ( () => {
			switch ( mapStyle ) {
				case 'satellite':
					return mapkit.Map.MapTypes.Satellite;
				case 'muted':
					return mapkit.Map.MapTypes.Muted;
				case 'hybrid':
					return mapkit.Map.MapTypes.Hybrid;
				default:
					return mapkit.Map.MapTypes.Standard;
			}
		} )();
	}, [ mapkit, map, mapStyle ] );
};

const useMapkitZoom = ( zoom, setZoom ) => {
	const { mapkit, map, points } = useMapkit();

	useEffect( () => {
		if ( mapkit && map ) {
			if ( points && points.length <= 1 ) {
				if ( zoom ) {
					const cameraDistance = convertZoomLevelToCameraDistance( zoom, map.center.latitude );
					if ( cameraDistance !== map.cameraDistance ) {
						map.cameraDistance = cameraDistance;
					}
				} else if ( DEFAULT_CAMERA_DISTANCE !== map.cameraDistance ) {
					map.cameraDistance = DEFAULT_CAMERA_DISTANCE;
				}
				// Zooming and scrolling are enabled when there are 0 or 1 points.
				map.isZoomEnabled = true;
				map.isScrollEnabled = true;
			} else {
				map.region = pointsToMapRegion( mapkit, points );
				// Zooming and scrolling are disabled when there are multiple points.
				map.isZoomEnabled = false;
				map.isScrollEnabled = false;
			}
		}
	}, [ mapkit, map, zoom, points ] );

	useEffect( () => {
		const changeZoom = () => {
			setZoom( convertCameraDistanceToZoomLevel( map.cameraDistance, map.center.latitude ) );
		};

		map.addEventListener( 'zoom-end', changeZoom );

		return () => {
			map.removeEventListener( 'zoom-end', changeZoom );
		};
	}, [ mapkit, map, setZoom ] );
};

const useMapkitPoints = ( points, markerColor, callOutElement = null, onSelect = null ) => {
	const { mapkit, map, loaded } = useMapkit();

	// avoid rerenders by making these refs
	const callOutElementRef = useRef( callOutElement );
	const onSelectRef = useRef( onSelect );

	useEffect( () => {
		if ( loaded ) {
			map.removeAnnotations( map.annotations );
			const annotations = points.map( point => {
				const marker = new mapkit.MarkerAnnotation(
					new mapkit.Coordinate( point.coordinates.latitude, point.coordinates.longitude ),
					{ color: markerColor }
				);
				marker.calloutEnabled = true;
				marker.title = point.title;
				if ( callOutElementRef.current ) {
					marker.callout = {
						calloutElementForAnnotation: callOutElementRef.current,
					};
				}
				if ( onSelectRef.current ) {
					marker.addEventListener( 'select', () => onSelectRef.current( point, map ) );
				}
				return marker;
			} );
			map.showItems( annotations );
		}
	}, [ points, loaded, map, mapkit, markerColor, callOutElementRef, onSelectRef ] );
};

const useMapkitOnMapLoad = onMapLoad => {
	const { map, loaded } = useMapkit();
	const onMapLoadRef = useRef( onMapLoad );

	useEffect( () => {
		if ( loaded ) {
			onMapLoadRef.current( map );
		}
	}, [ loaded, map, onMapLoadRef ] );
};

const useMapkitOnMapTap = onMapTap => {
	const { map, previousCenter, loaded } = useMapkit();
	const onMapTapRef = useRef( onMapTap );

	useEffect( () => {
		if ( loaded ) {
			map.addEventListener( 'single-tap', () => {
				onMapTapRef.current( previousCenter );
			} );
		}
	}, [ loaded, map, previousCenter, onMapTapRef ] );
};

export {
	useMapkit,
	useMapkitSetup,
	useMapkitInit,
	useMapkitZoom,
	useMapkitType,
	useMapkitCenter,
	useMapkitPoints,
	useMapkitOnMapLoad,
	useMapkitOnMapTap,
};
