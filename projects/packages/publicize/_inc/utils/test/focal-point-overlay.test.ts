import { act, renderHook } from '@testing-library/react';
import {
	clearFocalPointOverlay,
	getFocalPointOverlay,
	setFocalPointOverlay,
	useFocalPointOverlay,
} from '../focal-point-overlay';

// The overlay is a module-level singleton; clear the ids used by each test.
const USED_IDS = [ 0, 101, 102, 103 ];

describe( 'focal point overlay', () => {
	afterEach( () => {
		USED_IDS.forEach( id => clearFocalPointOverlay( id ) );
	} );

	it( 'stores and reads a point per attachment id', () => {
		setFocalPointOverlay( 101, { x: 0.2, y: 0.8 } );

		expect( getFocalPointOverlay( 101 ) ).toEqual( { x: 0.2, y: 0.8 } );
		expect( getFocalPointOverlay( 102 ) ).toBeUndefined();
	} );

	it( 'clears a point', () => {
		setFocalPointOverlay( 101, { x: 0.2, y: 0.8 } );
		clearFocalPointOverlay( 101 );

		expect( getFocalPointOverlay( 101 ) ).toBeUndefined();
	} );

	it( 'does not clear a newer point when clearing by old value', () => {
		setFocalPointOverlay( 101, { x: 0.8, y: 0.2 } );
		clearFocalPointOverlay( 101, { x: 0.2, y: 0.8 } );

		expect( getFocalPointOverlay( 101 ) ).toEqual( { x: 0.8, y: 0.2 } );
	} );

	it( 'ignores attachment id 0', () => {
		setFocalPointOverlay( 0, { x: 0.2, y: 0.8 } );

		expect( getFocalPointOverlay( 0 ) ).toBeUndefined();
	} );

	it( 're-renders a subscriber when its point changes', () => {
		const { result } = renderHook( () => useFocalPointOverlay( 103 ) );

		expect( result.current ).toBeUndefined();

		act( () => setFocalPointOverlay( 103, { x: 0.4, y: 0.6 } ) );
		expect( result.current ).toEqual( { x: 0.4, y: 0.6 } );

		act( () => clearFocalPointOverlay( 103 ) );
		expect( result.current ).toBeUndefined();
	} );
} );
