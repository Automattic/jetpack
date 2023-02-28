import { Children, memo, useCallback, useEffect, useRef } from '@wordpress/element';
import { get } from 'lodash';
import { MapkitProvider } from '../mapkit/context';
import {
	useMapkit,
	useMapkitSetup,
	useMapkitInit,
	useMapkitType,
	useMapkitCenter,
	useMapkitZoom,
	useMapkitPoints,
} from '../mapkit/hooks';
import InfoWindow from './info-window';

const MapkitComponent = props => {
	const { admin, points, onSetPoints } = props;
	const mapRef = useRef( null );
	const { loaded, mapkit, currentDoc, currentWindow } = useMapkitSetup( mapRef );
	const { map } = useMapkitInit( mapkit, loaded, mapRef );
	const addPoint = Children.map( props.children, child => {
		const tagName = get( child, 'props.tagName' );
		if ( 'AddPoint' === tagName ) {
			return child;
		}
	} );

	// TODO: make height dynamic
	return (
		<MapkitProvider
			value={ {
				mapkit,
				map,
				loaded,
				currentDoc,
				currentWindow,
				admin,
				points,
				setPoints: onSetPoints,
			} }
		>
			{ loaded && mapkit && map ? <MapkitHelpers { ...props } /> : null }
			<div
				style={ { height: '400px' } }
				className="wp-block-jetpack-map__gm-container"
				ref={ mapRef }
			></div>
			{ addPoint }
			<InfoWindow />
		</MapkitProvider>
	);
};

const MapkitHelpers = memo(
	( {
		mapCenter,
		mapStyle,
		zoom,
		onSetMapCenter,
		onSetZoom,
		points,
		markerColor,
		onMarkerClick,
		onMapLoaded,
	} ) => {
		const { map, mapkit, loaded, setActiveMarker, setCalloutReference, currentDoc } = useMapkit();
		const loadedCallback = onMapLoaded;
		useMapkitCenter( mapCenter, onSetMapCenter );
		useMapkitType( mapStyle );
		useMapkitZoom( zoom, onSetZoom );
		useMapkitPoints(
			points,
			markerColor,
			useCallback( () => {
				const element = currentDoc.createElement( 'div' );
				element.classList.add( 'mapkit-popup-content' );
				setCalloutReference( element );
				return element;
			}, [ currentDoc, setCalloutReference ] ),
			useCallback(
				marker => {
					setActiveMarker( marker );
					onMarkerClick( marker );
					map.setCenterAnimated(
						new mapkit.Coordinate( marker.coordinates.latitude, marker.coordinates.longitude )
					);
				},
				[ map, mapkit, onMarkerClick, setActiveMarker ]
			)
		);

		useEffect( () => {
			//console.log( 'loaded' );
			if ( loaded && map ) {
				loadedCallback( map );
			}
		}, [ loaded, loadedCallback, map ] );

		useEffect( () => {
			// console.log( 'register tap' );

			if ( loaded ) {
				map.addEventListener( 'single-tap', () => {
					setActiveMarker( null );
				} );
			}
		}, [ loaded, map, setActiveMarker ] );

		return null;
	}
);

MapkitComponent.defaultProps = {
	points: [],
	mapStyle: 'default',
	zoom: 13,
	onSetZoom: () => {},
	onSetMapCenter: () => {},
	onMapLoaded: () => {},
	onMarkerClick: () => {},
	onError: () => {},
	markerColor: 'red',
	mapCenter: {},
};

export default MapkitComponent;
