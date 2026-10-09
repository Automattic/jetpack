import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { select } from '@wordpress/data';
import { useContext, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getLoadContext } from '../../../../shared/block-editor-asset-loader';
import {
	convertZoomLevelToCameraDistance,
	convertCameraDistanceToZoomLevel,
	fetchMapkitKey,
	loadMapkitLibrary,
	pointsToMapRegion,
} from '../../mapkit-utils';
import useAddressLookup from '../../use-address-lookup';
import { MapkitContext } from '../context';

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
			setMap( new mapkit.Map( mapRef.current, { showsMapTypeControl: false } ) );
		}
	}, [ mapkit, loaded, mapRef ] );
	return { map };
};

const useMapkitCenter = ( center, setCenter ) => {
	const { mapkit, map } = useMapkit();
	const setCenterRef = useRef( setCenter );
	setCenterRef.current = setCenter;
	const lat = center?.lat ?? center?.latitude;
	const lng = center?.lng ?? center?.longitude;

	useEffect( () => {
		if ( mapkit && map && Number.isFinite( lat ) && Number.isFinite( lng ) ) {
			map.center = new mapkit.Coordinate( lat, lng );
		}
	}, [ mapkit, map, lat, lng ] );

	useEffect( () => {
		if ( ! map ) {
			return;
		}
		const changeCenter = () => {
			if ( map.center ) {
				const { latitude, longitude } = map.center;
				setCenterRef.current( { lat: latitude, lng: longitude } );
			}
		};
		// Region changes also fire during initialization and marker fitting.
		// These events specifically represent user interaction.
		map.addEventListener( 'scroll-end', changeCenter );
		map.addEventListener( 'zoom-end', changeCenter );
		return () => {
			map.removeEventListener( 'scroll-end', changeCenter );
			map.removeEventListener( 'zoom-end', changeCenter );
		};
	}, [ map ] );
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
				case 'black_and_white':
					return mapkit.Map.MapTypes.MutedStandard;
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
				const defaultCameraDistance = convertZoomLevelToCameraDistance( 13, map.center.latitude );
				if ( zoom ) {
					const cameraDistance = convertZoomLevelToCameraDistance( zoom, map.center.latitude );
					if ( cameraDistance !== map.cameraDistance ) {
						map.cameraDistance = cameraDistance;
					}
				} else if ( defaultCameraDistance !== map.cameraDistance ) {
					map.cameraDistance = defaultCameraDistance;
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
	const { mapkit, map, loaded, currentWindow } = useMapkit();

	// avoid rerenders by making these refs
	const callOutElementRef = useRef( callOutElement );
	const onSelectRef = useRef( onSelect );

	useEffect( () => {
		if ( loaded ) {
			// remove deleted annotations
			const annotationsToRemove = map.annotations.filter(
				annotation => ! points.find( point => point.id === annotation.data.id )
			);
			annotationsToRemove.forEach( annotation => map.removeAnnotation( annotation ) );

			const annotations = points.map( point => {
				const currentAnnotation = map.annotations.find(
					annotation => annotation.data.id === point.id
				);
				if ( currentAnnotation ) {
					// update the current annotation
					currentAnnotation.title = point.title;
					currentAnnotation.color = markerColor;
					return currentAnnotation;
				}

				const marker = new mapkit.MarkerAnnotation(
					new mapkit.Coordinate( point.coordinates.latitude, point.coordinates.longitude ),
					{ color: markerColor, data: { id: point.id } }
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
			if ( map.annotations.length !== annotations.length ) {
				// Rebuild the annotations array using currentWindow to avoid issues with
				// "instanceof Array" checks on the array in the MapKit code in case this
				// code is running in a different realm.
				map.showItems( new currentWindow.Array( ...annotations ) );
			}
		}
	}, [ points, loaded, map, mapkit, markerColor, callOutElementRef, onSelectRef, currentWindow ] );
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

const useMapkitAddressLookup = ( address, onSetPointsRef ) => {
	const { mapkit, map, points } = useMapkit();
	const lookup = useMemo( () => {
		if ( ! mapkit || ! map ) {
			return null;
		}
		return query =>
			new Promise( ( resolve, reject ) => {
				const geocoder = new mapkit.Geocoder();
				geocoder.lookup( query, ( error, data ) => {
					if ( error ) {
						reject( error );
						return;
					}
					const place = data?.results?.[ 0 ];
					if ( ! place ) {
						resolve( [] );
						return;
					}
					const title = place.formattedAddress;
					resolve( [
						{
							placeTitle: title,
							title,
							caption: title,
							coordinates: {
								longitude: place.coordinate.longitude,
								latitude: place.coordinate.latitude,
							},
							id: `${ title } ${ Number( place.coordinate.latitude ).toFixed( 2 ) } ${ Number(
								place.coordinate.longitude
							).toFixed( 2 ) }`,
						},
					] );
				} );
			} );
	}, [ mapkit, map ] );

	useAddressLookup( address, points, lookup, result => onSetPointsRef.current( result ) );
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
	useMapkitAddressLookup,
};
