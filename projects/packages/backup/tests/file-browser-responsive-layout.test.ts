// jsdom does no layout and never evaluates media or container queries, so
// the only honest automated guard is the compiled CSS itself.

import { join } from 'path';
import { compile } from 'sass-embedded';

const PACKAGE_ROOT = join( __dirname, '..' );

const css = compile( join( PACKAGE_ROOT, 'src/dashboard/components/file-browser/style.scss' ), {
	loadPaths: [ join( PACKAGE_ROOT, 'node_modules' ) ],
} ).css;

// Top-level `}` closes an at-rule; nested rules are indented.
const CONDITIONAL_BLOCK = /@(?:media|container) [^{]+\{\n[\s\S]*?\n\}/g;

// Located by the track it carries rather than by position or by the file's
// total query count, so a future print or reduced-motion rule can't fail it.
const cardColumnBlock =
	( css.match( CONDITIONAL_BLOCK ) ?? [] ).find( block => block.includes( 'minmax(0, 280px)' ) ) ??
	'';
const unconditional = css.replace( CONDITIONAL_BLOCK, '' );

it( 'carves out the file-info column only once the panel itself is wide enough', () => {
	expect( cardColumnBlock ).toContain( '@container (min-width: 640px)' );
	expect( cardColumnBlock ).toContain( 'minmax(0, 1fr) minmax(0, 280px)' );
} );

it( 'leaves the card full-width and unsticky in a narrow panel', () => {
	expect( unconditional ).toContain( 'grid-template-columns: minmax(0, 1fr);' );
	expect( unconditional ).not.toContain( '280px' );
	expect( unconditional ).not.toContain( 'position: sticky' );
} );
