import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildManifest } from '../build-asset-manifest.mjs';

const hasPhp = (() => {
	try {
		execFileSync( 'php', [ '-v' ], { stdio: 'ignore' } );
		return true;
	} catch {
		return false;
	}
})();

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
	await writeFixtureFile( root, 'package.json', `${ JSON.stringify( packageJson, null, '\t' ) }\n` );
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

function hashPath( logicalPath, contents ) {
	const hash = createHash( 'sha256' ).update( contents ).digest( 'hex' ).slice( 0, 12 );
	const extension = path.extname( logicalPath );
	return `${ logicalPath.slice( 0, -extension.length ) }.${ hash }${ extension }`;
}

async function readManifest( packageDir ) {
	return JSON.parse(
		await readFile( path.join( packageDir, 'build/asset-manifest.json' ), 'utf8' )
	);
}

function assertNoPhpPublishFiles( publishFiles ) {
	assert.equal(
		publishFiles.filter( ( file ) => file.endsWith( '.php' ) ).length,
		0,
		'publishFiles should not include generated PHP files'
	);
	assert.equal(
		publishFiles.filter( ( file ) => file.endsWith( '.asset.php' ) ).length,
		0,
		'publishFiles should not include asset.php metadata files'
	);
}

async function assertManifestFilesExist( packageDir, manifest ) {
	for ( const asset of Object.values( manifest.assets ) ) {
		assert.ok( await exists( path.join( packageDir, 'build', asset.file ) ), asset.file );
		if ( asset.rtlFile ) {
			assert.ok( await exists( path.join( packageDir, 'build', asset.rtlFile ) ), asset.rtlFile );
		}
	}
	for ( const file of manifest.publishFiles ) {
		assert.ok( await exists( path.join( packageDir, 'build', file ) ), file );
	}
}

