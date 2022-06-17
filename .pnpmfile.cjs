// Note if you change something here, you'll have to make a package.json mismatch pnpm-lock.yaml to
// get it re-run. An easy way to do that is to just edit pnpm-lock.yaml to change the version number
// of husky near the top.

/**
 * Fix package dependencies.
 *
 * We could generally do the same with pnpm.overrides in packages.json, but this allows for comments.
 *
 * @param {object} pkg - Dependency package.json contents.
 * @returns {object} Modified pkg.
 */
function fixDeps( pkg ) {
	// Why do they not publish new versions from their monorepo?
	if ( pkg.name === '@automattic/components' ) {
		// 1.0.0-alpha.3 published 2020-11-11.
		if ( ! pkg.dependencies[ '@wordpress/base-styles' ] ) {
			// Depends on this but doesn't specify it.
			pkg.dependencies[ '@wordpress/base-styles' ] = '^4.0.4';
		}
	}

	// Depends on punycode but doesn't declare it.
	// https://github.com/markdown-it/markdown-it/issues/230
	if ( pkg.name === 'markdown-it' && ! pkg.dependencies.punycode ) {
		pkg.dependencies.punycode = '^2.1.1';
	}

	// Even though Storybook works with webpack 5, they still have a bunch of deps on webpack4.
	if ( pkg.name.startsWith( '@storybook/' ) ) {
		if ( pkg.dependencies[ '@storybook/builder-webpack4' ] ) {
			pkg.dependencies[ '@storybook/builder-webpack4' ] = 'npm:@storybook/builder-webpack5@^6';
		}
		if ( pkg.dependencies[ '@storybook/manager-webpack4' ] ) {
			pkg.dependencies[ '@storybook/manager-webpack4' ] = 'npm:@storybook/manager-webpack5@^6';
		}
		if ( pkg.dependencies.webpack ) {
			pkg.dependencies.webpack = '^5';
		}
		if ( pkg.dependencies[ '@types/webpack' ] ) {
			pkg.dependencies[ '@types/webpack' ] = '^5';
		}
	}

	// Project is supposedly not dead, but still isn't being updated.
	// For our purposes at least it seems to work fine with jest-environment-jsdom 28.
	// https://github.com/enzymejs/enzyme-matchers/issues/353
	if ( pkg.name === 'jest-environment-enzyme' ) {
		pkg.dependencies[ 'jest-environment-jsdom' ] = '^28';
	}

	// Missing dep or peer dep on @wordpress/element.
	// https://github.com/WordPress/gutenberg/issues/41341
	// https://github.com/WordPress/gutenberg/issues/41346
	if (
		( pkg.name === '@wordpress/preferences' || pkg.name === '@wordpress/viewport' ) &&
		! pkg.dependencies?.[ '@wordpress/element' ] &&
		! pkg.peerDependencies?.[ '@wordpress/element' ]
	) {
		pkg.peerDependencies[ '@wordpress/element' ] = '*';
	}

	// Missing dep or peer dep on @babel/runtime
	// https://github.com/WordPress/gutenberg/issues/41343
	// https://github.com/Automattic/wp-calypso/issues/64034
	// https://github.com/Automattic/wp-calypso/pull/64464
	if (
		( pkg.name === '@wordpress/reusable-blocks' ||
			pkg.name === '@automattic/popup-monitor' ||
			pkg.name === '@automattic/social-previews' ) &&
		! pkg.dependencies?.[ '@babel/runtime' ] &&
		! pkg.peerDependencies?.[ '@babel/runtime' ]
	) {
		pkg.peerDependencies[ '@babel/runtime' ] = '^7';
	}

	// Need to match the version of jest used everywhere else.
	if (
		pkg.name === '@wordpress/jest-preset-default' &&
		pkg.dependencies[ 'babel-jest' ] &&
		pkg.dependencies[ 'babel-jest' ].startsWith( '^27' )
	) {
		pkg.dependencies[ 'babel-jest' ] = '^28';
	}

	// Turn @wordpress/eslint-plugin's eslint plugin deps into peer deps.
	if ( pkg.name === '@wordpress/eslint-plugin' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( 'eslint-plugin-' ) || dep.endsWith( '/eslint-plugin' ) ) {
				delete pkg.dependencies[ dep ];
				pkg.peerDependencies[ dep ] = ver.replace( /^\^?/, '>=' );
			}
		}
	}

	// Override @types/react* dependencies in order to use their specific versions
	for ( const dep of [ '@types/react', '@types/react-dom', '@types/react-test-renderer' ] ) {
		if ( pkg.dependencies?.[ dep ] ) {
			pkg.dependencies[ dep ] = '17.x';
		}
	}

	// Regular expression DOS.
	if ( pkg.dependencies.trim === '0.0.1' ) {
		pkg.dependencies.trim = '^0.0.3';
	}

	// Cheerio 1.0.0-rc.11 breaks enzyme 3.11.0.
	// No bug link, we're planning on dropping enzyme soonish anyway.
	if ( pkg.name === 'enzyme' && pkg.dependencies.cheerio === '^1.0.0-rc.3' ) {
		pkg.dependencies.cheerio = '^1.0.0-rc.3 <= 1.0.0-rc.10';
	}

	return pkg;
}

