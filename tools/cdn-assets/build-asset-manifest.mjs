#!/usr/bin/env node

/**
 * Build a CDN-oriented asset manifest from package build output.
 *
 * The source build directory remains usable for local/plugin runtime. This tool
 * adds content-hashed static copies and a JSON manifest that CDN loaders can use
 * without requiring generated PHP files to be present remotely.
 *
 * @package automattic/jetpack
 */

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import {
	access,
	copyFile,
	mkdir,
	readFile,
	readdir,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify( execFile );

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
const HASHED_ENTRY_EXTENSIONS = new Set( [ '.css', '.js', '.mjs' ] );
const HASH_LENGTH = 12;

async function exists( filePath ) {
	try {
		await access( filePath, fsConstants.F_OK );
		return true;
	} catch {
		return false;
	}
}

async function readJsonFile( filePath, fallback = null ) {
	try {
		return JSON.parse( await readFile( filePath, 'utf8' ) );
	} catch {
		return fallback;
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

function getHashedRelativePath( logicalPath, hash ) {
	const extension = path.extname( logicalPath );
	const base = logicalPath.slice( 0, -extension.length );
	return `${ base }.${ hash }${ extension }`;
}

function hasGeneratedHash( relativePath ) {
	return /\.[a-f0-9]{12}\.(?:css|js|mjs)$/.test( relativePath );
}

async function removePreviousGeneratedFiles( buildDir ) {
	const previousManifest = await readJsonFile( path.join( buildDir, 'asset-manifest.json' ) );
	if ( ! previousManifest ) {
		return;
	}

	const previousFiles = new Set( normalizeList( previousManifest.publishFiles ) );
	for ( const asset of Object.values( previousManifest.assets || {} ) ) {
		if ( asset?.file ) {
			previousFiles.add( asset.file );
		}
		if ( asset?.rtlFile ) {
			previousFiles.add( asset.rtlFile );
		}
		if ( asset?.style ) {
			previousFiles.add( asset.style );
		}
	}

	await Promise.all(
		[ ...previousFiles ]
			.filter( ( relativePath ) => hasGeneratedHash( relativePath ) )
			.map( ( relativePath ) => rm( path.join( buildDir, relativePath ), { force: true } ) )
	);
}

async function copyHashedEntry( buildDir, logicalPath ) {
	const sourcePath = path.join( buildDir, logicalPath );
	if ( ! ( await exists( sourcePath ) ) ) {
		throw new Error( `Expected CDN asset source file at ${ sourcePath }.` );
	}

	const contents = await readFile( sourcePath );
	const hashedPath = getHashedRelativePath( logicalPath, makeHash( contents ) );
	const destinationPath = path.join( buildDir, hashedPath );
	await mkdir( path.dirname( destinationPath ), { recursive: true } );
	await copyFile( sourcePath, destinationPath );
	return hashedPath;
}

async function addManifestAsset( context, logicalPath, details ) {
	const extension = path.extname( logicalPath );
	if ( ! HASHED_ENTRY_EXTENSIONS.has( extension ) ) {
		throw new Error( `Only JS/CSS entry assets can be hashed by this tool: ${ logicalPath }.` );
	}

	const hashedPath = await copyHashedEntry( context.buildDir, logicalPath );
	context.manifest.assets[ logicalPath ] = {
		file: hashedPath,
		type: details.type,
		...( details.id ? { id: details.id } : {} ),
		...( details.handle ? { handle: details.handle } : {} ),
		...( details.dependencies ? { dependencies: details.dependencies } : {} ),
		...( details.moduleDependencies ? { moduleDependencies: details.moduleDependencies } : {} ),
		...( details.version ? { version: details.version } : {} ),
		...( details.meta ? { meta: details.meta } : {} ),
	};
	context.publishFiles.add( hashedPath );
	return context.manifest.assets[ logicalPath ];
}

async function addAssetWithPhpMetadata( context, logicalPath, assetPath, details ) {
	const asset = assetPath
		? await readPhpReturnValue( path.join( context.buildDir, assetPath ), {} )
		: {};

	return addManifestAsset( context, logicalPath, {
		...details,
		dependencies: normalizeList( asset.dependencies ),
		moduleDependencies: normalizeList( asset.module_dependencies ),
		version: asset.version ?? undefined,
		meta: {
			...( details.meta || {} ),
			...( assetPath ? { asset: assetPath } : {} ),
		},
	} );
}

async function addOptionalStyleVariant( context, entry, logicalPath, propertyName ) {
	if ( ! ( await exists( path.join( context.buildDir, logicalPath ) ) ) ) {
		return;
	}

	const hashedPath = await copyHashedEntry( context.buildDir, logicalPath );
	entry[ propertyName ] = hashedPath;
	context.publishFiles.add( hashedPath );
}

async function walkFiles( dir, baseDir = dir ) {
	const entries = await readdir( dir, { withFileTypes: true } );
	const files = [];

	for ( const entry of entries ) {
		const fullPath = path.join( dir, entry.name );
		if ( entry.isDirectory() ) {
			files.push( ...( await walkFiles( fullPath, baseDir ) ) );
			continue;
		}
		if ( entry.isFile() ) {
			files.push( normalizeRelativePath( path.relative( baseDir, fullPath ) ) );
		}
	}

	return files;
}

async function collectStaticPublishFiles( context ) {
	if ( ! ( await exists( context.buildDir ) ) ) {
		return;
	}

	for ( const relativePath of await walkFiles( context.buildDir ) ) {
		const extension = path.extname( relativePath );
		if ( relativePath === 'asset-manifest.json' || hasGeneratedHash( relativePath ) ) {
			continue;
		}
		if ( STATIC_EXTENSIONS.has( extension ) ) {
			context.publishFiles.add( relativePath );
		}
	}
}

async function addPremiumAnalyticsAssets( context ) {
	const { buildDir, manifest, packageJson } = context;
	const wpPlugin = packageJson.wpPlugin || {};
	const handlePrefix = wpPlugin.handlePrefix || wpPlugin.packageNamespace || context.namespace;

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
					...normalizeList( page.init ).map( ( id ) => ( { import: 'static', id } ) ),
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
		const logicalPath = `modules/${ module.path }.min.js`;
		const entry = await addAssetWithPhpMetadata( context, logicalPath, `modules/${ module.asset }`, {
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
			const logicalPath = `routes/${ route.name }/route.min.js`;
			const entry = await addAssetWithPhpMetadata(
				context,
				logicalPath,
				`routes/${ route.name }/route.min.asset.php`,
				{
					type: 'route-module',
					id: `${ handlePrefix }/routes/${ route.name }/route`,
					meta: { route: route.name, page: route.page, path: route.path },
				}
			);
			routeManifest.route_module = `${ handlePrefix }/routes/${ route.name }/route`;
			routeManifest.route_file = entry.file;
		}
		if ( route.has_content ) {
			const logicalPath = `routes/${ route.name }/content.min.js`;
			const entry = await addAssetWithPhpMetadata(
				context,
				logicalPath,
				`routes/${ route.name }/content.min.asset.php`,
				{
					type: 'route-content',
					id: `${ handlePrefix }/routes/${ route.name }/content`,
					meta: { route: route.name, page: route.page, path: route.path },
				}
			);
			routeManifest.content_module = `${ handlePrefix }/routes/${ route.name }/content`;
			routeManifest.content_file = entry.file;
		}
		manifest.wpBuild.routes.push( routeManifest );
	}

	const widgets = await readPhpReturnValue( path.join( buildDir, 'widgets/registry.php' ), [] );
	for ( const widget of widgets ) {
		const widgetManifest = { ...widget };
		if ( widget.has_render ) {
			const logicalPath = `widgets/${ widget.dir_name }/render.min.js`;
			const entry = await addAssetWithPhpMetadata(
				context,
				logicalPath,
				`widgets/${ widget.dir_name }/render.min.asset.php`,
				{
					type: 'widget-render',
					id: `${ handlePrefix }/widgets/${ widget.dir_name }/render`,
					meta: {
						widget: widget.name,
						dirName: widget.dir_name,
						presentation: widget.presentation ?? null,
					},
				}
			);
			widgetManifest.render_module = `${ handlePrefix }/widgets/${ widget.dir_name }/render`;
			widgetManifest.render_file = entry.file;
		}
		if ( widget.has_widget ) {
			const logicalPath = `widgets/${ widget.dir_name }/widget.min.js`;
			const entry = await addAssetWithPhpMetadata(
				context,
				logicalPath,
				`widgets/${ widget.dir_name }/widget.min.asset.php`,
				{
					type: 'widget-metadata',
					id: `${ handlePrefix }/widgets/${ widget.dir_name }/widget`,
					meta: {
						widget: widget.name,
						dirName: widget.dir_name,
						presentation: widget.presentation ?? null,
					},
				}
			);
			widgetManifest.widget_module = `${ handlePrefix }/widgets/${ widget.dir_name }/widget`;
			widgetManifest.widget_file = entry.file;
		}
		manifest.wpBuild.widgets.push( widgetManifest );
	}

	const scripts = await readPhpReturnValue( path.join( buildDir, 'scripts/registry.php' ), [] );
	for ( const script of scripts ) {
		const logicalPath = `scripts/${ script.path }.min.js`;
		const entry = await addAssetWithPhpMetadata( context, logicalPath, `scripts/${ script.asset }`, {
			type: 'script',
			handle: script.handle,
		} );
		manifest.wpBuild.scripts.push( { ...script, file: entry.file } );
	}

	const styles = await readPhpReturnValue( path.join( buildDir, 'styles/registry.php' ), [] );
	for ( const style of styles ) {
		const logicalPath = `styles/${ style.path }.min.css`;
		const entry = await addManifestAsset( context, logicalPath, {
			type: 'style',
			handle: style.handle,
			dependencies: normalizeList( style.dependencies ),
			version: packageJson.version,
		} );
		await addOptionalStyleVariant(
			context,
			entry,
			`styles/${ style.path }-rtl.min.css`,
			'rtlFile'
		);
		manifest.wpBuild.styles.push( { ...style, file: entry.file, rtlFile: entry.rtlFile } );
	}
}

async function addCookieConsentAssets( context ) {
	const asset = await readPhpReturnValue(
		path.join( context.buildDir, 'modules/cookie-consent/index.asset.php' ),
		{}
	);
	const moduleDependencies = normalizeList( asset.module_dependencies );
	const interactivityDependencies = moduleDependencies.length
		? moduleDependencies
		: [ '@wordpress/interactivity' ];
	const scriptEntry = await addManifestAsset( context, 'modules/cookie-consent/index.js', {
		type: 'script-module',
		id: '@automattic/jetpack-cookie-consent',
		dependencies: normalizeList( asset.dependencies ),
		moduleDependencies: interactivityDependencies,
		version: asset.version ?? context.packageJson.version,
		meta: { asset: 'modules/cookie-consent/index.asset.php' },
	} );
	const styleEntry = await addManifestAsset( context, 'modules/cookie-consent/index.css', {
		type: 'style',
		handle: 'jetpack-cookie-consent',
		dependencies: [],
		version: asset.version ?? context.packageJson.version,
	} );

	context.manifest.cookieConsent = {
		moduleId: '@automattic/jetpack-cookie-consent',
		script: 'modules/cookie-consent/index.js',
		scriptFile: scriptEntry.file,
		style: 'modules/cookie-consent/index.css',
		styleFile: styleEntry.file,
		moduleDependencies: interactivityDependencies,
		version: asset.version ?? context.packageJson.version,
	};
}

async function buildManifest( options ) {
	const packageDir = path.resolve( options.packageDir );
	const buildDir = path.join( packageDir, 'build' );
	const packageJson = await readJsonFile( path.join( packageDir, 'package.json' ) );

	if ( ! packageJson ) {
		throw new Error( `Could not read package.json from ${ packageDir }.` );
	}

	if ( ! ( await exists( buildDir ) ) || ! ( await stat( buildDir ) ).isDirectory() ) {
		throw new Error( `Build directory does not exist at ${ buildDir }.` );
	}

	await removePreviousGeneratedFiles( buildDir );

	const context = {
		buildDir,
		namespace: options.namespace,
		packageJson,
		publishFiles: new Set(),
		manifest: {
			schemaVersion: 1,
			namespace: options.namespace,
			version: options.version,
			packageVersion: packageJson.version,
			assets: {},
		},
	};

	if ( options.mode === 'wp-build' ) {
		context.manifest.wpBuild = {
			boot: null,
			pages: [],
			modules: [],
			routes: [],
			widgets: [],
			scripts: [],
			styles: [],
		};
		await addPremiumAnalyticsAssets( context );
	} else if ( options.mode === 'cookie-consent' ) {
		await addCookieConsentAssets( context );
	} else {
		throw new Error( `Unsupported manifest mode: ${ options.mode }.` );
	}

	await collectStaticPublishFiles( context );
	context.publishFiles.add( 'asset-manifest.json' );

	const manifest = {
		...context.manifest,
		assets: sortObjectByKey( context.manifest.assets ),
		publishFiles: [ ...context.publishFiles ].sort(),
	};

	const manifestPath = path.join( buildDir, 'asset-manifest.json' );
	await writeFile( manifestPath, `${ JSON.stringify( manifest, null, '\t' ) }\n` );
	return manifest;
}

function parseCliArgs( argv ) {
	const options = {
		mode: null,
		namespace: null,
		packageDir: '.',
		version: 'v1',
	};

	for ( let index = 0; index < argv.length; index += 1 ) {
		const arg = argv[ index ];
		const next = () => {
			index += 1;
			if ( index >= argv.length ) {
				throw new Error( `Missing value for ${ arg }.` );
			}
			return argv[ index ];
		};

		if ( arg === '--mode' ) {
			options.mode = next();
		} else if ( arg === '--namespace' ) {
			options.namespace = next();
		} else if ( arg === '--package-dir' ) {
			options.packageDir = next();
		} else if ( arg === '--version' ) {
			options.version = next();
		} else {
			throw new Error( `Unknown argument: ${ arg }.` );
		}
	}

	if ( ! options.mode ) {
		throw new Error( 'Missing required --mode argument.' );
	}
	if ( ! options.namespace ) {
		throw new Error( 'Missing required --namespace argument.' );
	}

	return options;
}

async function main() {
	const manifest = await buildManifest( parseCliArgs( process.argv.slice( 2 ) ) );
	const assetCount = Object.keys( manifest.assets ).length;
	process.stdout.write(
		`[cdn-assets] wrote build/asset-manifest.json with ${ assetCount } hashed asset(s).\n`
	);
}

const isCli =
	process.argv[ 1 ] && fileURLToPath( import.meta.url ) === path.resolve( process.argv[ 1 ] );

if ( isCli ) {
	main().catch( ( error ) => {
		process.stderr.write( `${ error.message }\n` );
		process.exitCode = 1;
	} );
}

export { buildManifest };