test(
	'cookie consent manifest includes hashed assets and parsed asset metadata',
	{ skip: hasPhp ? false : 'PHP CLI is required to parse asset.php fixtures.' },
	async ( t ) => {
		const packageDir = await createFixturePackage( t, {
			name: '@automattic/jetpack-cookie-consent',
			version: '0.1.0-alpha',
		} );
		const script = 'import "@wordpress/interactivity";\nconsole.log( "cookie consent" );\n';
		const style = '.jetpack-cookie-consent { display: block; }\n';

		await writeFixtureFile( packageDir, 'build/build.php', '<?php // local runtime only.' );
		await writeFixtureFile( packageDir, 'build/modules/cookie-consent/index.js', script );
		await writeFixtureFile( packageDir, 'build/modules/cookie-consent/index.css', style );
		await writeFixtureFile(
			packageDir,
			'build/modules/cookie-consent/index.asset.php',
			phpReturn( {
				dependencies: [ 'wp-i18n' ],
				module_dependencies: [ '@wordpress/interactivity' ],
				version: 'asset-version',
			} )
		);

		const manifest = await buildManifest( {
			packageDir,
			namespace: 'cookie-consent',
			version: 'v1',
			mode: 'cookie-consent',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );
		assert.equal( manifest.schemaVersion, 1 );
		assert.equal( manifest.namespace, 'cookie-consent' );
		assert.equal( manifest.version, 'v1' );
		assert.equal( manifest.packageVersion, '0.1.0-alpha' );
		assert.equal(
			manifest.assets[ 'modules/cookie-consent/index.js' ].file,
			hashPath( 'modules/cookie-consent/index.js', script )
		);
		assert.equal(
			manifest.assets[ 'modules/cookie-consent/index.css' ].file,
			hashPath( 'modules/cookie-consent/index.css', style )
		);
		assert.deepEqual( manifest.assets[ 'modules/cookie-consent/index.js' ].dependencies, [
			'wp-i18n',
		] );
		assert.deepEqual( manifest.assets[ 'modules/cookie-consent/index.js' ].moduleDependencies, [
			'@wordpress/interactivity',
		] );
		assert.equal( manifest.assets[ 'modules/cookie-consent/index.js' ].version, 'asset-version' );
		assert.equal( manifest.cookieConsent.version, 'asset-version' );

		assert.ok( manifest.publishFiles.includes( 'asset-manifest.json' ) );
		assert.ok(
			manifest.publishFiles.includes( manifest.assets[ 'modules/cookie-consent/index.js' ].file )
		);
		assert.ok(
			manifest.publishFiles.includes( manifest.assets[ 'modules/cookie-consent/index.css' ].file )
		);
		assert.ok( ! manifest.publishFiles.includes( 'modules/cookie-consent/index.js' ) );
		assert.ok( ! manifest.publishFiles.includes( 'modules/cookie-consent/index.css' ) );
		assertNoPhpPublishFiles( manifest.publishFiles );
		await assertManifestFilesExist( packageDir, manifest );
	}
);

test(
	'wp-build manifest covers premium analytics build registries and publish files',
	{ skip: hasPhp ? false : 'PHP CLI is required to parse asset.php fixtures.' },
	async ( t ) => {
		const packageDir = await createFixturePackage( t, {
			name: '@automattic/jetpack-premium-analytics',
			version: '0.1.0-alpha',
			wpPlugin: {
				packageNamespace: 'jetpack-premium-analytics',
				handlePrefix: 'jetpack-premium-analytics',
				pages: [
					{
						id: 'jetpack-premium-analytics',
						init: [ '@jetpack-premium-analytics/init' ],
					},
				],
			},
		} );
		const files = {
			'build/pages/jetpack-premium-analytics/loader.js': 'import "@wordpress/boot";\n',
			'build/modules/init/index.min.js': 'export const init = true;\n',
			'build/routes/dashboard/route.min.js': 'export const route = true;\n',
			'build/routes/dashboard/content.min.js': 'export const content = true;\n',
			'build/widgets/top-posts/render.min.js': 'export default function Render() {}\n',
			'build/widgets/top-posts/widget.min.js': 'export const metadata = true;\n',
			'build/scripts/admin/index.min.js': 'window.jetpackPremiumAnalytics = true;\n',
			'build/styles/admin/index.min.css': '.jpa { color: #000; }\n',
			'build/styles/admin/index-rtl.min.css': '.jpa { color: #000; }\n',
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
					id: '@jetpack-premium-analytics/init',
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
					name: 'dashboard',
					path: '/',
					page: 'jetpack-premium-analytics',
					has_route: true,
					has_content: true,
				},
			] )
		);
		await writeFixtureFile(
			packageDir,
			'build/routes/dashboard/route.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@jetpack-premium-analytics/init' ],
				version: 'route-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/routes/dashboard/content.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@jetpack-premium-analytics/init' ],
				version: 'content-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/widgets/registry.php',
			phpReturn( [
				{
					name: 'jpa/top-posts',
					dir_name: 'top-posts',
					has_render: true,
					has_widget: true,
					presentation: 'chart',
				},
			] )
		);
		await writeFixtureFile(
			packageDir,
			'build/widgets/top-posts/render.min.asset.php',
			phpReturn( {
				dependencies: [],
				module_dependencies: [ '@wordpress/element' ],
				version: 'render-version',
			} )
		);
		await writeFixtureFile(
			packageDir,
			'build/widgets/top-posts/widget.min.asset.php',
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
					handle: 'jetpack-premium-analytics-admin',
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
					handle: 'jetpack-premium-analytics-admin',
					path: 'admin/index',
					dependencies: [ 'wp-components' ],
				},
			] )
		);

		const manifest = await buildManifest( {
			packageDir,
			namespace: 'premium-analytics',
			version: 'v1',
			mode: 'wp-build',
		} );

		assert.deepEqual( manifest, await readManifest( packageDir ) );
		assert.equal( manifest.namespace, 'premium-analytics' );
		assert.equal( manifest.version, 'v1' );
		assert.deepEqual( manifest.wpBuild.boot.dependencies, [ 'wp-element' ] );
		assert.equal( manifest.wpBuild.boot.version, 'boot-version' );
		assert.deepEqual( manifest.wpBuild.pages[ 0 ].initModules, [
			'@jetpack-premium-analytics/init',
		] );
		assert.equal(
			manifest.assets[ 'pages/jetpack-premium-analytics/loader.js' ].file,
			hashPath(
				'pages/jetpack-premium-analytics/loader.js',
				files[ 'build/pages/jetpack-premium-analytics/loader.js' ]
			)
		);
		assert.equal(
			manifest.assets[ 'modules/init/index.min.js' ].version,
			'module-version'
		);
		assert.deepEqual( manifest.assets[ 'modules/init/index.min.js' ].dependencies, [
			'wp-data',
		] );
		assert.equal(
			manifest.assets[ 'routes/dashboard/route.min.js' ].version,
			'route-version'
		);
		assert.equal(
			manifest.assets[ 'routes/dashboard/content.min.js' ].version,
			'content-version'
		);
		assert.equal(
			manifest.assets[ 'widgets/top-posts/render.min.js' ].version,
			'render-version'
		);
		assert.equal(
			manifest.assets[ 'widgets/top-posts/widget.min.js' ].version,
			'widget-version'
		);
		assert.equal(
			manifest.assets[ 'scripts/admin/index.min.js' ].version,
			'script-version'
		);
		assert.equal(
			manifest.assets[ 'styles/admin/index.min.css' ].rtlFile,
			hashPath(
				'styles/admin/index-rtl.min.css',
				files[ 'build/styles/admin/index-rtl.min.css' ]
			)
		);

		assert.ok( manifest.publishFiles.includes( 'asset-manifest.json' ) );
		assert.ok( manifest.publishFiles.includes( 'images/logo.svg' ) );
		assert.ok( ! manifest.publishFiles.includes( 'build.php' ) );
		assert.ok( ! manifest.publishFiles.includes( 'constants.php' ) );
		assert.ok( ! manifest.publishFiles.includes( 'modules/init/index.min.js' ) );
		assertNoPhpPublishFiles( manifest.publishFiles );
		await assertManifestFilesExist( packageDir, manifest );
	}
);