/**
 * Fix package peer dependencies.
 *
 * This can't be done with pnpm.overrides.
 *
 * @param {object} pkg - Dependency package.json contents.
 * @returns {object} Modified pkg.
 */
function fixPeerDeps( pkg ) {
	// React 17 is entirely compatible with React 16, but a lot of junk hasn't updated deps yet.
	for ( const p of [ 'react', 'react-dom' ] ) {
		if (
			pkg.peerDependencies?.[ p ] &&
			pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^16|16\.x)/ ) &&
			! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^17|17\.x)/ )
		) {
			pkg.peerDependencies[ p ] += ' || ^17';
		}
	}

	// Missing peer dependency.
	if (
		pkg.name === 'eslint-plugin-wpcalypso' &&
		! pkg.peerDependencies?.[ 'eslint-plugin-react' ]
	) {
		pkg.peerDependencies[ 'eslint-plugin-react' ] = '*';
	}

	return pkg;
}

/**
 * Pnpm package hook.
 *
 * @see https://pnpm.io/pnpmfile#hooksreadpackagepkg-context-pkg--promisepkg
 * @param {object} pkg - Dependency package.json contents.
 * @param {object} context - Pnpm object of some sort.
 * @returns {object} Modified pkg.
 */
function readPackage( pkg, context ) {
	if ( pkg.name ) {
		pkg = fixDeps( pkg, context );
		pkg = fixPeerDeps( pkg, context );
	}
	return pkg;
}

/**
 * Pnpm lockfile hook.
 *
 * @see https://pnpm.io/pnpmfile#hooksafterallresolvedlockfile-context-lockfile--promiselockfile
 * @param {object} lockfile - Lockfile data.
 * @returns {object} Modified lockfile.
 */
function afterAllResolved( lockfile ) {
	for ( const [ k, v ] of Object.entries( lockfile.packages ) ) {
		// Forbid installing webpack without webpack-cli. It results in lots of spurious lockfile changes.
		// https://github.com/pnpm/pnpm/issues/3935
		if ( k.startsWith( '/webpack/' ) && ! v.dependencies[ 'webpack-cli' ] ) {
			throw new Error(
				"Something you've done is trying to add a dependency on webpack without webpack-cli.\nThis is not allowed, as it tends to result in pnpm lockfile flip-flopping.\nSee https://github.com/pnpm/pnpm/issues/3935 for the upstream bug report."
			);
		}
	}
	return lockfile;
}

module.exports = {
	hooks: {
		readPackage,
		afterAllResolved,
	},
};
