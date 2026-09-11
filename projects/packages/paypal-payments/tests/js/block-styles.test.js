/**
 * The canvas half of the style mapping.
 *
 * Margin and border go through core's own block-support helpers, the JS twin of
 * the wp_style_engine_get_styles() call render_api_managed_button() makes, so
 * these assert the shape both sides produce rather than a hand-built one.
 */

import {
	getCaptionStyle,
	getWrapperStyle,
} from '../../src/paypal-payment-buttons/utils/block-styles';
import parity from '../fixtures/style-parity.json';

/**
 * React style keys are camelCase; the fixture and the published page use CSS
 * property names.
 *
 * @param {object} style - A React style object.
 * @return {object} The same declarations, keyed by CSS property name.
 */
const asDeclarations = style =>
	Object.fromEntries(
		Object.entries( style ).map( ( [ key, value ] ) => [
			key.replace( /[A-Z]/g, letter => `-${ letter.toLowerCase() }` ),
			value,
		] )
	);

// The other half of this table runs in tests/php. A value one side drops and the
// other keeps is drift between the two, so it fails here.
describe( 'style parity with the published page', () => {
	it.each( parity.cases.map( c => [ c.name, c ] ) )( '%s', ( _name, testCase ) => {
		expect( asDeclarations( getWrapperStyle( testCase.attributes ) ) ).toEqual(
			testCase.declarations
		);
	} );

	it.each( parity.captionCases.map( c => [ c.name, c ] ) )( 'caption: %s', ( _name, testCase ) => {
		expect( asDeclarations( getCaptionStyle( testCase.attributes ) ) ).toEqual(
			testCase.declarations
		);
	} );

	// The published page refuses these, so the canvas has to as well — otherwise
	// a hand-edited block renders in the editor and vanishes on publish.
	it.each( parity.rejectedCases.map( c => [ c.name, c ] ) )( 'refuses %s', ( _name, testCase ) => {
		expect( getWrapperStyle( testCase.attributes ) ).toEqual( {} );
		expect( getCaptionStyle( testCase.attributes ) ).toEqual( {} );
	} );
} );

describe( 'getWrapperStyle', () => {
	it( 'is empty when nothing is configured', () => {
		expect( getWrapperStyle( {} ) ).toEqual( {} );
	} );

	it( 'emits a longhand per set side and leaves the rest alone', () => {
		// The published page emits only the sides that are set, so a shorthand
		// here would zero-fill the rest and override theme margin it leaves alone.
		expect(
			getWrapperStyle( { style: { spacing: { margin: { left: '8px', right: '8px' } } } } )
		).toEqual( { marginLeft: '8px', marginRight: '8px' } );
	} );

	it( 'expands a spacing preset to its CSS variable', () => {
		// Core stores a chosen preset as `var:preset|spacing|50` and expands it at
		// render; the published page does the same through the style engine.
		expect(
			getWrapperStyle( { style: { spacing: { margin: { top: 'var:preset|spacing|50' } } } } )
		).toEqual( { marginTop: 'var(--wp--preset--spacing--50)' } );
	} );

	it( 'takes a per-corner radius as well as a single one', () => {
		expect( getWrapperStyle( { style: { border: { radius: '8px' } } } ) ).toEqual( {
			borderRadius: '8px',
		} );
		expect(
			getWrapperStyle( { style: { border: { radius: { topLeft: '4px', bottomRight: '9px' } } } } )
		).toEqual( { borderTopLeftRadius: '4px', borderBottomRightRadius: '9px' } );
	} );

	it( 'draws no stroke unless it has both a width and a color', () => {
		// Half a stroke renders inconsistently — border-style defaults to `none`,
		// so a width and color with no style would draw nothing on the frontend.
		expect( getWrapperStyle( { style: { border: { width: '2px' } } } ) ).toEqual( {} );
		expect( getWrapperStyle( { style: { border: { color: '#ff0000' } } } ) ).toEqual( {} );
		expect( getWrapperStyle( { style: { border: { width: '2px', color: '#ff0000' } } } ) ).toEqual(
			{ borderWidth: '2px', borderColor: '#ff0000', borderStyle: 'solid' }
		);
	} );

	it( 'keeps a radius when the stroke is dropped', () => {
		expect( getWrapperStyle( { style: { border: { width: '2px', radius: '8px' } } } ) ).toEqual( {
			borderRadius: '8px',
		} );
	} );

	it( 'passes the width through with its unit', () => {
		expect( getWrapperStyle( { blockWidth: '75%' } ) ).toEqual( { maxWidth: '75%' } );
	} );
} );

describe( 'getCaptionStyle', () => {
	it( 'is empty when nothing is configured', () => {
		expect( getCaptionStyle( {} ) ).toEqual( {} );
	} );

	it( 'takes the size with whatever unit the picker gave it', () => {
		// FontSizePicker returns the size with its unit once the theme defines
		// font-size presets as strings, which block themes do.
		expect( getCaptionStyle( { captionColor: '#0000ff', captionFontSize: '20px' } ) ).toEqual( {
			color: '#0000ff',
			fontSize: '20px',
		} );
	} );

	it( 'passes a theme preset and a fluid size through untouched', () => {
		expect( getCaptionStyle( { captionFontSize: 'var(--wp--preset--font-size--small)' } ) ).toEqual(
			{ fontSize: 'var(--wp--preset--font-size--small)' }
		);
		expect( getCaptionStyle( { captionFontSize: 'clamp(0.875rem, 1vw, 1rem)' } ) ).toEqual( {
			fontSize: 'clamp(0.875rem, 1vw, 1rem)',
		} );
	} );
} );
