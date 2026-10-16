import { act, renderHook } from '@testing-library/react';
import { useElementWidth } from '../use-element-width';

type ResizeCallback = ( entries: { contentRect: { width: number } }[] ) => void;

let observers: FakeResizeObserver[];

class FakeResizeObserver {
	callback: ResizeCallback;
	observed: Element[] = [];
	disconnected = false;

	constructor( callback: ResizeCallback ) {
		this.callback = callback;
		observers.push( this );
	}

	observe( element: Element ): void {
		this.observed.push( element );
	}

	disconnect(): void {
		this.disconnected = true;
	}
}

beforeEach( () => {
	observers = [];
	( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = FakeResizeObserver;
} );

afterEach( () => {
	delete ( globalThis as { ResizeObserver?: unknown } ).ResizeObserver;
} );

describe( 'useElementWidth', () => {
	it( 'measures on attach and follows resize observations', () => {
		const { result } = renderHook( () => useElementWidth() );
		expect( result.current.width ).toBe( 0 );

		const element = document.createElement( 'div' );
		jest.spyOn( element, 'getBoundingClientRect' ).mockReturnValue( {
			width: 640,
		} as DOMRect );

		act( () => result.current.ref( element ) );
		expect( result.current.width ).toBe( 640 );
		expect( observers ).toHaveLength( 1 );
		expect( observers[ 0 ].observed ).toEqual( [ element ] );

		act( () => observers[ 0 ].callback( [ { contentRect: { width: 800 } } ] ) );
		expect( result.current.width ).toBe( 800 );
	} );

	it( 'disconnects the observer when the element detaches', () => {
		const { result } = renderHook( () => useElementWidth() );
		act( () => result.current.ref( document.createElement( 'div' ) ) );
		act( () => result.current.ref( null ) );
		expect( observers[ 0 ].disconnected ).toBe( true );
	} );

	it( 'falls back to a one-shot measure without ResizeObserver', () => {
		delete ( globalThis as { ResizeObserver?: unknown } ).ResizeObserver;
		const { result } = renderHook( () => useElementWidth() );
		const element = document.createElement( 'div' );
		jest.spyOn( element, 'getBoundingClientRect' ).mockReturnValue( {
			width: 320,
		} as DOMRect );
		act( () => result.current.ref( element ) );
		expect( result.current.width ).toBe( 320 );
		expect( observers ).toHaveLength( 0 );
	} );
} );
