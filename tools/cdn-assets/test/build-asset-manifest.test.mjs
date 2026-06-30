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
	'webpack manifest discovers stable assets, content versions, and parsed metadata',
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
			version: 'v1',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );
		assert.equal( manifest.schemaVersion, 1 );
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
		assert.deepEqual( manifest.assets[ 'modules/banner/index.js' ].dependencies, [ 'wp-i18n' ] );
		assert.deepEqual( manifest.assets[ 'modules/banner/index.js' ].moduleDependencies, [
			'@wordpress/interactivity',
		] );
		assert.equal( manifest.assets[ 'modules/banner/index.js' ].assetPhpVersion, 'asset-version' );
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
			version: 'v1',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );
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
		assert.equal(
			manifest.assets[ 'modules/init/index.min.js' ].assetPhpVersion,
			'module-version'
		);
		assert.deepEqual( manifest.assets[ 'modules/init/index.min.js' ].dependencies, [ 'wp-data' ] );
		assert.equal( manifest.assets[ 'routes/main/route.min.js' ].assetPhpVersion, 'route-version' );
		assert.equal(
			manifest.assets[ 'routes/main/content.min.js' ].assetPhpVersion,
			'content-version'
		);
		assert.equal(
			manifest.assets[ 'widgets/summary/render.min.js' ].assetPhpVersion,
			'render-version'
		);
		assert.equal(
			manifest.assets[ 'widgets/summary/widget.min.js' ].assetPhpVersion,
			'widget-version'
		);
		assert.equal(
			manifest.assets[ 'scripts/admin/index.min.js' ].assetPhpVersion,
			'script-version'
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

test( 'manifest honors package-local config for build directory', async t => {
	const packageDir = await createFixturePackage( t, {
		name: '@example/configured-assets',
		version: '0.1.0-alpha',
	} );
	const script = 'console.log( "configured output" );\n';

	await writeFixtureFile(
		packageDir,
		'.build-asset.json',
		`${ JSON.stringify(
			{
				buildDir: 'dist',
				builder: 'webpack',
				namespace: 'configured-output',
				version: 'v9',
			},
			null,
			'\t'
		) }\n`
	);
	await writeFixtureFile( packageDir, 'dist/index.js', script );

	const manifest = await buildManifest( { packageDir } );

	assert.deepEqual( manifest, await readManifest( packageDir, 'dist' ) );
	assert.equal( manifest.namespace, 'configured-output' );
	assert.equal( manifest.version, 'v9' );
	assert.equal( manifest.builder, 'webpack' );
	assert.equal( manifest.assets[ 'index.js' ].version, contentHash( script ) );
	assert.ok( manifest.publishFiles.includes( 'build_meta.json' ) );
	assert.ok( manifest.publishFiles.includes( 'index.js' ) );
	await assertManifestFilesExist( packageDir, manifest, 'dist' );
} );
