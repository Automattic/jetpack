import { act, renderHook } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { MapkitContext } from '../mapkit/context';
import { useMapkitAddressLookup, useMapkitCenter } from '../mapkit/hooks';

jest.mock( '@automattic/jetpack-connection', () => ( { CONNECTION_STORE_ID: 'test' } ) );
jest.mock( '../../../shared/block-editor-asset-loader', () => ( {} ) );
jest.mock( '../mapkit-utils', () => ( {} ) );
jest.mock( '../mapkit/context', () => ( {
	MapkitContext: require( '@wordpress/element' ).createContext( {} ),
} ) );

let context;

afterEach( () => jest.useRealTimers() );
const wrapper = ( { children } ) =>
	createElement( MapkitContext.Provider, { value: context }, children );

it( 'does not geocode a saved map with an address', () => {
	const lookup = jest.fn();
	context = {
		mapkit: { Geocoder: jest.fn( () => ( { lookup } ) ) },
		map: {},
		points: [ { coordinates: { latitude: 1, longitude: 2 } } ],
	};
	const onSetPointsRef = { current: jest.fn() };
	const { unmount } = renderHook( () => useMapkitAddressLookup( 'Saved', onSetPointsRef ), {
		wrapper,
	} );
	unmount();
	renderHook( () => useMapkitAddressLookup( 'Saved', onSetPointsRef ), { wrapper } );
	expect( lookup ).not.toHaveBeenCalled();
	expect( onSetPointsRef.current ).not.toHaveBeenCalled();
} );

it( 'ignores programmatic region changes and persists user pan and zoom', () => {
	jest.useFakeTimers();
	const listeners = {};
	const map = {
		addEventListener: jest.fn( ( name, callback ) => {
			listeners[ name ] = callback;
		} ),
		removeEventListener: jest.fn( ( name, callback ) => {
			if ( listeners[ name ] === callback ) {
				delete listeners[ name ];
			}
		} ),
	};
	context = {
		mapkit: { Coordinate: jest.fn( ( latitude, longitude ) => ( { latitude, longitude } ) ) },
		map,
	};
	const setCenter = jest.fn();
	const { unmount } = renderHook( () => useMapkitCenter( { lat: 1, lng: 2 }, setCenter ), {
		wrapper,
	} );
	expect( map.center ).toEqual( { latitude: 1, longitude: 2 } );
	act( () => {
		map.center = { latitude: 3, longitude: 4 };
		listeners[ 'region-change-end' ]?.();
		jest.advanceTimersByTime( 1000 );
	} );
	expect( setCenter ).not.toHaveBeenCalled();
	act( () => listeners[ 'scroll-end' ]() );
	expect( setCenter ).toHaveBeenLastCalledWith( { lat: 3, lng: 4 } );
	act( () => {
		map.center = { latitude: 5, longitude: 6 };
		listeners[ 'zoom-end' ]();
	} );
	expect( setCenter ).toHaveBeenLastCalledWith( { lat: 5, lng: 6 } );
	unmount();
	expect( listeners ).toEqual( {} );
} );
