/* eslint-disable jsdoc/require-jsdoc */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildManifest } from '../build-asset-manifest.mjs';

const hasPhp = ( () => {
	try {
		execFileSync( 'php', [ '-v' ], { stdio: 'ignore' } );
		return true;
	} catch {
		return false;
	}
} )();

async function exists( filePath ) {
	try {
		await access( filePath );
		return true;
	} catch {
		return false;
	}
}

async function writeFixtureFile( root, relativePath, contents ) {
	const filePath = path.join( root, relativePath );
	await mkdir( path.dirname( filePath ), { recursive: true } );
	await writeFile( filePath, contents );
}

async function createFixturePackage( t, packageJson ) {
	const root = await mkdtemp( path.join( tmpdir(), 'cdn-assets-' ) );
	t.after( () => rm( root, { recursive: true, force: true } ) );
	await writeFixtureFile(
		root,
		'package.json',
		`${ JSON.stringify( packageJson, null, '\t' ) }\n`
	);
	return root;
}

function phpReturn( value ) {
	return `<?php\nreturn ${ phpValue( value ) };\n`;
}

function phpValue( value ) {
	if ( Array.isArray( value ) ) {
		return `array( ${ value.map( phpValue ).join( ', ' ) } )`;
	}
	if ( value && typeof value === 'object' ) {
		return `array( ${ Object.entries( value )
			.map( ( [ key, entry ] ) => `${ JSON.stringify( key ) } => ${ phpValue( entry ) }` )
			.join( ', ' ) } )`;
	}
	if ( typeof value === 'boolean' ) {
		return value ? 'true' : 'false';
	}
	if ( value === null ) {
		return 'null';
	}
	return JSON.stringify( value );
}

function contentHash( contents ) {
	return createHash( 'sha256' ).update( contents ).digest( 'hex' ).slice( 0, 12 );
}

function hashPath( logicalPath, contents ) {
	const hash = contentHash( contents );
	const extension = path.extname( logicalPath );
	return `${ logicalPath.slice( 0, -extension.length ) }.${ hash }${ extension }`;
}

async function readManifest( packageDir, buildDir = 'build' ) {
	return JSON.parse(
		await readFile( path.join( packageDir, buildDir, 'build_meta.json' ), 'utf8' )
	);
}

// Resolve an asset's interned dependency index back to its array.
function assetDependencies( manifest, file ) {
	const asset = manifest.assets[ file ];
	return manifest.dependencySets[ asset.dependencies ];
}

function assetModuleDependencies( manifest, file ) {
	const asset = manifest.assets[ file ];
	return manifest.moduleDependencySets[ asset.moduleDependencies ];
}

function assertNoPhpPublishFiles( publishFiles ) {
	assert.equal(
		publishFiles.filter( file => file.endsWith( '.php' ) ).length,
		0,
		'publishFiles should not include generated PHP files'
	);
	assert.equal(
		publishFiles.filter( file => file.endsWith( '.asset.php' ) ).length,
		0,
		'publishFiles should not include asset.php metadata files'
	);
}

function assertNoGeneratedHashPublishFiles( publishFiles ) {
	assert.equal(
		publishFiles.filter( file => /\.[a-f0-9]{12}\.(?:css|js|mjs)$/.test( file ) ).length,
		0,
		'publishFiles should not include hash-suffixed JS/CSS files'
	);
}

async function assertManifestFilesExist( packageDir, manifest, buildDir = 'build' ) {
	for ( const asset of Object.values( manifest.assets ) ) {
		assert.ok( await exists( path.join( packageDir, buildDir, asset.file ) ), asset.file );
		if ( asset.rtlFile ) {
			assert.ok( await exists( path.join( packageDir, buildDir, asset.rtlFile ) ), asset.rtlFile );
		}
	}
	for ( const file of manifest.publishFiles ) {
		assert.ok( await exists( path.join( packageDir, buildDir, file ) ), file );
	}
}

