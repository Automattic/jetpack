#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Extract SVG icons from React icon components.
 *
 * Discovers all icon.{jsx,tsx} files in src/blocks/field-* directories,
 * renders the React components to static SVG markup, and writes standalone
 * icon.svg files alongside each component.
 *
 * Usage: node tools/extract-icons.mjs
 */

import { existsSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const formsRoot = join( __dirname, '..' );
const blocksDir = join( formsRoot, 'src', 'blocks' );

// ---------------------------------------------------------------------------
// Step 1: Discover icon files
// ---------------------------------------------------------------------------

const ICON_EXTENSIONS = [ 'icon.jsx', 'icon.tsx', 'icon.js' ];

const blockDirs = readdirSync( blocksDir )
	.filter( name => {
		if ( ! name.startsWith( 'field-' ) ) {
			return false;
		}
		const fullPath = join( blocksDir, name );
		if ( ! statSync( fullPath ).isDirectory() ) {
			return false;
		}
		return ICON_EXTENSIONS.some( f => existsSync( join( fullPath, f ) ) );
	} )
	.sort();

if ( blockDirs.length === 0 ) {
	console.log( 'No icon components found.' );
}

console.log( `Found ${ blockDirs.length } icon components.\n` );

// ---------------------------------------------------------------------------
// Step 2: Generate the runner module
// ---------------------------------------------------------------------------

const iconEntries = blockDirs.map( ( dir, i ) => {
	const ext = ICON_EXTENSIONS.find( f => existsSync( join( blocksDir, dir, f ) ) );
	return { dir, varName: `icon${ i }`, importPath: `../src/blocks/${ dir }/${ ext }` };
} );

const imports = iconEntries
	.map( e => `import ${ e.varName } from '${ e.importPath }';` )
	.join( '\n' );

const entries = iconEntries.map( e => `\t[ '${ e.dir }', ${ e.varName } ]` ).join( ',\n' );

const runnerSource = `
import * as React from '@wordpress/element';
import ReactDOMServer from 'react-dom/server';
${ imports }

const ICONS = [
${ entries }
];

/**
 * Resolve a React element from the various icon export patterns:
 *
 * - Pattern A: { src: <SVG>...</SVG> }           (inline @wordpress/primitives)
 * - Pattern B: { src: <Icon icon={wpIcon} /> }   (wraps @wordpress/icons via Icon)
 * - Pattern C: { src: wpIconObject }              (direct @wordpress/icons reference)
 * - Pattern D: <SVG>...</SVG>  (direct element default export)
 */
function resolveElement( iconModule ) {
	const def = iconModule?.default ?? iconModule;
	if ( ! def ) {
		return null;
	}

	if ( def.src !== undefined ) {
		const src = def.src;

		// Pattern B: <Icon icon={wpIcon} /> — extract the inner icon element
		if ( React.isValidElement( src ) && src.props?.icon ) {
			const iconProp = src.props.icon;
			// @wordpress/icons objects: { src: <SVG>...</SVG> }
			if ( iconProp.src && React.isValidElement( iconProp.src ) ) {
				return iconProp.src;
			}
			if ( React.isValidElement( iconProp ) ) {
				return iconProp;
			}
		}

		// Pattern A: direct React element
		if ( React.isValidElement( src ) ) {
			return src;
		}

		// Pattern C: @wordpress/icons object
		if ( src.src && React.isValidElement( src.src ) ) {
			return src.src;
		}

		if ( typeof src === 'function' ) {
			return React.createElement( src );
		}
	}

	// Pattern D: direct element export
	if ( React.isValidElement( def ) ) {
		return def;
	}

	if ( typeof def === 'function' ) {
		return React.createElement( def );
	}

	return null;
}

const result = {};
for ( const [ blockDir, iconModule ] of ICONS ) {
	try {
		const element = resolveElement( iconModule );
		if ( element ) {
			result[ blockDir ] = ReactDOMServer.renderToStaticMarkup( element );
		} else {
			console.error( 'extract-icons: ' + blockDir + ': could not resolve element' );
		}
	} catch ( err ) {
		console.error( 'extract-icons: ' + blockDir + ': ' + err.message );
	}
}

export default result;
`;

const runnerPath = join( __dirname, '.extract-icons-runner.js' );
writeFileSync( runnerPath, runnerSource );

// ---------------------------------------------------------------------------
// Step 3: Bundle with webpack
// ---------------------------------------------------------------------------

console.log( 'Bundling icon modules with webpack...' );

const webpack = ( await import( 'webpack' ) ).default;
const config = ( await import( './webpack.config.extract-icons.js' ) ).default;

await new Promise( ( resolve, reject ) => {
	webpack( config, ( err, stats ) => {
		if ( err ) {
			return reject( err );
		}
		if ( stats.hasErrors() ) {
			const errors = stats.compilation.errors.map( e => e.message ).join( '\n' );
			return reject( new Error( `Webpack build failed:\n${ errors }` ) );
		}
		resolve( stats );
	} );
} );

console.log( 'Webpack build complete.\n' );

// ---------------------------------------------------------------------------
// Step 4: Execute the bundle
// ---------------------------------------------------------------------------

const require_ = createRequire( import.meta.url );
const bundlePath = join( formsRoot, 'dist', 'extract-icons-bundle.cjs' );
const bundleExport = require_( bundlePath );
const icons = bundleExport.default || bundleExport;

// ---------------------------------------------------------------------------
// Step 5: Post-process SVGs and write files
// ---------------------------------------------------------------------------

/**
 * Self-closing SVG element tags (no children).
 */
const SELF_CLOSING_TAGS = [ 'path', 'circle', 'line', 'rect', 'ellipse', 'polygon', 'polyline' ];

/**
 * Post-process a rendered SVG string:
 * - Unwrap nested <svg> elements (safety net for Icon wrapper leaking through)
 * - Replace currentColor with #000 for standalone rendering
 * - Ensure required attributes (xmlns, width, height, aria-hidden, focusable)
 * - Convert empty element pairs to self-closing tags
 * - Format with basic indentation
 *
 * @param {string} svg - Raw SVG string from ReactDOMServer.
 * @return {string} Cleaned SVG string.
 */
function postProcessSvg( svg ) {
	// Unwrap nested <svg> — take the inner one
	const nestedMatch = svg.match( /^<svg[^>]*>\s*(<svg[\s\S]*<\/svg>)\s*<\/svg>$/ );
	if ( nestedMatch ) {
		svg = nestedMatch[ 1 ];
	}

	// Replace currentColor with black (won't render in standalone SVG/email)
	svg = svg.replace( /currentColor/g, '#000' );

	// Ensure xmlns
	if ( ! svg.includes( 'xmlns=' ) ) {
		svg = svg.replace( '<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ' );
	}

	// Check attributes only on the opening <svg> tag, not child elements
	const svgTagMatch = svg.match( /^<svg[^>]*>/ );
	const svgTag = svgTagMatch ? svgTagMatch[ 0 ] : '';

	// Ensure width/height (insert before viewBox to match conventional attribute order)
	if ( ! svgTag.includes( 'width=' ) ) {
		if ( ! svgTag.includes( 'viewBox=' ) ) {
			throw new Error( 'SVG is missing a viewBox attribute; cannot infer width/height.' );
		}
		svg = svg.replace( /viewBox=/, 'width="24" height="24" viewBox=' );
	}

	// Ensure aria-hidden and focusable for accessibility
	if ( ! svgTag.includes( 'aria-hidden=' ) ) {
		svg = svg.replace( /(<svg\s)/, '$1aria-hidden="true" focusable="false" ' );
	} else if ( ! svgTag.includes( 'focusable=' ) ) {
		svg = svg.replace( /(aria-hidden="[^"]*")/, '$1 focusable="false"' );
	}

	// Convert empty element pairs to self-closing: <path ...></path> → <path ... />
	for ( const tag of SELF_CLOSING_TAGS ) {
		const re = new RegExp( `<${ tag }([^>]*?)></${ tag }>`, 'g' );
		svg = svg.replace( re, `<${ tag }$1 />` );
	}

	// Basic formatting: newline + tab for child elements inside <svg>
	svg = svg.replace( /><(?!\/svg)/g, '>\n\t<' );

	// Closing </svg> on its own line
	svg = svg.replace( /(<\/svg>)$/, '\n$1' );

	return svg + '\n';
}

console.log( 'Writing SVG files:\n' );

let success = 0;
let failed = 0;

for ( const [ blockDir, svgString ] of Object.entries( icons ) ) {
	const outputFile = join( blocksDir, blockDir, 'icon.svg' );
	const relativePath = relative( formsRoot, outputFile );

	try {
		const processed = postProcessSvg( svgString );
		writeFileSync( outputFile, processed );
		console.log( `  ✓ ${ relativePath }` );
		success++;
	} catch ( err ) {
		console.error( `  ✗ ${ relativePath }: ${ err.message }` );
		failed++;
	}
}

console.log( `\nDone: ${ success } extracted, ${ failed } failed.` );

// ---------------------------------------------------------------------------
// Step 6: Clean up
// ---------------------------------------------------------------------------

try {
	unlinkSync( runnerPath );
} catch {
	// Ignore cleanup errors
}

if ( failed > 0 ) {
	throw new Error( `${ failed } icon(s) failed to extract.` );
}
