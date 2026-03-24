import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const pluginDir = resolve( __dirname, '..' );
const pkgDir = resolve( pluginDir, 'node_modules/social-logos' );
const outDir = resolve( pluginDir, '_inc/build/social-logos' );

mkdirSync( outDir, { recursive: true } );

let css = readFileSync( resolve( pkgDir, 'build/font/social-logos.css' ), 'utf8' );

css += `
.social-logo {
	font-family: social-logos;
	display: inline-block;
	vertical-align: middle;
	line-height: 1;
	font-weight: 400;
	font-style: normal;
	speak: none;
	text-decoration: inherit;
	text-transform: none;
	text-rendering: auto;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
`;

// Lightly minify - don't remove all whitespace in case some CSS is introduced that uses it.
const minCss = css
	.replace( /\/\*[\s\S]*?\*\//g, '' ) // remove comments
	.replace( /\n[ \t]*/g, '' ) // remove newlines and any subsequent indentation
	.trim();

writeFileSync( resolve( outDir, 'social-logos.css' ), css );
writeFileSync( resolve( outDir, 'social-logos.min.css' ), minCss );

// eslint-disable-next-line no-console
console.log( 'Updated _inc/build/social-logos/ from social-logos package.' );
