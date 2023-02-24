import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { select } from '@wordpress/data';
import { useContext, useEffect, useState, useRef, createContext } from '@wordpress/element';
import { debounce } from 'lodash';
import { getLoadContext, waitForObject } from '../../../shared/block-editor-asset-loader';

const MapContext = createContext( {
	map: null,
	mapkit: null,
	loaded: false,
} );

const useMapSetup = mapRef => {
	const [ loaded, setLoaded ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ mapkit, setMapkit ] = useState( null );

	useEffect( () => {
		const blog_id = select( CONNECTION_STORE_ID ).getBlogId();

		const loadLibrary = async () => {
			return new Promise( resolve => {
				const { currentDoc } = getLoadContext( mapRef.current );
				const element = currentDoc.createElement( 'script' );
				element.addEventListener(
					'load',
					() => {
						const { currentWindow } = getLoadContext( mapRef.current );
						waitForObject( currentWindow, 'mapkit' ).then( mapkitObj => {
							setMapkit( mapkitObj );
							resolve( mapkitObj );
						} );
					},
					{ once: true }
				);
				element.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
				//element['data-libraries'] = 'services,full-map,geojson';
				element.crossOrigin = 'anonymous';
				currentDoc.head.appendChild( element );
			} );
		};

		const fetchKey = async mapkitObj => {
			return new Promise( resolve => {
				mapkitObj.init( {
					authorizationCallback: done => {
						fetch( `https://public-api.wordpress.com/wpcom/v2/sites/${ blog_id }/mapkit` )
							.then( response => {
								if ( response.status === 200 ) {
									return response.json();
								}
								setError( 'Mapkit API error' );
							} )
							.then( data => {
								done( data.wpcom_mapkit_access_token );
								resolve();
							} );
					},
				} );
			} );
		};

		if ( mapRef.current ) {
			loadLibrary().then( mapkitObj => {
				fetchKey( mapkitObj ).then( () => {
					setLoaded( true );
				} );
			} );
		}
	}, [ mapRef ] );

	return { loaded, error, mapkit };
};

const useMapInit = ( mapkit, loaded, mapRef ) => {
	const [ map, setMap ] = useState( null );
	useEffect( () => {
		if ( mapkit && loaded ) {
			setMap( new mapkit.Map( mapRef.current ) );
		}
	}, [ mapkit, loaded, mapRef ] );
	return { map };
};

const useMapCenter = ( center, setCenter ) => {
	const { mapkit, map } = useContext( MapContext );
	const memoizedCenter = useRef( center );

	useEffect( () => {
		map.center = new mapkit.Coordinate(
			memoizedCenter.current.lat,
			memoizedCenter.current.center.lng
		);

		const changeRegion = () => {
			const { latitude, longitude } = map.center;
			setCenter( { lat: latitude, lng: longitude } );
		};

		map.addEventListener( 'region-change-end', debounce( changeRegion, 1000 ) );

		return () => {
			map.removeEventListener( 'region-change-end', changeRegion );
		};
	}, [ mapkit, map, memoizedCenter, setCenter ] );
};

const useMapType = mapStyle => {
	const { mapkit, map } = useContext( MapContext );

	useEffect( () => {
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

const useMapZoom = ( zoom, setZoom ) => {
	const { mapkit, map } = useContext( MapContext );

	useEffect( () => {
		if ( mapkit && map ) {
			map.zoom = zoom;
			const changeZoom = () => {
				setZoom( map.zoom );
			};

			map.addEventListener( 'zoom-end', debounce( changeZoom, 1000 ) );

			return () => {
				map.removeEventListener( 'zoom-end', changeZoom );
			};
		}
	}, [ mapkit, map, zoom, setZoom ] );
};

const MapkitComponent = props => {
	const mapRef = useRef( null );
	const { loaded, mapkit } = useMapSetup( mapRef );
	const { map } = useMapInit( mapkit, loaded, mapRef );

	return (
		<MapContext.Provider value={ { mapkit, map, loaded } }>
			{ loaded && mapkit && map ? <MapkitHelpers { ...props } /> : null }
			<div
				style={ { height: '400px' } }
				className="wp-block-jetpack-map__gm-container"
				ref={ mapRef }
			></div>
		</MapContext.Provider>
	);
};

const MapkitHelpers = ( { mapCenter, mapStyle, zoom, onSetMapCenter } ) => {
	useMapCenter( mapCenter, onSetMapCenter );
	useMapType( mapStyle );
	useMapZoom( zoom );
	return null;
};

/*

MapKitComponent.defaultProps = {
	points: [],
	mapStyle: 'default',
	zoom: 13,
	onSetZoom: () => {
	},
	onSetMapCenter: () => {
	},
	onMapLoaded: () => {
	},
	onMarkerClick: () => {
	},
	onError: () => {
	},
	markerColor: 'red',
	apiKey: null,
	mapCenter: {},
};

 */
export default MapkitComponent;