test(
	'webpack manifest discovers stable assets, content versions, and interned dependencies',
	{ skip: hasPhp ? false : 'PHP CLI is required to parse asset.php fixtures.' },
	async t => {
		const packageDir = await createFixturePackage( t, {
			name: '@example/privacy-banner',
			version: '0.1.0-alpha',
			scripts: {
				build: 'webpack --config ./tools/webpack.config.js',
			},
		} );
		const script = 'import "@wordpress/interactivity";\nconsole.log( "privacy banner" );\n';
		const style = '.privacy-banner { display: block; }\n';
		const rtlStyle = '.privacy-banner { display: block; }\n';

		await writeFixtureFile( packageDir, 'build/build.php', '<?php // local runtime only.' );
		await writeFixtureFile( packageDir, 'build/modules/banner/index.js', script );
		await writeFixtureFile( packageDir, 'build/modules/banner/index.css', style );
		await writeFixtureFile( packageDir, 'build/modules/banner/index.rtl.css', rtlStyle );
		await writeFixtureFile( packageDir, 'build/images/icon.svg', '<svg role="img"></svg>\n' );
		await writeFixtureFile(
			packageDir,
			'build/modules/banner/index.asset.php',
			phpReturn( {
				dependencies: [ 'wp-i18n' ],
				module_dependencies: [ '@wordpress/interactivity' ],
				version: 'asset-version',
			} )
		);

		const manifest = await buildManifest( {
			packageDir,
			mode: 'webpack',
			namespace: 'privacy-banner',
			version: 'v1',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );
		assert.equal( manifest.schemaVersion, 2 );
		assert.equal( manifest.namespace, 'privacy-banner' );
		assert.equal( manifest.version, 'v1' );
		assert.equal( manifest.packageName, '@example/privacy-banner' );
		assert.equal( manifest.packageVersion, '0.1.0-alpha' );
		assert.equal( manifest.builder, 'webpack' );
		assert.match( manifest.cache_buster, /^[a-f0-9]{12}$/ );
		assert.equal( manifest.assets[ 'modules/banner/index.js' ].file, 'modules/banner/index.js' );
		assert.equal( manifest.assets[ 'modules/banner/index.css' ].file, 'modules/banner/index.css' );
		assert.equal( manifest.assets[ 'modules/banner/index.js' ].version, contentHash( script ) );
		assert.equal( manifest.assets[ 'modules/banner/index.css' ].version, contentHash( style ) );
		assert.equal(
			manifest.assets[ 'modules/banner/index.css' ].rtlFile,
			'modules/banner/index.rtl.css'
		);
		assert.equal(
			manifest.assets[ 'modules/banner/index.css' ].rtlFileVersion,
			contentHash( rtlStyle )
		);

		// Dependencies are interned: the asset stores an index, the array lives in the table.
		assert.equal( typeof manifest.assets[ 'modules/banner/index.js' ].dependencies, 'number' );
		assert.deepEqual( assetDependencies( manifest, 'modules/banner/index.js' ), [ 'wp-i18n' ] );
		assert.deepEqual( assetModuleDependencies( manifest, 'modules/banner/index.js' ), [
			'@wordpress/interactivity',
		] );

		// assetPhpVersion is no longer emitted (redundant with the content version).
		assert.equal( manifest.assets[ 'modules/banner/index.js' ].assetPhpVersion, undefined );

		assert.deepEqual( manifest.webpack.scripts, [
			{
				file: 'modules/banner/index.js',
				type: 'script-module',
				id: '@example/privacy-banner',
				asset: 'modules/banner/index.asset.php',
			},
		] );
		assert.deepEqual( manifest.webpack.styles, [
			{
				file: 'modules/banner/index.css',
				handle: 'privacy-banner-index',
				rtlFile: 'modules/banner/index.rtl.css',
				rtlFileVersion: contentHash( rtlStyle ),
			},
		] );

		assert.ok( manifest.publishFiles.includes( 'build_meta.json' ) );
		assert.ok( manifest.publishFiles.includes( 'images/icon.svg' ) );
		assert.ok( manifest.publishFiles.includes( 'modules/banner/index.js' ) );
		assert.ok( manifest.publishFiles.includes( 'modules/banner/index.css' ) );
		assert.ok( manifest.publishFiles.includes( 'modules/banner/index.rtl.css' ) );
		assert.ok( ! manifest.publishFiles.includes( 'asset-manifest.json' ) );
		assert.ok(
			! ( await exists(
				path.join( packageDir, 'build', hashPath( 'modules/banner/index.js', script ) )
			) )
		);
		assertNoPhpPublishFiles( manifest.publishFiles );
		assertNoGeneratedHashPublishFiles( manifest.publishFiles );
		await assertManifestFilesExist( packageDir, manifest );
	}
);

test(
	'wp-build manifest covers generated registries and publish files',
	{ skip: hasPhp ? false : 'PHP CLI is required to parse asset.php fixtures.' },
	async t => {
		const packageDir = await createFixturePackage( t, {
			name: '@example/dashboard-assets',
			version: '0.1.0-alpha',
			scripts: {
				build: 'pnpm run build:wp-build',
				'build:wp-build': 'wp-build',
			},
			wpPlugin: {
				packageNamespace: 'example-dashboard',
				handlePrefix: 'example-dashboard',
				pages: [
					{
						id: 'example-dashboard',
						init: [ '@example/dashboard-init' ],
					},
				],
			},
			devDependencies: {
				'@wordpress/build': '1.0.0',
			},
		} );
		const files = {
			'build/pages/example-dashboard/loader.js': 'import "@wordpress/boot";\n',
			'build/modules/init/index.min.js': 'export const init = true;\n',
			'build/routes/main/route.min.js': 'export const route = true;\n',
			'build/routes/main/content.min.js': 'export const content = true;\n',
			'build/widgets/summary/render.min.js': 'export default function Render() {}\n',
			'build/widgets/summary/widget.min.js': 'export const metadata = true;\n',
			'build/scripts/admin/index.min.js': 'window.exampleDashboard = true;\n',
			'build/styles/admin/index.min.css': '.example-dashboard { color: #000; }\n',
			'build/styles/admin/index-rtl.min.css': '.example-dashboard { color: #000; }\n',
			'build/images/logo.svg': '<svg role="img"></svg>\n',
			'build/build.php': '<?php // local runtime only.',
			'build/constants.php': '<?php // local runtime only.',
		};

		await Promise.all(
			Object.entries( files ).map( ( [ file, contents ] ) =>
				writeFixtureFile( packageDir, file, contents )
			)
		);
		await writeFixtureFile(
			packageDir,
			'build/modules/boot/index.min.asset.php',
			phpReturn( {
				dependencies: [ 'wp-element' ],
				module_dependencies: [ { id: '@wordpress/boot', import: 'static' } ],
				version: 'boot-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/modules/registry.php',
			phpReturn( [
				{
					id: '@example/dashboard-init',
					path: 'init/index',
					asset: 'init/index.min.asset.php',
					min_only: true,
				},
			] )
		);
		await writeFixtureFile(
			packageDir,
			'build/modules/init/index.min.asset.php',
			phpReturn( {
				dependencies: [ 'wp-data' ],
				module_dependencies: [ '@wordpress/boot' ],
				version: 'module-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/routes/registry.php',
			phpReturn( [
				{
					name: 'main',
					path: '/',
					page: 'example-dashboard',
					has_route: true,
					has_content: true,
				},
			] )
		);
		await writeFixtureFile(
			packageDir,
			'build/routes/main/route.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@example/dashboard-init' ],
				version: 'route-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/routes/main/content.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@example/dashboard-init' ],
				version: 'content-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/widgets/registry.php',
			phpReturn( [
				{
					name: 'example/summary',
					dir_name: 'summary',
					has_render: true,
					has_widget: true,
					presentation: 'chart',
				},
			] )
		);
		await writeFixtureFile(
			packageDir,
			'build/widgets/summary/render.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@wordpress/element' ],
				version: 'render-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/widgets/summary/widget.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@wordpress/widget-primitives' ],
				version: 'widget-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/scripts/registry.php',
			phpReturn( [
				{
					handle: 'example-dashboard-admin',
					path: 'admin/index',
					asset: 'admin/index.min.asset.php',
				},
			] )
		);
		await writeFixtureFile(
			packageDir,
			'build/scripts/admin/index.min.asset.php',
			phpReturn( {
				dependencies: [ 'wp-api-fetch' ],
				version: 'script-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/styles/registry.php',
			phpReturn( [
				{
					handle: 'example-dashboard-admin',
					path: 'admin/index',
					dependencies: [ 'wp-components' ],
				},
			] )
		);

		const manifest = await buildManifest( {
			packageDir,
			mode: 'wp-build',
			namespace: 'example-dashboard',
			version: 'v1',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );
		assert.equal( manifest.schemaVersion, 2 );
		assert.equal( manifest.namespace, 'example-dashboard' );
		assert.equal( manifest.version, 'v1' );
		assert.equal( manifest.builder, 'wp-build' );
		assert.match( manifest.cache_buster, /^[a-f0-9]{12}$/ );
		assert.deepEqual( manifest.wpBuild.boot.dependencies, [ 'wp-element' ] );
		assert.equal( manifest.wpBuild.boot.version, 'boot-version' );
		assert.deepEqual( manifest.wpBuild.pages[ 0 ].initModules, [ '@example/dashboard-init' ] );
		assert.equal(
			manifest.assets[ 'pages/example-dashboard/loader.js' ].file,
			'pages/example-dashboard/loader.js'
		);
		assert.equal(
			manifest.assets[ 'pages/example-dashboard/loader.js' ].version,
			contentHash( files[ 'build/pages/example-dashboard/loader.js' ] )
		);

		// Dependencies are interned and assetPhpVersion is dropped.
		assert.equal( manifest.assets[ 'modules/init/index.min.js' ].assetPhpVersion, undefined );
		assert.deepEqual( assetDependencies( manifest, 'modules/init/index.min.js' ), [ 'wp-data' ] );
		assert.deepEqual( assetModuleDependencies( manifest, 'modules/init/index.min.js' ), [
			'@wordpress/boot',
		] );
		assert.deepEqual( assetDependencies( manifest, 'routes/main/route.min.js' ), [] );
		assert.deepEqual( assetDependencies( manifest, 'scripts/admin/index.min.js' ), [
			'wp-api-fetch',
		] );

		// Routes 'route' and 'content' have identical dependency sets — they should
		// share interned indices.
		assert.equal(
			manifest.assets[ 'routes/main/route.min.js' ].dependencies,
			manifest.assets[ 'routes/main/content.min.js' ].dependencies
		);
		assert.equal(
			manifest.assets[ 'routes/main/route.min.js' ].moduleDependencies,
			manifest.assets[ 'routes/main/content.min.js' ].moduleDependencies
		);

		assert.equal(
			manifest.assets[ 'styles/admin/index.min.css' ].rtlFile,
			'styles/admin/index-rtl.min.css'
		);
		assert.equal(
			manifest.assets[ 'styles/admin/index.min.css' ].version,
			contentHash( files[ 'build/styles/admin/index.min.css' ] )
		);
		assert.equal(
			manifest.assets[ 'styles/admin/index.min.css' ].rtlFileVersion,
			contentHash( files[ 'build/styles/admin/index-rtl.min.css' ] )
		);

		assert.ok( manifest.publishFiles.includes( 'build_meta.json' ) );
		assert.ok( manifest.publishFiles.includes( 'images/logo.svg' ) );
		assert.ok( manifest.publishFiles.includes( 'modules/init/index.min.js' ) );
		assert.ok( manifest.publishFiles.includes( 'routes/main/content.min.js' ) );
		assert.ok( manifest.publishFiles.includes( 'styles/admin/index.min.css' ) );
		assert.ok( ! manifest.publishFiles.includes( 'asset-manifest.json' ) );
		assert.ok( ! manifest.publishFiles.includes( 'build.php' ) );
		assert.ok( ! manifest.publishFiles.includes( 'constants.php' ) );
		assertNoPhpPublishFiles( manifest.publishFiles );
		assertNoGeneratedHashPublishFiles( manifest.publishFiles );
		await assertManifestFilesExist( packageDir, manifest );
	}
);

test(
	'dependency arrays dedupe and module dependency key order is canonicalized',
	{ skip: hasPhp ? false : 'PHP CLI is required to parse asset.php fixtures.' },
	async t => {
		const packageDir = await createFixturePackage( t, {
			name: '@example/dedup',
			version: '0.1.0-alpha',
		} );

		await writeFixtureFile( packageDir, 'build/a/index.js', 'export const a = 1;\n' );
		await writeFixtureFile( packageDir, 'build/b/index.js', 'export const b = 2;\n' );

		// Same logical dependencies, but serialized with different array order and
		// different object key order. They must collapse to one interned entry each.
		await writeFixtureFile(
			packageDir,
			'build/a/index.asset.php',
			phpReturn( {
				dependencies: [ 'wp-i18n', 'wp-element' ],
				module_dependencies: [
					{ id: '@wordpress/x', import: 'static' },
					{ id: '@wordpress/y', import: 'dynamic' },
				],
				version: 'a-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/b/index.asset.php',
			phpReturn( {
				dependencies: [ 'wp-element', 'wp-i18n' ],
				module_dependencies: [
					{ import: 'dynamic', id: '@wordpress/y' },
					{ import: 'static', id: '@wordpress/x' },
				],
				version: 'b-version',
			} )
		);

		const manifest = await buildManifest( {
			packageDir,
			mode: 'webpack',
			namespace: 'dedup',
			version: 'v1',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );

		// Both assets resolve to the same interned index for each table.
		assert.equal(
			manifest.assets[ 'a/index.js' ].dependencies,
			manifest.assets[ 'b/index.js' ].dependencies
		);
		assert.equal(
			manifest.assets[ 'a/index.js' ].moduleDependencies,
			manifest.assets[ 'b/index.js' ].moduleDependencies
		);

		// Exactly one distinct entry in each table (no duplicates survive).
		assert.equal( manifest.dependencySets.length, 1 );
		assert.equal( manifest.moduleDependencySets.length, 1 );

		// Dependencies are stored sorted.
		assert.deepEqual( manifest.dependencySets[ 0 ], [ 'wp-element', 'wp-i18n' ] );

		// Module dependency objects use a canonical key order (id before import)
		// and are sorted by id.
		assert.deepEqual( manifest.moduleDependencySets[ 0 ], [
			{ id: '@wordpress/x', import: 'static' },
			{ id: '@wordpress/y', import: 'dynamic' },
		] );
		assert.deepEqual( Object.keys( manifest.moduleDependencySets[ 0 ][ 0 ] ), [ 'id', 'import' ] );

		await assertManifestFilesExist( packageDir, manifest );
	}
);

test( 'a supported --mode is required', async t => {
	const packageDir = await createFixturePackage( t, {
		name: '@example/needs-mode',
		version: '0.1.0-alpha',
	} );
	await writeFixtureFile( packageDir, 'build/index.js', 'export const x = 1;\n' );

	await assert.rejects(
		buildManifest( { packageDir, namespace: 'needs-mode', mode: 'not-a-builder' } ),
		/supported --mode is required/
	);
	await assert.rejects(
		buildManifest( { packageDir, namespace: 'needs-mode' } ),
		/supported --mode is required/
	);
} );

test( 'a namespace is required', async t => {
	const packageDir = await createFixturePackage( t, {
		name: '@example/needs-namespace',
		version: '0.1.0-alpha',
	} );
	await writeFixtureFile( packageDir, 'build/index.js', 'export const x = 1;\n' );

	await assert.rejects( buildManifest( { packageDir, mode: 'webpack' } ), /namespace is required/ );
} );
