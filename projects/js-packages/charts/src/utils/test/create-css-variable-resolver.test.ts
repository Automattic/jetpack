import { createCssVariableResolver } from '../resolve-css-var';

describe( 'createCssVariableResolver', () => {
	let originalGetComputedStyle: typeof window.getComputedStyle;

	beforeEach( () => {
		originalGetComputedStyle = window.getComputedStyle;
	} );

	afterEach( () => {
		window.getComputedStyle = originalGetComputedStyle;
	} );

	const mockStyles = ( values: Record< string, string > ) => {
		const spy = jest.fn( () => ( {
			getPropertyValue: ( prop: string ) => values[ prop ] ?? '',
		} ) );
		window.getComputedStyle = spy as unknown as typeof window.getComputedStyle;

		return spy;
	};

	it( 'reads many values from a single snapshot', () => {
		const spy = mockStyles( { '--a': '#111', '--b': '#222' } );
		const resolve = createCssVariableResolver();

		expect( resolve( '--a' ) ).toBe( '#111' );
		expect( resolve( 'var(--b)' ) ).toBe( '#222' );
		expect( spy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'takes no snapshot at all for values that need no lookup', () => {
		const spy = mockStyles( {} );
		const resolve = createCssVariableResolver();

		expect( resolve( '#ffffff' ) ).toBe( '#ffffff' );
		expect( resolve( '' ) ).toBeNull();
		expect( spy ).not.toHaveBeenCalled();
	} );

	it( 'resolves against the element it was built for', () => {
		const element = document.createElement( 'div' );
		const spy = jest.fn( ( target: Element ) => ( {
			getPropertyValue: () => ( target === element ? '#c029dc' : '#000000' ),
		} ) );
		window.getComputedStyle = spy as unknown as typeof window.getComputedStyle;

		expect( createCssVariableResolver( element )( '--accent' ) ).toBe( '#c029dc' );
		expect( spy ).toHaveBeenCalledWith( element );
	} );

	it( 'falls back to the var() fallback when the property is unset', () => {
		mockStyles( {} );

		expect( createCssVariableResolver()( 'var(--missing, #dbdbdb)' ) ).toBe( '#dbdbdb' );
	} );

	// A failed read is not cached: a resolver built before its element is in the document would otherwise stay dead for the rest of its life, which is the shape CHARTS-255 introduces.
	it( 'retries after a snapshot that could not be taken', () => {
		const failing = jest.fn( () => {
			throw new Error( 'not attached' );
		} );
		window.getComputedStyle = failing as unknown as typeof window.getComputedStyle;

		const resolve = createCssVariableResolver();
		expect( resolve( '--a' ) ).toBeNull();

		mockStyles( { '--a': '#111' } );
		expect( resolve( '--a' ) ).toBe( '#111' );
	} );

	it( 'matches resolveCssVariable for the values it is given', () => {
		mockStyles( { '--a': '#111' } );
		const resolve = createCssVariableResolver();

		expect( [
			resolve( '--a' ),
			resolve( 'var(--a)' ),
			resolve( 'var(--z, red)' ),
			resolve( 'red' ),
		] ).toEqual( [ '#111', '#111', 'red', 'red' ] );
	} );
} );
