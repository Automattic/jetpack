// jsdom does no layout and never evaluates media queries, so the only
// honest automated guard is the compiled CSS itself.

import { join } from 'path';
import { compile } from 'sass-embedded';

const PACKAGE_ROOT = join( __dirname, '..' );

const css = compile( join( PACKAGE_ROOT, 'src/dashboard/components/file-browser/style.scss' ), {
	loadPaths: [ join( PACKAGE_ROOT, 'node_modules' ) ],
} ).css;

// Top-level `}` closes an at-rule; nested rules are indented.
const mediaBlocks = css.match( /@media [^{]+\{\n[\s\S]*?\n\}/g ) ?? [];
const outsideMediaQueries = css.replace( /@media [^{]+\{\n[\s\S]*?\n\}/g, '' );

it( 'carves out the file-info column only above wp-admin’s 782px breakpoint', () => {
	expect( mediaBlocks ).toHaveLength( 1 );
	expect( mediaBlocks[ 0 ] ).toContain( '@media (min-width: 783px)' );
	expect( mediaBlocks[ 0 ] ).toContain( 'minmax(0, 1fr) minmax(0, 280px)' );
} );

it( 'leaves the card full-width and unsticky at narrow widths', () => {
	expect( outsideMediaQueries ).toContain( 'grid-template-columns: minmax(0, 1fr);' );
	expect( outsideMediaQueries ).not.toContain( '280px' );
	expect( outsideMediaQueries ).not.toContain( 'position: sticky' );
} );
