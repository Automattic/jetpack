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

import { unlinkSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { basename, dirname, join, relative } from 'path';
import { glob } from 'glob';
import { iconPipelineConfig } from './webpack.config.extract-icons.js';

const { formsRoot, blocksDir, blockDirPattern, iconFilenames } = iconPipelineConfig;

// ---------------------------------------------------------------------------
// Step 1: Discover icon files
// ---------------------------------------------------------------------------

// Glob for each supported extension to find all icon component files.
const iconFiles = (
	await Promise.all( iconFilenames.map( ext => glob( join( blocksDir, blockDirPattern, ext ) ) ) )
)
	.flat()
	.sort();

// Extract unique block directory names, preserving the sort order.
const blockDirs = [ ...new Set( iconFiles.map( f => basename( dirname( f ) ) ) ) ];

if ( blockDirs.length === 0 ) {
	console.log( 'No icon components found.' );
}

console.log( `Found ${ blockDirs.length } icon components.\n` );

// ---------------------------------------------------------------------------
// Step 2: Generate the runner module
// ---------------------------------------------------------------------------

// Map each block directory to its icon import, using the first matching extension.
const iconEntries = blockDirs.map( ( dir, i ) => {
	const iconFile = iconFiles.find( f => basename( dirname( f ) ) === dir );
	return {
		dir,
		varName: `icon${ i }`,
		importPath: `../src/blocks/${ dir }/${ basename( iconFile ) }`,
	};
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

const runnerPath = join( import.meta.dirname, '.extract-icons-runner.js' );
writeFileSync( runnerPath, runnerSource );

// ---------------------------------------------------------------------------
// Steps 3–5 are wrapped in try/finally so the temporary runner file is always
// cleaned up, even if webpack or the bundle execution fails.
// ---------------------------------------------------------------------------

let icons;
let success = 0;
let failed = 0;

try {
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
	icons = bundleExport.default || bundleExport;

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
	 * - Ensure required attributes (xmlns, width, height, aria-hidden, focusable)
	 * - Convert empty element pairs to self-closing tags
	 * - Format with basic indentation
	 *
	 * @param {string} svg - Raw SVG string from ReactDOMServer.
	 * @return {string} Cleaned SVG string.
	 */
	function postProcessSvg( svg ) {
		// Unwrap nested <svg> — the WordPress Icon component can wrap the real SVG
		// in an outer <svg> shell (e.g. `<svg ...><svg ...>...</svg></svg>`).
		// Input is machine-generated by ReactDOMServer so the markup is well-formed.
		const nestedMatch = svg.match( /^<svg[^>]*>\s*(<svg[\s\S]*<\/svg>)\s*<\/svg>$/ );
		if ( nestedMatch ) {
			svg = nestedMatch[ 1 ];
		}

		// Ensure xmlns — handles both `<svg ...>` (with attributes) and bare `<svg>`.
		if ( ! svg.includes( 'xmlns=' ) ) {
			svg = svg.replace( /(<svg)([\s>])/, '$1 xmlns="http://www.w3.org/2000/svg"$2' );
		}

		// Check attributes only on the opening <svg> tag, not child elements
		const svgTagMatch = svg.match( /^<svg[^>]*>/ );
		const svgTag = svgTagMatch ? svgTagMatch[ 0 ] : '';

		// Ensure width/height — derive from viewBox dimensions instead of hardcoding.
		if ( ! svgTag.includes( 'width=' ) ) {
			const vbMatch = svgTag.match( /viewBox="([^"]*)"/ );
			if ( ! vbMatch ) {
				throw new Error( 'SVG is missing a viewBox attribute; cannot infer width/height.' );
			}
			// viewBox format: "minX minY width height"
			const vbParts = vbMatch[ 1 ].trim().split( /\s+/ );
			const w = vbParts[ 2 ];
			const h = vbParts[ 3 ];
			svg = svg.replace( /viewBox=/, `width="${ w }" height="${ h }" viewBox=` );
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
} finally {
	// Step 6: Clean up the temporary runner file.
	try {
		unlinkSync( runnerPath );
	} catch {
		// Ignore cleanup errors
	}
}

if ( failed > 0 ) {
	throw new Error( `${ failed } icon(s) failed to extract.` );
}
