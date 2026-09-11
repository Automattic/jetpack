/**
 * The canvas half of the style mapping.
 *
 * These mirror PayPal_Payment_Buttons::get_wrapper_style(), which runs the same
 * values through wp_style_engine_get_styles() on the published page. A change
 * here that is not made there puts the canvas back to lying about the output.
 */

import {
	getCaptionStyle,
	getWrapperStyle,
	resolvePreset,
} from '../../src/paypal-payment-buttons/utils/block-styles';

describe( 'resolvePreset', () => {
	it( 'expands a preset reference to its CSS variable', () => {
		// Core stores a chosen preset this way and expands it at render.
		expect( resolvePreset( 'var:preset|spacing|50' ) ).toBe( 'var(--wp--preset--spacing--50)' );
		expect( resolvePreset( 'var:preset|color|primary' ) ).toBe(
			'var(--wp--preset--color--primary)'
		);
	} );

	it( 'leaves a plain value alone', () => {
		expect( resolvePreset( '12px' ) ).toBe( '12px' );
		expect( resolvePreset( '#ff0000' ) ).toBe( '#ff0000' );
		expect( resolvePreset( undefined ) ).toBe( '' );
	} );
} );

describe( 'getWrapperStyle', () => {
	it( 'is empty when nothing is configured', () => {
		expect( getWrapperStyle( {} ) ).toEqual( {} );
	} );

	it( 'builds a margin shorthand, filling unset sides with 0', () => {
		expect(
			getWrapperStyle( { style: { spacing: { margin: { top: '12px', bottom: '12px' } } } } )
		).toEqual( { margin: '12px 0 12px 0' } );
	} );

	it( 'resolves a spacing preset inside the shorthand', () => {
		expect(
			getWrapperStyle( {
				style: { spacing: { margin: { top: 'var:preset|spacing|50' } } },
			} )
		).toEqual( { margin: 'var(--wp--preset--spacing--50) 0 0 0' } );
	} );

	it( 'takes a per-corner radius as well as a single one', () => {
		expect( getWrapperStyle( { style: { border: { radius: '8px' } } } ) ).toEqual( {
			borderRadius: '8px',
		} );
		expect(
			getWrapperStyle( {
				style: { border: { radius: { topLeft: '4px', bottomRight: '9px' } } },
			} )
		).toEqual( { borderRadius: '4px 0 9px 0' } );
	} );

	it( 'draws no border unless the stroke has both a width and a color', () => {
		// Without a color the browser falls back to currentColor and draws a
		// border the merchant never chose.
		expect( getWrapperStyle( { style: { border: { width: '2px' } } } ) ).toEqual( {} );
		expect( getWrapperStyle( { style: { border: { color: '#ff0000' } } } ) ).toEqual( {} );
		expect( getWrapperStyle( { style: { border: { width: '2px', color: '#ff0000' } } } ) ).toEqual(
			{ border: '2px solid #ff0000' }
		);
	} );

	it( 'passes the width through with its unit', () => {
		expect( getWrapperStyle( { blockWidth: '75%' } ) ).toEqual( { maxWidth: '75%' } );
	} );
} );

describe( 'getCaptionStyle', () => {
	it( 'is empty when nothing is configured', () => {
		expect( getCaptionStyle( {} ) ).toEqual( {} );
	} );

	it( 'takes a color and a size, including a palette preset', () => {
		expect(
			getCaptionStyle( { captionColor: 'var:preset|color|primary', captionFontSize: 20 } )
		).toEqual( { color: 'var(--wp--preset--color--primary)', fontSize: '20px' } );
	} );

	it( 'keeps a font size of 0 out rather than emitting 0px', () => {
		expect( getCaptionStyle( { captionFontSize: 0 } ) ).toEqual( { fontSize: '0px' } );
	} );
} );
