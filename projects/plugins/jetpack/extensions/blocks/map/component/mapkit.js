import { memo, useCallback, useRef } from '@wordpress/element';
import { MapkitProvider } from '../mapkit/context';
import {
	useMapkitSetup,
	useMapkitInit,
	useMapkitType,
	useMapkitCenter,
	useMapkitZoom,
} from '../mapkit/hooks';

const MapkitComponent = props => {
	const mapRef = useRef( null );
	const { loaded, mapkit } = useMapkitSetup( mapRef );
	const { map } = useMapkitInit( mapkit, loaded, mapRef );
	return (
		<MapkitProvider value={ { mapkit, map, loaded } }>
			{ loaded && mapkit && map ? <MapkitHelpersWrapper { ...props } /> : null }
			<div
				style={ { height: '400px' } }
				className="wp-block-jetpack-map__gm-container"
				ref={ mapRef }
			></div>
		</MapkitProvider>
	);
};

const MapkitHelpersWrapper = ( {
	mapCenter,
	mapStyle,
	zoom,
	onSetMapCenter,
	onSetZoom,
	...rest
} ) => {
	const memoizedOnSetZoom = useCallback( value => onSetZoom( value ), [ onSetZoom ] );
	return (
		<MapkitHelpers
			{ ...{ mapCenter, mapStyle, zoom, onSetMapCenter, onSetZoom: memoizedOnSetZoom, ...rest } }
		/>
	);
};

const MapkitHelpers = memo( ( { mapCenter, mapStyle, zoom, onSetMapCenter, onSetZoom } ) => {
	useMapkitCenter( mapCenter, onSetMapCenter );
	useMapkitType( mapStyle );
	useMapkitZoom( zoom, onSetZoom );

	return null;
} );

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
