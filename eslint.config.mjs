import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import autoProjects from 'jetpack-js-tools/eslintrc/auto-projects.mjs';
import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

const rootdir = fileURLToPath( new URL( '.', import.meta.url ) );

/**
 * `projects/packages/scan` uses nested `routes/<name>/package.json` for wp-build.
 * Root ESLint skips per-project configs; merge those deps for import/no-extraneous-dependencies.
 *
 * @return {string[]} Absolute paths of route folders that contain a `package.json`.
 */
function getJetpackScanRoutePackageDirs() {
	const routesRoot = path.join( rootdir, 'projects/packages/scan/routes' );
	if ( ! fs.existsSync( routesRoot ) ) {
		return [];
	}
	return fs
		.readdirSync( routesRoot, { withFileTypes: true } )
		.filter( dirent => dirent.isDirectory() )
		.map( dirent => path.join( routesRoot, dirent.name ) )
		.filter( dir => fs.existsSync( path.join( dir, 'package.json' ) ) );
}

const jetpackScanRoutePackageDirs = getJetpackScanRoutePackageDirs();

export default defineConfig(
	makeBaseConfig( import.meta.url ),
	autoProjects,
	...( jetpackScanRoutePackageDirs.length > 0
		? [
				{
					name: 'Jetpack Scan (wp-build routes): merge route package.json for import deps',
					files: [ 'projects/packages/scan/routes/**/*.{js,jsx,ts,tsx,mjs,cjs}' ],
					rules: {
						'import/no-extraneous-dependencies': [
							'error',
							{
								packageDir: [
									path.join( rootdir, 'projects/packages/scan' ),
									...jetpackScanRoutePackageDirs,
								],
							},
						],
					},
				},
		  ]
		: [] )
);
