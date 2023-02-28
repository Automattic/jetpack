import { Children, forwardRef, memo, useEffect, useRef } from '@wordpress/element';
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

const MapkitComponent = forwardRef( ( props, mapRef ) => {
	const { admin, points, onSetPoints } = props;
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
				style={ { height: props.mapHeight ? `${ props.mapHeight }px` : '400px' } }
				className="wp-block-jetpack-map__gm-container"
				ref={ mapRef }
			></div>
			{ addPoint }
			<InfoWindow />
		</MapkitProvider>
	);
} );

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

		// Save these in a ref to prevent unwanted rerenders
		const onMapLoadedRef = useRef( onMapLoaded );
		const onMarkerClickRef = useRef( onMarkerClick );

		useMapkitCenter( mapCenter, onSetMapCenter );
		useMapkitType( mapStyle );
		useMapkitZoom( zoom, onSetZoom );
		useMapkitPoints(
			points,
			markerColor,
			() => {
				const element = currentDoc.createElement( 'div' );
				element.classList.add( 'mapkit-popup-content' );
				setCalloutReference( element );
				return element;
			},
			marker => {
				setActiveMarker( marker );
				if ( onMarkerClickRef.current ) {
					onMarkerClickRef.current( marker );
				}
				map.setCenterAnimated(
					new mapkit.Coordinate( marker.coordinates.latitude, marker.coordinates.longitude )
				);
			}
		);

		useEffect( () => {
			if ( loaded && map && onMapLoadedRef.current ) {
				onMapLoadedRef.current( map );
			}
		}, [ loaded, map, onMapLoadedRef ] );

		useEffect( () => {
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
