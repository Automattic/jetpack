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
	// Way too many dependencies, some of them vulnerable, that we don't need for the one piece of this (dist/esm/progress-bar) that we actually use.
	// p1655760691502999-slack-CBG1CP4EN
	if ( pkg.name === '@automattic/components' ) {
		delete pkg.dependencies[ '@automattic/data-stores' ];
		delete pkg.dependencies[ 'i18n-calypso' ];
		delete pkg.dependencies[ 'wpcom-proxy-request' ];
	}

	// Depends on punycode but doesn't declare it.
	// https://github.com/markdown-it/markdown-it/issues/230
	if ( pkg.name === 'markdown-it' && ! pkg.dependencies.punycode ) {
		pkg.dependencies.punycode = '^2.1.1';
	}

	// Even though Storybook works with webpack 5, they still have a bunch of deps on webpack4.
	// I hear v7 is supposed to fix that <https://github.com/storybookjs/storybook/issues/18261#issuecomment-1132031458>.
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
	// https://github.com/Automattic/wp-calypso/issues/64034 - Fixed, awaiting release.
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

	// Turn @wordpress/eslint-plugin's eslint plugin deps into peer deps.
	// https://github.com/WordPress/gutenberg/issues/39810
	if ( pkg.name === '@wordpress/eslint-plugin' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( 'eslint-plugin-' ) || dep.endsWith( '/eslint-plugin' ) ) {
				delete pkg.dependencies[ dep ];
				pkg.peerDependencies[ dep ] = ver.replace( /^\^?/, '>=' );
			}
		}
	}

	// Override @types/react* dependencies in order to use their specific versions
	// @todo This is probably not safe: https://github.com/Automattic/jetpack/pull/24294#discussion_r881708463
	for ( const dep of [ '@types/react', '@types/react-dom', '@types/react-test-renderer' ] ) {
		if ( pkg.dependencies?.[ dep ] ) {
			pkg.dependencies[ dep ] = '17.x';
		}
	}

	// Regular expression DOS.
	// Dep is via storybook, fix in v7: https://github.com/storybookjs/storybook/issues/14603#issuecomment-1105006210
	if ( pkg.dependencies.trim === '0.0.1' ) {
		pkg.dependencies.trim = '^0.0.3';
	}

	// Avoid annoying flip-flopping of sub-dep peer deps.
	// https://github.com/localtunnel/localtunnel/issues/481
	if ( pkg.name === 'localtunnel' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( ver.match( /^\d+(\.\d+)+$/ ) ) {
				pkg.dependencies[ dep ] = '^' + ver;
			}
		}
	}

	// Convert @testing-library/react's dep on @testing-library/dom to a peer.
	// https://github.com/testing-library/react-testing-library/issues/906#issuecomment-1180767493
	if (
		( pkg.name === '@testing-library/react' || pkg.name === '@testing-library/preact' ) &&
		pkg.dependencies[ '@testing-library/dom' ]
	) {
		pkg.peerDependencies ||= {};
		pkg.peerDependencies[ '@testing-library/dom' ] = pkg.dependencies[ '@testing-library/dom' ];
		delete pkg.dependencies[ '@testing-library/dom' ];
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
	// React 17 is entirely compatible with React 16, but of course abandoned packages exist...
	const react16Pkgs = new Set( [
		'react-dates', // @wordpress/components <https://github.com/WordPress/gutenberg/issues/21820?>
		'airbnb-prop-types', // @wordpress/components → react-dates
		'react-with-direction', // @wordpress/components → react-dates → react-with-styles
		'react-autosize-textarea', // @wordpress/block-editor <https://github.com/WordPress/gutenberg/issues/39619>
	] );
	if ( react16Pkgs.has( pkg.name ) ) {
		for ( const p of [ 'react', 'react-dom' ] ) {
			if (
				pkg.peerDependencies?.[ p ] &&
				pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^16|16\.x)/ ) &&
				! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^17|17\.x)/ )
			) {
				pkg.peerDependencies[ p ] += ' || ^17';
			}
		}
	}

	// Missing peer dependency.
	// https://github.com/Automattic/wp-calypso/pull/64238 - Fixed, awaiting release.
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
