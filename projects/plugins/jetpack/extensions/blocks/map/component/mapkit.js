import { Children, forwardRef, memo, useCallback, useRef } from '@wordpress/element';
import { get } from 'lodash';
import { MapkitProvider } from '../mapkit/context';
import {
	useMapkit,
	useMapkitSetup,
	useMapkitInit,
	useMapkitType,
	useMapkitCenter,
	useMapkitOnMapLoad,
	useMapkitOnMapTap,
	useMapkitZoom,
	useMapkitPoints,
} from '../mapkit/hooks';
import { createCalloutElement } from '../mapkit-utils';
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
		const { map, mapkit, setActiveMarker, setCalloutReference, currentDoc } = useMapkit();

		// Save these in a ref to prevent unwanted rerenders
		const onMarkerClickRef = useRef( onMarkerClick );

		const onSelect = useCallback(
			marker => {
				setActiveMarker( marker );
				if ( onMarkerClickRef.current ) {
					onMarkerClickRef.current( marker );
				}
				map.setCenterAnimated(
					new mapkit.Coordinate( marker.coordinates.latitude, marker.coordinates.longitude )
				);
			},
			[ map, mapkit, setActiveMarker, onMarkerClickRef ]
		);

		useMapkitCenter( mapCenter, onSetMapCenter );
		useMapkitType( mapStyle );
		useMapkitZoom( zoom, onSetZoom );
		useMapkitPoints(
			points,
			markerColor,
			createCalloutElement( currentDoc, setCalloutReference ),
			onSelect
		);
		useMapkitOnMapLoad( onMapLoaded );
		useMapkitOnMapTap( () => {
			setActiveMarker( null );
			// TODO: recenter points
		} );
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
