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
	if ( pkg.name === '@automattic/format-currency' ) {
		// 1.0.0-alpha.0 published 2019-03-21
		pkg.dependencies[ 'i18n-calypso' ] = '^5';
	}
	if ( pkg.name === 'i18n-calypso' && pkg.dependencies[ 'interpolate-components' ] ) {
		// 5.0.0 published 2020-07-01
		pkg.dependencies[ 'interpolate-components' ] = 'npm:@automattic/interpolate-components@^1.2.0';
	}
	if ( pkg.name === '@automattic/social-previews' ) {
		// 1.1.1 published 2021-04-08
		if ( pkg.dependencies[ '@wordpress/components' ] === '^12.0.8' ) {
			// Update to avoid a dep on @emotion/native that wants react-native.
			// This dep update is in their monorepo as of 2022-03-10 with no code changes.
			pkg.dependencies[ '@wordpress/components' ] = '^19.2.0';
		}
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
	// For our purposes at least it seems to work fine with jest-environment-jsdom 27.
	// https://github.com/enzymejs/enzyme-matchers/issues/353
	if ( pkg.name === 'jest-environment-enzyme' ) {
		pkg.dependencies[ 'jest-environment-jsdom' ] = '^27';
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

	// Unpin browserslist here.
	if (
		pkg.name === 'react-dev-utils' &&
		pkg.dependencies.browserslist.match( /^\d+\.\d+\.\d+$/ )
	) {
		pkg.dependencies.browserslist = '^' + pkg.dependencies.browserslist;
	}

	// Regular expression DOS.
	if ( pkg.dependencies.trim === '0.0.1' ) {
		pkg.dependencies.trim = '^0.0.3';
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

	// @sveltejs/eslint-config peer-depends on eslint-plugin-node but doesn't seem to actually use it.
	if ( pkg.name === '@sveltejs/eslint-config' ) {
		delete pkg.peerDependencies?.[ 'eslint-plugin-node' ];
	}

	// Outdated. Looks like they're going to drop the eslint-config-wpcalypso package entirely with
	// eslint-plugin-wpcalypso 5.1.0, but they haven't released that yet.
	if ( pkg.name === 'eslint-config-wpcalypso' ) {
		pkg.peerDependencies.eslint = '^8';
		pkg.peerDependencies[ 'eslint-plugin-inclusive-language' ] = '*';
		pkg.peerDependencies[ 'eslint-plugin-jsdoc' ] = '*';
		pkg.peerDependencies[ 'eslint-plugin-wpcalypso' ] = '*';
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

module.exports = {
	hooks: {
		readPackage,
	},
};
