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

	it( 'takes a color and a size', () => {
		expect( getCaptionStyle( { captionColor: '#0000ff', captionFontSize: 20 } ) ).toEqual( {
			color: '#0000ff',
			fontSize: '20px',
		} );
	} );

	it( 'reads a numeric string, the way the frontend does', () => {
		// PHP tests the value with is_numeric(), so a string must not render a size
		// on the published page and nothing in the canvas.
		expect( getCaptionStyle( { captionFontSize: '20' } ) ).toEqual( { fontSize: '20px' } );
	} );

	it( 'emits a font size of 0 rather than dropping it', () => {
		expect( getCaptionStyle( { captionFontSize: 0 } ) ).toEqual( { fontSize: '0px' } );
	} );
} );
