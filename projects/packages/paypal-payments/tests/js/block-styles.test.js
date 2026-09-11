/**
 * The canvas half of the style mapping.
 *
 * Margin and border go through core's own block-support helpers, the JS twin of
 * the wp_style_engine_get_styles() call render_api_managed_button() makes, so
 * these assert the shape both sides produce rather than a hand-built one.
 */

import {
	getButtonStyle,
	getTextStyle,
	getBorderStyle,
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

/**
 * The QR wrapper's style — Width, margin and Border all land on the one element.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object.
 */
const qrWrapper = attributes => ( {
	...getWrapperStyle( attributes ),
	...getBorderStyle( attributes ),
} );

// The other half of this table runs in tests/php. A value one side drops and the
// other keeps is drift between the canvas and the published page, so it fails here.
describe( 'style parity with the published page', () => {
	it.each( parity.cases.map( c => [ c.name, c ] ) )( '%s', ( _name, testCase ) => {
		// The QR wrapper carries both, so the table is checked against the pair the
		// way QrPreview and the QR branch of render_api_managed_button() compose it.
		expect( asDeclarations( qrWrapper( testCase.attributes ) ) ).toEqual( testCase.declarations );
	} );

	// One helper serves the QR caption and the payment link. The PHP half runs
	// each of these twice, once per format, to catch a branch that forgets to
	// call it.
	it.each( parity.textCases.map( c => [ c.name, c ] ) )( 'text: %s', ( _name, testCase ) => {
		expect( asDeclarations( getTextStyle( testCase.color, testCase.fontSize ) ) ).toEqual(
			testCase.declarations
		);
	} );

	// The published page refuses these, so the canvas has to as well — otherwise
	// a hand-edited block renders in the editor and vanishes on publish.
	it.each( parity.rejectedCases.map( c => [ c.name, c ] ) )( 'refuses %s', ( _name, testCase ) => {
		expect( qrWrapper( testCase.attributes ) ).toEqual( {} );
	} );

	it.each( parity.rejectedTextCases.map( c => [ c.name, c ] ) )(
		'refuses %s as text',
		( _name, testCase ) => {
			expect( getTextStyle( testCase.color, testCase.fontSize ) ).toEqual( {} );
		}
	);

	// The button's own — a background, and Outline dropping it. Its color and
	// size go through getTextStyle, so the textCases above already cover those.
	it.each( parity.buttonCases.map( c => [ c.name, c ] ) )( 'button: %s', ( _name, testCase ) => {
		expect( asDeclarations( getButtonStyle( testCase.attributes ) ) ).toEqual(
			testCase.declarations
		);
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
		expect( getBorderStyle( { style: { border: { radius: '8px' } } } ) ).toEqual( {
			borderRadius: '8px',
		} );
		expect(
			getBorderStyle( { style: { border: { radius: { topLeft: '4px', bottomRight: '9px' } } } } )
		).toEqual( { borderTopLeftRadius: '4px', borderBottomRightRadius: '9px' } );
	} );

	it( 'draws no stroke unless it has both a width and a color', () => {
		// Half a stroke renders inconsistently — border-style defaults to `none`,
		// so a width and color with no style would draw nothing on the frontend.
		expect( getBorderStyle( { style: { border: { width: '2px' } } } ) ).toEqual( {} );
		expect( getBorderStyle( { style: { border: { color: '#ff0000' } } } ) ).toEqual( {} );
		expect( getBorderStyle( { style: { border: { width: '2px', color: '#ff0000' } } } ) ).toEqual( {
			borderWidth: '2px',
			borderColor: '#ff0000',
			borderStyle: 'solid',
		} );
	} );

	it( 'keeps a radius when the stroke is dropped', () => {
		expect( getBorderStyle( { style: { border: { width: '2px', radius: '8px' } } } ) ).toEqual( {
			borderRadius: '8px',
		} );
	} );

	it( 'passes the width through with its unit', () => {
		expect( getWrapperStyle( { blockWidth: '75%' } ) ).toEqual( { maxWidth: '75%' } );
	} );
} );

describe( 'getTextStyle', () => {
	it( 'is empty when nothing is configured', () => {
		expect( getTextStyle() ).toEqual( {} );
	} );

	it( 'takes the size with whatever unit the picker gave it', () => {
		// FontSizePicker returns the size with its unit once the theme defines
		// font-size presets as strings, which block themes do.
		expect( getTextStyle( '#0000ff', '20px' ) ).toEqual( {
			color: '#0000ff',
			fontSize: '20px',
		} );
	} );

	it( 'passes a theme preset and a fluid size through untouched', () => {
		expect( getTextStyle( '', 'var(--wp--preset--font-size--small)' ) ).toEqual( {
			fontSize: 'var(--wp--preset--font-size--small)',
		} );
		expect( getTextStyle( '', 'clamp(0.875rem, 1vw, 1rem)' ) ).toEqual( {
			fontSize: 'clamp(0.875rem, 1vw, 1rem)',
		} );
	} );
} );
