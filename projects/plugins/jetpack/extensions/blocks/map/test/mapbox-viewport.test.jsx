import { MapBoxComponent } from '../component/mapbox';

jest.mock( '@wordpress/components', () => ( {} ) );
jest.mock( '../component/info-window', () => () => null );
jest.mock( '../component/map-marker', () => () => null );
jest.mock( '../mapbox-map-formatter', () => ( { mapboxMapFormatter: () => ( {} ) } ) );
jest.mock( '../utils', () => ( { resizeMapContainer: () => {} } ) );
jest.mock( '../../../shared/block-editor-asset-loader', () => ( {} ) );

function createMap( points ) {
	const listeners = {};
	let center = { lat: 1, lng: 2 };
	let zoom = 13;
	const map = {
		on: ( name, handler ) => {
			listeners[ name ] = handler;
		},
		getCanvas: () => document.createElement( 'canvas' ),
		getCenter: () => center,
		getZoom: () => zoom,
		setCenter: ( value, eventData ) => {
			center = value;
			listeners.moveend?.( eventData ?? {} );
		},
		setZoom: ( value, eventData ) => {
			zoom = value;
			listeners.zoomend?.( eventData ?? {} );
		},
		fitBounds: ( bounds, options, eventData ) => {
			map.setCenter( bounds.getCenter(), eventData );
			map.setZoom( 8, eventData );
		},
		resize: () => {},
		addControl: () => {},
		removeControl: () => {},
		scrollZoom: { disable: () => {} },
		dragPan: { disable: () => {}, enable: () => {} },
	};
	const props = {
		...MapBoxComponent.defaultProps,
		points,
		mapCenter: center,
		onSetZoom: jest.fn(),
		onSetMapCenter: jest.fn(),
	};
	const component = new MapBoxComponent( props );
	component.state.mapboxgl = {
		Map: jest.fn( () => map ),
		FullscreenControl: jest.fn(),
		NavigationControl: jest.fn(),
		LngLatBounds: jest.fn( () => ( {
			extend: () => {},
			getCenter: () => ( { lat: 3, lng: 4 } ),
		} ) ),
	};
	component.mapRef.current = document.createElement( 'div' );
	component.setState = ( update, callback ) => {
		component.state = {
			...component.state,
			...( typeof update === 'function' ? update( component.state ) : update ),
		};
		callback?.();
	};
	component.debouncedSizeMap = Object.assign( () => {}, { cancel: () => {} } );
	component.initMap( center );
	return { component, map, props };
}

it.each( [ 1, 2 ] )( 'fits %s saved markers without persisting derived center or zoom', count => {
	const points = Array.from( { length: count }, () => ( {
		coordinates: { latitude: 3, longitude: 4 },
	} ) );
	const { component, props } = createMap( points );
	component.setBoundsByMarkers();
	component.sizeMap();
	expect( props.onSetMapCenter ).not.toHaveBeenCalled();
	expect( props.onSetZoom ).not.toHaveBeenCalled();
	component.componentWillUnmount();
} );

it( 'preserves user zoom and unpinned map movement', () => {
	const { component, map, props } = createMap( [] );
	map.setCenter( { lat: 5, lng: 6 } );
	map.setZoom( 15 );
	expect( props.onSetMapCenter ).toHaveBeenCalledWith( { lat: 5, lng: 6 } );
	expect( props.onSetZoom ).toHaveBeenCalledWith( 15 );
	component.componentWillUnmount();
} );
