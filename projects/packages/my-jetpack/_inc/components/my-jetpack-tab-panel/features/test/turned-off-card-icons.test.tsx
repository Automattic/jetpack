/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { getFeatureIcon } from '../icons';
import { PRODUCT_ICONS } from '../mappings';

// The PHP card (src/class-turned-off-page.php) can't render React, so it carries these icons as markup.
const php = readFileSync(
	resolve( __dirname, '../../../../../src/class-turned-off-page.php' ),
	'utf8'
);

const constant = ( name: string ) => {
	const body = php.match(
		new RegExp( `const ${ name } = array\\(\\n([\\s\\S]*?)\\n\\t\\);` )
	)[ 1 ];
	return Object.fromEntries(
		[ ...body.matchAll( /^\t\t'([a-z-]+)'\s*=> '(.*)',$/gm ) ].map( ( [ , key, svg ] ) => [
			key,
			svg,
		] )
	);
};

// The card draws the product mark in grey without its tile, cropped to the mark.
const asCardMark = ( svg: string ) =>
	svg
		.replace( ' class="table-view-icon"', '' )
		.replace( ' width="64" height="64"', '' )
		.replace( 'viewBox="0 0 64 64"', 'viewBox="16 16 32 32"' )
		.replace( '<rect width="64" height="64" rx="8" fill="#003010"></rect>', '' )
		.replaceAll( 'fill="#0CED57"', 'fill="currentColor"' )
		.replaceAll( 'clip0_4668_7926', 'jetpack-feature-off-clip' )
		.replace( '<svg ', '<svg aria-hidden="true" focusable="false" ' );

describe( 'turned-off card icons', () => {
	it( 'carries every product mark the Features tab draws', () => {
		const expected = Object.fromEntries(
			Object.entries( PRODUCT_ICONS ).map( ( [ product, Icon ] ) => [
				product,
				asCardMark( renderToStaticMarkup( <Icon /> ) ),
			] )
		);

		expect( constant( 'PRODUCT_ICONS' ) ).toEqual( expected );
	} );

	it( 'carries the Features tab glyph for each icon name', () => {
		const glyphs = constant( 'GLYPHS' );

		for ( const [ name, svg ] of Object.entries( glyphs ) ) {
			expect( [ name, svg ] ).toEqual( [ name, renderToStaticMarkup( getFeatureIcon( name ) ) ] );
		}
		expect( Object.keys( glyphs ) ).toContain( 'list' );
	} );
} );
