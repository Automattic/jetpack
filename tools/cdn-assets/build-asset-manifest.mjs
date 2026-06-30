#!/usr/bin/env node

/* eslint-disable jsdoc/require-jsdoc */
/* global process */

/**
 * Build a CDN-oriented asset manifest from package build output.
 *
 * The source build directory remains usable for local/plugin runtime. This tool
 * records content hashes for stable static assets in a JSON manifest that CDN
 * loaders can use without requiring generated PHP files to be present remotely.
 *
 * WordPress dependency arrays are deduplicated into top-level `dependencySets`
 * and `moduleDependencySets` tables; each asset references its dependencies by
 * index into those tables. See tools/cdn-assets/README.md for the schema.
 *
 * @package
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const execFileAsync = promisify( execFile );

const MANIFEST_FILENAME = 'build_meta.json';
const SCHEMA_VERSION = 2;
const SUPPORTED_BUILDERS = new Set( [ 'webpack', 'wp-build' ] );
const STATIC_EXTENSIONS = new Set( [
	'.avif',
	'.gif',
	'.jpg',
	'.jpeg',
	'.json',
	'.png',
	'.svg',
	'.ttf',
	'.wasm',
	'.webp',
	'.woff',
	'.woff2',
] );
const ENTRY_EXTENSIONS = new Set( [ '.css', '.js', '.mjs' ] );
const HASH_LENGTH = 12;

async function exists( filePath ) {
	try {
		await access( filePath, fsConstants.F_OK );
		return true;
	} catch {
		return false;
	}
}

async function readRequiredJsonFile( filePath ) {
	try {
		return JSON.parse( await readFile( filePath, 'utf8' ) );
	} catch ( error ) {
		throw new Error( `Could not read JSON from ${ filePath }: ${ error.message }`, {
			cause: error,
		} );
	}
}

async function readPhpReturnValue( filePath, fallback = null ) {
	if ( ! ( await exists( filePath ) ) ) {
		return fallback;
	}

	const php = [
		'$file = $argv[1];',
		'$value = require $file;',
		'echo json_encode( $value, JSON_UNESCAPED_SLASHES );',
	].join( ' ' );
	const { stdout } = await execFileAsync( 'php', [ '-r', php, filePath ], {
		maxBuffer: 1024 * 1024 * 10,
	} );

	if ( ! stdout ) {
		return fallback;
	}

	return JSON.parse( stdout );
}

function normalizeRelativePath( relativePath ) {
	return relativePath.split( path.sep ).join( '/' );
}

function sortObjectByKey( object ) {
	return Object.fromEntries(
		Object.entries( object ).sort( ( [ keyA ], [ keyB ] ) => keyA.localeCompare( keyB ) )
	);
}

function normalizeList( value ) {
	return Array.isArray( value ) ? value : [];
}

function makeHash( contents ) {
	return createHash( 'sha256' ).update( contents ).digest( 'hex' ).slice( 0, HASH_LENGTH );
}

function hasGeneratedHash( relativePath ) {
	return /\.[a-f0-9]{12}\.(?:css|js|mjs)$/.test( relativePath );
}

function isManifestFile( relativePath ) {
	return relativePath === MANIFEST_FILENAME;
}

function trimExtension( relativePath ) {
	const extension = path.extname( relativePath );
	return extension ? relativePath.slice( 0, -extension.length ) : relativePath;
}

function normalizeBuilder( builder ) {
	return SUPPORTED_BUILDERS.has( builder ) ? builder : null;
}

function stripAssetPhpExtension( relativePath ) {
	return relativePath.replace( /\.asset\.php$/, '' );
}

function toAssetPhpPath( logicalPath ) {
	return `${ trimExtension( logicalPath ) }.asset.php`;
}

async function listBuildFiles( buildDir ) {
	if ( ! ( await exists( buildDir ) ) ) {
		return [];
	}

	const entries = await readdir( buildDir, { recursive: true, withFileTypes: true } );
	return entries
		.filter( entry => entry.isFile() )
		.map( entry =>
			normalizeRelativePath( path.relative( buildDir, path.join( entry.parentPath, entry.name ) ) )
		)
		.sort();
}

async function hashFile( context, relativePath ) {
	const normalizedPath = normalizeRelativePath( relativePath );
	if ( context.hashCache.has( normalizedPath ) ) {
		return context.hashCache.get( normalizedPath );
	}

	const filePath = path.join( context.buildDir, normalizedPath );
	if ( ! ( await exists( filePath ) ) ) {
		throw new Error( `Expected CDN asset source file at ${ filePath }.` );
	}

	const hash = makeHash( await readFile( filePath ) );
	context.hashCache.set( normalizedPath, hash );
	return hash;
}

function addPublishFile( context, logicalPath ) {
	context.publishFiles.add( normalizeRelativePath( logicalPath ) );
}

async function addManifestAsset( context, logicalPath, details ) {
	const normalizedPath = normalizeRelativePath( logicalPath );
	const extension = path.extname( normalizedPath );
	if ( ! ENTRY_EXTENSIONS.has( extension ) ) {
		throw new Error(
			`Only JS/CSS entry assets can be versioned by this tool: ${ normalizedPath }.`
		);
	}

	const version = await hashFile( context, normalizedPath );
	context.manifest.assets[ normalizedPath ] = {
		file: normalizedPath,
		type: details.type,
		...( details.id ? { id: details.id } : {} ),
		...( details.handle ? { handle: details.handle } : {} ),
		...( 'dependencies' in details ? { dependencies: normalizeList( details.dependencies ) } : {} ),
		...( 'moduleDependencies' in details
			? { moduleDependencies: normalizeList( details.moduleDependencies ) }
			: {} ),
		version,
		...( details.meta ? { meta: details.meta } : {} ),
	};
	addPublishFile( context, normalizedPath );
	return context.manifest.assets[ normalizedPath ];
}

async function addAssetWithPhpMetadata( context, logicalPath, assetPath, details ) {
	const normalizedAssetPath = assetPath ? normalizeRelativePath( assetPath ) : null;
	const asset = normalizedAssetPath
		? await readPhpReturnValue( path.join( context.buildDir, normalizedAssetPath ), {} )
		: {};

	return addManifestAsset( context, logicalPath, {
		...details,
		dependencies: normalizeList( asset.dependencies ),
		moduleDependencies: normalizeList( asset.module_dependencies ),
		meta: {
			...( details.meta || {} ),
			...( normalizedAssetPath ? { asset: normalizedAssetPath } : {} ),
		},
	} );
}

async function addOptionalStyleVariant( context, entry, logicalPath, propertyName ) {
	const normalizedPath = normalizeRelativePath( logicalPath );
	if ( ! ( await exists( path.join( context.buildDir, normalizedPath ) ) ) ) {
		return;
	}

	entry[ propertyName ] = normalizedPath;
	entry[ `${ propertyName }Version` ] = await hashFile( context, normalizedPath );
	addPublishFile( context, normalizedPath );
}

async function collectStaticPublishFiles( context ) {
	for ( const relativePath of context.buildFiles ) {
		const extension = path.extname( relativePath );
		if ( isManifestFile( relativePath ) || hasGeneratedHash( relativePath ) ) {
			continue;
		}
		if ( STATIC_EXTENSIONS.has( extension ) ) {
			addPublishFile( context, relativePath );
		}
	}
}

function entryPathFromAssetPath( section, assetPath ) {
	return normalizeRelativePath(
		path.join( section, `${ stripAssetPhpExtension( assetPath ) }.js` )
	);
}

async function addWpBuildAssets( context ) {
	const { buildDir, manifest, packageJson } = context;
	const wpPlugin = packageJson.wpPlugin || {};
	const handlePrefix = wpPlugin.handlePrefix || wpPlugin.packageNamespace || context.namespace;

	manifest.wpBuild = {
		boot: null,
		pages: [],
		modules: [],
		routes: [],
		widgets: [],
		scripts: [],
		styles: [],
	};

	const bootAsset = await readPhpReturnValue(
		path.join( buildDir, 'modules/boot/index.min.asset.php' ),
		null
	);
	if ( bootAsset ) {
		manifest.wpBuild.boot = {
			dependencies: normalizeList( bootAsset.dependencies ),
			moduleDependencies: normalizeList( bootAsset.module_dependencies ),
			version: bootAsset.version ?? null,
			asset: 'modules/boot/index.min.asset.php',
		};
	}

	for ( const page of normalizeList( wpPlugin.pages ) ) {
		const pageId = page.id;
		const logicalPath = `pages/${ pageId }/loader.js`;
		if ( await exists( path.join( buildDir, logicalPath ) ) ) {
			const entry = await addManifestAsset( context, logicalPath, {
				type: 'page-loader',
				id: pageId,
				moduleDependencies: [
					{ import: 'static', id: '@wordpress/boot' },
					...normalizeList( page.init ).map( id => ( { import: 'static', id } ) ),
				],
				meta: {
					wpAdminId: `${ pageId }-wp-admin`,
					initModules: normalizeList( page.init ),
				},
			} );
			manifest.wpBuild.pages.push( {
				id: pageId,
				wpAdminId: `${ pageId }-wp-admin`,
				initModules: normalizeList( page.init ),
				loader: logicalPath,
				file: entry.file,
			} );
		}
	}

	const modules = await readPhpReturnValue( path.join( buildDir, 'modules/registry.php' ), [] );
	for ( const module of modules ) {
		const assetPath = module.asset || `${ module.path }.min.asset.php`;
		const logicalPath = entryPathFromAssetPath( 'modules', assetPath );
		const entry = await addAssetWithPhpMetadata( context, logicalPath, `modules/${ assetPath }`, {
			type: 'script-module',
			id: module.id,
			meta: { minOnly: Boolean( module.min_only ) },
		} );
		manifest.wpBuild.modules.push( { ...module, file: entry.file } );
	}

	const routes = await readPhpReturnValue( path.join( buildDir, 'routes/registry.php' ), [] );
	for ( const route of routes ) {
		const routeManifest = { ...route };
		if ( route.has_route ) {
			const assetPath = `${ route.name }/route.min.asset.php`;
			const logicalPath = entryPathFromAssetPath( 'routes', assetPath );
			const entry = await addAssetWithPhpMetadata( context, logicalPath, `routes/${ assetPath }`, {
				type: 'route-module',
				id: `${ handlePrefix }/routes/${ route.name }/route`,
				meta: { route: route.name, page: route.page, path: route.path },
			} );
			routeManifest.route_module = `${ handlePrefix }/routes/${ route.name }/route`;
			routeManifest.route_file = entry.file;
		}
		if ( route.has_content ) {
			const assetPath = `${ route.name }/content.min.asset.php`;
			const logicalPath = entryPathFromAssetPath( 'routes', assetPath );
			const entry = await addAssetWithPhpMetadata( context, logicalPath, `routes/${ assetPath }`, {
				type: 'route-content',
				id: `${ handlePrefix }/routes/${ route.name }/content`,
				meta: { route: route.name, page: route.page, path: route.path },
			} );
			routeManifest.content_module = `${ handlePrefix }/routes/${ route.name }/content`;
			routeManifest.content_file = entry.file;
		}
		manifest.wpBuild.routes.push( routeManifest );
	}

	const widgets = await readPhpReturnValue( path.join( buildDir, 'widgets/registry.php' ), [] );
	for ( const widget of widgets ) {
		const widgetManifest = { ...widget };
		if ( widget.has_render ) {
			const assetPath = `${ widget.dir_name }/render.min.asset.php`;
			const logicalPath = entryPathFromAssetPath( 'widgets', assetPath );
			const entry = await addAssetWithPhpMetadata( context, logicalPath, `widgets/${ assetPath }`, {
				type: 'widget-render',
				id: `${ handlePrefix }/widgets/${ widget.dir_name }/render`,
				meta: {
					widget: widget.name,
					dirName: widget.dir_name,
					presentation: widget.presentation ?? null,
				},
			} );
			widgetManifest.render_module = `${ handlePrefix }/widgets/${ widget.dir_name }/render`;
			widgetManifest.render_file = entry.file;
		}
		if ( widget.has_widget ) {
			const assetPath = `${ widget.dir_name }/widget.min.asset.php`;
			const logicalPath = entryPathFromAssetPath( 'widgets', assetPath );
			const entry = await addAssetWithPhpMetadata( context, logicalPath, `widgets/${ assetPath }`, {
				type: 'widget-metadata',
				id: `${ handlePrefix }/widgets/${ widget.dir_name }/widget`,
				meta: {
					widget: widget.name,
					dirName: widget.dir_name,
					presentation: widget.presentation ?? null,
				},
			} );
			widgetManifest.widget_module = `${ handlePrefix }/widgets/${ widget.dir_name }/widget`;
			widgetManifest.widget_file = entry.file;
		}
		manifest.wpBuild.widgets.push( widgetManifest );
	}

	const scripts = await readPhpReturnValue( path.join( buildDir, 'scripts/registry.php' ), [] );
	for ( const script of scripts ) {
		const assetPath = script.asset || `${ script.path }.min.asset.php`;
		const logicalPath = entryPathFromAssetPath( 'scripts', assetPath );
		const entry = await addAssetWithPhpMetadata( context, logicalPath, `scripts/${ assetPath }`, {
			type: 'script',
			handle: script.handle,
		} );
		manifest.wpBuild.scripts.push( { ...script, file: entry.file } );
	}

	const styles = await readPhpReturnValue( path.join( buildDir, 'styles/registry.php' ), [] );
	for ( const style of styles ) {
		const logicalPath = style.file || `styles/${ style.path }.min.css`;
		const entry = await addManifestAsset( context, logicalPath, {
			type: 'style',
			handle: style.handle,
			dependencies: normalizeList( style.dependencies ),
		} );
		await addOptionalStyleVariant(
			context,
			entry,
			style.rtlFile || `styles/${ style.path }-rtl.min.css`,
			'rtlFile'
		);
		manifest.wpBuild.styles.push( {
			...style,
			file: entry.file,
			rtlFile: entry.rtlFile,
			rtlFileVersion: entry.rtlFileVersion,
		} );
	}
}

async function findExistingCandidate( buildDir, candidates ) {
	for ( const candidate of candidates.map( normalizeRelativePath ) ) {
		if ( await exists( path.join( buildDir, candidate ) ) ) {
			return candidate;
		}
	}
	return null;
}

async function findScriptForAssetFile( buildDir, assetPath ) {
	const basePath = stripAssetPhpExtension( assetPath );
	const unminifiedBasePath = basePath.replace( /\.min$/, '' );
	return findExistingCandidate( buildDir, [
		`${ basePath }.js`,
		`${ basePath }.mjs`,
		`${ unminifiedBasePath }.js`,
		`${ unminifiedBasePath }.mjs`,
		`${ basePath }.min.js`,
		`${ basePath }.min.mjs`,
	] );
}

async function findStylesForScriptFile( buildDir, logicalPath ) {
	const dirname = path.posix.dirname( logicalPath );
	const basename = path.posix.basename( trimExtension( logicalPath ) );
	const basePath = trimExtension( logicalPath );
	const unminifiedBasePath = basePath.replace( /\.min$/, '' );
	const candidates = [
		`${ basePath }.css`,
		`${ unminifiedBasePath }.css`,
		`${ basePath }.min.css`,
		normalizeRelativePath( path.posix.join( dirname, `style-${ basename }.css` ) ),
		normalizeRelativePath(
			path.posix.join( dirname, `style-${ basename.replace( /\.min$/, '' ) }.css` )
		),
	];
	const styles = [];

	for ( const candidate of [ ...new Set( candidates ) ] ) {
		if ( await exists( path.join( buildDir, candidate ) ) ) {
			styles.push( candidate );
		}
	}

	return styles;
}

function isRtlStyleFile( logicalPath ) {
	return /\.rtl\.css$/.test( logicalPath ) || /-rtl\.css$/.test( logicalPath );
}

function getRtlStyleCandidates( logicalPath ) {
	const basePath = trimExtension( logicalPath );
	const unminifiedBasePath = basePath.replace( /\.min$/, '' );
	return [
		`${ basePath }.rtl.css`,
		`${ unminifiedBasePath }.rtl.css`,
		`${ basePath }-rtl.css`,
		`${ unminifiedBasePath }-rtl.css`,
	];
}

function defaultWebpackModuleId( context, logicalPath ) {
	const scriptCount = context.manifest.webpack.scripts.length;
	if ( scriptCount === 0 ) {
		return context.packageJson.name;
	}
	return `${ context.packageJson.name }/${ trimExtension( logicalPath ) }`;
}

function defaultWebpackStyleHandle( context, logicalPath ) {
	const baseName = path.posix.basename( trimExtension( logicalPath ) ).replace( /\.min$/, '' );
	return [ context.namespace, baseName ].filter( Boolean ).join( '-' );
}

async function addWebpackScript( context, logicalPath, details = {} ) {
	const assetPath =
		details.asset ||
		( await findExistingCandidate( context.buildDir, [ toAssetPhpPath( logicalPath ) ] ) );
	const asset = assetPath
		? await readPhpReturnValue( path.join( context.buildDir, assetPath ), {} )
		: {};
	const moduleDependencies = normalizeList(
		details.moduleDependencies || asset.module_dependencies
	);
	const type = details.type || ( moduleDependencies.length ? 'script-module' : 'script' );
	const entry = await addManifestAsset( context, logicalPath, {
		type,
		id:
			details.id ||
			( type === 'script-module' ? defaultWebpackModuleId( context, logicalPath ) : undefined ),
		handle: details.handle,
		dependencies: normalizeList( details.dependencies || asset.dependencies ),
		moduleDependencies,
		meta: {
			...( details.meta || {} ),
			...( assetPath ? { asset: normalizeRelativePath( assetPath ) } : {} ),
		},
	} );

	context.manifest.webpack.scripts.push( {
		file: entry.file,
		type: entry.type,
		...( entry.id ? { id: entry.id } : {} ),
		...( entry.handle ? { handle: entry.handle } : {} ),
		...( assetPath ? { asset: normalizeRelativePath( assetPath ) } : {} ),
	} );
	return entry;
}

async function addWebpackStyle( context, logicalPath, details = {} ) {
	const entry = await addManifestAsset( context, logicalPath, {
		type: 'style',
		handle: details.handle || defaultWebpackStyleHandle( context, logicalPath ),
		dependencies: normalizeList( details.dependencies ),
		meta: details.meta,
	} );
	for ( const rtlFile of details.rtlFile
		? [ details.rtlFile ]
		: getRtlStyleCandidates( logicalPath ) ) {
		await addOptionalStyleVariant( context, entry, normalizeRelativePath( rtlFile ), 'rtlFile' );
		if ( entry.rtlFile ) {
			break;
		}
	}

	context.manifest.webpack.styles.push( {
		file: entry.file,
		handle: entry.handle,
		...( entry.rtlFile ? { rtlFile: entry.rtlFile, rtlFileVersion: entry.rtlFileVersion } : {} ),
	} );
	return entry;
}

function shouldDiscoverWebpackEntry( relativePath, seenEntries ) {
	return (
		ENTRY_EXTENSIONS.has( path.extname( relativePath ) ) &&
		! relativePath.endsWith( '.asset.php' ) &&
		! isManifestFile( relativePath ) &&
		! isRtlStyleFile( relativePath ) &&
		! hasGeneratedHash( relativePath ) &&
		! seenEntries.has( relativePath )
	);
}

async function addWebpackAssets( context ) {
	context.manifest.webpack = {
		scripts: [],
		styles: [],
	};

	const files = context.buildFiles;
	const seenEntries = new Set();
	const seenStyles = new Set();

	for ( const assetPath of files.filter( file => file.endsWith( '.asset.php' ) ) ) {
		const scriptPath = await findScriptForAssetFile( context.buildDir, assetPath );
		if ( ! scriptPath ) {
			continue;
		}

		await addWebpackScript( context, scriptPath, { asset: assetPath } );
		seenEntries.add( scriptPath );

		for ( const stylePath of await findStylesForScriptFile( context.buildDir, scriptPath ) ) {
			await addWebpackStyle( context, stylePath );
			seenEntries.add( stylePath );
			seenStyles.add( stylePath );
		}
	}

	for ( const file of files ) {
		if ( ! shouldDiscoverWebpackEntry( file, seenEntries ) ) {
			continue;
		}

		if ( path.extname( file ) === '.css' ) {
			await addWebpackStyle( context, file );
			seenStyles.add( file );
			seenEntries.add( file );
			continue;
		}

		await addWebpackScript( context, file );
		seenEntries.add( file );
		for ( const stylePath of await findStylesForScriptFile( context.buildDir, file ) ) {
			if ( ! seenStyles.has( stylePath ) ) {
				await addWebpackStyle( context, stylePath );
				seenStyles.add( stylePath );
				seenEntries.add( stylePath );
			}
		}
	}
}

async function resolveBuildContext( options ) {
	const packageDir = path.resolve( options.packageDir || '.' );
	const packageJson = await readRequiredJsonFile( path.join( packageDir, 'package.json' ) );
	const buildDir = path.resolve( packageDir, options.buildDir || 'build' );

	if ( ! ( await exists( buildDir ) ) || ! ( await stat( buildDir ) ).isDirectory() ) {
		throw new Error( `Build directory does not exist at ${ buildDir }.` );
	}

	const builder = normalizeBuilder( options.builder || options.mode );
	if ( ! builder ) {
		throw new Error(
			`A supported --mode is required, one of: ${ [ ...SUPPORTED_BUILDERS ].join( ', ' ) }.`
		);
	}

	const namespace = options.namespace;
	if ( ! namespace ) {
		throw new Error( 'A --namespace is required to build the CDN manifest.' );
	}

	return {
		builder,
		buildDir,
		namespace,
		packageDir,
		packageJson,
		version: options.version || 'v1',
	};
}

function canonicalizeDependencies( dependencies ) {
	return [ ...dependencies ].map( String ).sort( ( a, b ) => a.localeCompare( b ) );
}

function canonicalizeModuleDependency( dependency ) {
	if ( ! dependency || typeof dependency !== 'object' ) {
		return dependency;
	}
	// Rebuild with a deterministic key order so equivalent dependencies intern to
	// the same table entry regardless of how the source serialized them.
	const canonical = {};
	for ( const key of Object.keys( dependency ).sort() ) {
		canonical[ key ] = dependency[ key ];
	}
	return canonical;
}

function moduleDependencySortKey( dependency ) {
	if ( dependency && typeof dependency === 'object' ) {
		return `${ dependency.id ?? '' } ${ dependency.import ?? '' }`;
	}
	return String( dependency );
}

function canonicalizeModuleDependencies( dependencies ) {
	return [ ...dependencies ]
		.map( canonicalizeModuleDependency )
		.sort( ( a, b ) => moduleDependencySortKey( a ).localeCompare( moduleDependencySortKey( b ) ) );
}

// Intern each asset's dependency arrays into shared tables, replacing the inline
// arrays with an integer index. Identical (canonicalized) arrays collapse to a
// single table entry; empty arrays share one entry as well.
function internDependencyTables( assets ) {
	const dependencySets = [];
	const dependencyIndex = new Map();
	const moduleDependencySets = [];
	const moduleDependencyIndex = new Map();

	const intern = ( table, index, value ) => {
		const key = JSON.stringify( value );
		if ( index.has( key ) ) {
			return index.get( key );
		}
		const position = table.length;
		table.push( value );
		index.set( key, position );
		return position;
	};

	for ( const asset of Object.values( assets ) ) {
		if ( 'dependencies' in asset ) {
			asset.dependencies = intern(
				dependencySets,
				dependencyIndex,
				canonicalizeDependencies( asset.dependencies )
			);
		}
		if ( 'moduleDependencies' in asset ) {
			asset.moduleDependencies = intern(
				moduleDependencySets,
				moduleDependencyIndex,
				canonicalizeModuleDependencies( asset.moduleDependencies )
			);
		}
	}

	return { dependencySets, moduleDependencySets };
}

async function getPublishFileHashes( context, publishFiles ) {
	const hashes = {};
	for ( const relativePath of publishFiles ) {
		if ( isManifestFile( relativePath ) ) {
			continue;
		}
		if ( await exists( path.join( context.buildDir, relativePath ) ) ) {
			hashes[ relativePath ] = await hashFile( context, relativePath );
		}
	}
	return sortObjectByKey( hashes );
}

async function addCacheBuster( context, manifest ) {
	const publishFileHashes = await getPublishFileHashes( context, manifest.publishFiles );
	manifest.cache_buster = makeHash(
		JSON.stringify( {
			assets: manifest.assets,
			builder: manifest.builder,
			dependencySets: manifest.dependencySets,
			moduleDependencySets: manifest.moduleDependencySets,
			namespace: manifest.namespace,
			packageName: manifest.packageName,
			packageVersion: manifest.packageVersion,
			publishFileHashes,
			version: manifest.version,
		} )
	);
}

async function buildManifest( options = {} ) {
	const resolved = await resolveBuildContext( options );
	const { buildDir, packageJson } = resolved;

	const context = {
		...resolved,
		buildFiles: await listBuildFiles( buildDir ),
		hashCache: new Map(),
		publishFiles: new Set(),
		manifest: {
			schemaVersion: SCHEMA_VERSION,
			namespace: resolved.namespace,
			version: resolved.version,
			packageName: packageJson.name,
			packageVersion: packageJson.version,
			builder: resolved.builder,
			assets: {},
		},
	};

	if ( resolved.builder === 'wp-build' ) {
		await addWpBuildAssets( context );
	} else {
		await addWebpackAssets( context );
	}

	await collectStaticPublishFiles( context );
	addPublishFile( context, MANIFEST_FILENAME );

	const assets = sortObjectByKey( context.manifest.assets );
	const { dependencySets, moduleDependencySets } = internDependencyTables( assets );

	const manifest = {
		...context.manifest,
		dependencySets,
		moduleDependencySets,
		assets,
		publishFiles: [ ...context.publishFiles ].sort(),
	};
	await addCacheBuster( context, manifest );

	const manifestPath = path.join( buildDir, MANIFEST_FILENAME );
	await writeFile( manifestPath, `${ JSON.stringify( manifest, null, '\t' ) }\n` );
	return manifest;
}

function parseCliArgs( argv ) {
	const { values } = parseArgs( {
		args: argv,
		options: {
			'build-dir': { type: 'string' },
			mode: { type: 'string' },
			namespace: { type: 'string' },
			'package-dir': { type: 'string' },
			version: { type: 'string' },
		},
		strict: true,
		allowPositionals: false,
	} );

	return {
		buildDir: values[ 'build-dir' ] ?? null,
		mode: values.mode ?? null,
		namespace: values.namespace ?? null,
		packageDir: values[ 'package-dir' ] ?? '.',
		version: values.version ?? null,
	};
}

async function main() {
	const manifest = await buildManifest( parseCliArgs( process.argv.slice( 2 ) ) );
	const assetCount = Object.keys( manifest.assets ).length;
	process.stdout.write(
		`[cdn-assets] wrote build/${ MANIFEST_FILENAME } with ${ assetCount } versioned asset(s).\n`
	);
}

const isCli =
	process.argv[ 1 ] && fileURLToPath( import.meta.url ) === path.resolve( process.argv[ 1 ] );

if ( isCli ) {
	main().catch( error => {
		process.stderr.write( `${ error.message }\n` );
		process.exitCode = 1;
	} );
}

export { buildManifest };
