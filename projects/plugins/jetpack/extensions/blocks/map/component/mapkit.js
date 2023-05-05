import { Children, forwardRef, memo, useCallback, useEffect, useRef } from '@wordpress/element';
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
	useMapkitAddressLookup,
} from '../mapkit/hooks';
import { createCalloutElementCallback } from '../mapkit-utils';
import InfoWindow from './info-window';

const MapkitComponent = forwardRef( ( props, mapRef ) => {
	const { admin, points, onError, onSetPoints } = props;
	const { loaded, error, mapkit, currentDoc, currentWindow } = useMapkitSetup( mapRef );
	const { map } = useMapkitInit( mapkit, loaded, mapRef );
	const addPoint = Children.map( props.children, child => {
		const tagName = get( child, 'props.tagName' );
		if ( 'AddPoint' === tagName ) {
			return child;
		}
	} );

	useEffect( () => {
		if ( error ) {
			onError( 'mapkit_error', error );
		}
	}, [ error, onError ] );

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
			/>
			{ addPoint }
			<InfoWindow mapProvider="mapkit" />
		</MapkitProvider>
	);
} );

const MapkitHelpers = memo(
	( {
		address,
		mapCenter,
		mapStyle,
		zoom,
		onSetMapCenter,
		onSetZoom,
		onSetPoints,
		points,
		markerColor,
		onMarkerClick,
		onMapLoaded,
	} ) => {
		const { map, mapkit, setActiveMarker, setPreviousCenter, setCalloutReference, currentDoc } =
			useMapkit();
		// Save these in a ref to prevent unwanted rerenders
		const onMarkerClickRef = useRef( onMarkerClick );
		const onSetPointsRef = useRef( onSetPoints );

		const onSelect = useCallback(
			marker => {
				setActiveMarker( marker );
				setPreviousCenter( map.center );
				if ( onMarkerClickRef.current ) {
					onMarkerClickRef.current( marker );
				}
				map.setCenterAnimated(
					new mapkit.Coordinate( marker.coordinates.latitude, marker.coordinates.longitude )
				);
			},
			[ map, mapkit, setActiveMarker, setPreviousCenter, onMarkerClickRef ]
		);

		useMapkitCenter( mapCenter, onSetMapCenter );
		useMapkitType( mapStyle );
		useMapkitZoom( zoom, onSetZoom );
		useMapkitPoints(
			points,
			markerColor,
			createCalloutElementCallback( currentDoc, setCalloutReference ),
			onSelect
		);
		useMapkitOnMapLoad( onMapLoaded );
		useMapkitOnMapTap( previousCenter => {
			setActiveMarker( null );
			if ( previousCenter ) {
				map.setCenterAnimated( previousCenter );
			}
		} );

		useMapkitAddressLookup( address, onSetPointsRef );
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
	address: null,
};

export default MapkitComponent;
