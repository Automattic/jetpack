import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const pluginDir = resolve( __dirname, '..' );
const pkgDir = resolve( pluginDir, 'node_modules/social-logos' );
const outDir = resolve( pluginDir, '_inc/social-logos' );

const fontCss = readFileSync( resolve( pkgDir, 'build/font/social-logos.css' ), 'utf8' ).trim();

const css = `${ fontCss }

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

// Lightly minify
const minCss = css
	.replace( /\/\*[\s\S]*?\*\//g, '' ) // remove comments
	.replace( /^[ \t]+/gm, '' ) // remove leading whitespace
	.replace( /\n{2,}/g, '\n' ) // remove blank lines
	.trim();

writeFileSync( resolve( outDir, 'social-logos.css' ), css );
writeFileSync( resolve( outDir, 'social-logos.min.css' ), minCss );
copyFileSync(
	resolve( pkgDir, 'build/font/social-logos.woff2' ),
	resolve( outDir, 'social-logos.woff2' )
);

// eslint-disable-next-line no-console
console.log( 'Updated _inc/social-logos/ from social-logos package.' );
