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

	// Undeclared dependency on prop-types.
	// https://github.com/nutboltu/storybook-addon-mock/issues/157
	if ( pkg.name === 'storybook-addon-mock' ) {
		pkg.dependencies ||= {};
		pkg.dependencies[ 'prop-types' ] = '*';
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
	if (
		pkg.name === '@wordpress/reusable-blocks' &&
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

	// Missing dep on @emotion/react.
	// https://github.com/WordPress/gutenberg/issues/52474
	if (
		pkg.name === '@wordpress/block-editor' &&
		pkg.dependencies?.[ '@emotion/styled' ] &&
		! pkg.dependencies?.[ '@emotion/react' ]
	) {
		pkg.dependencies[ '@emotion/react' ] = '^11.7.1';
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

	// Outdated dependency.
	// No upstream bug link yet.
	if (
		pkg.name === '@automattic/social-previews' &&
		pkg.dependencies[ '@wordpress/components' ] === '^22.1.0'
	) {
		pkg.dependencies[ '@wordpress/components' ] = '*';
	}

	// Outdated dependency.
	// No upstream bug link yet.
	if ( pkg.name === 'rollup-plugin-postcss' && pkg.dependencies.cssnano === '^5.0.1' ) {
		pkg.dependencies.cssnano = '^5.0.1 || ^6';
	}

	// Outdated dependency.
	// No upstream bug link yet.
	if ( pkg.name === 'svelte-navigator' && pkg.dependencies.svelte2tsx === '^0.1.151' ) {
		pkg.dependencies.svelte2tsx = '^0.6.10';
	}

	// Missing dep or peer dep on @babel/runtime
	// https://github.com/zillow/react-slider/issues/296
	if (
		pkg.name === 'react-slider' &&
		! pkg.dependencies?.[ '@babel/runtime' ] &&
		! pkg.peerDependencies?.[ '@babel/runtime' ]
	) {
		pkg.peerDependencies[ '@babel/runtime' ] = '^7';
	}

	// Annoying tilde dep, already fixed in storybook 7.1
	if ( pkg.name === '@storybook/codemod' || pkg.name === '@storybook/csf-tools' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( '@babel/' ) && ver.startsWith( '~' ) ) {
				pkg.dependencies[ dep ] = '^' + ver.substring( 1 );
			}
		}
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
	// Indirect deps that still depend on React <18.
	const reactOldPkgs = new Set( [
		// Still on 16.
		'react-autosize-textarea', // @wordpress/block-editor <https://github.com/WordPress/gutenberg/issues/39619>

		// Still on 17.
		'reakit', // @wordpress/components
		'reakit-system', // @wordpress/components → reakit
		'reakit-utils', // @wordpress/components → reakit
		'reakit-warning', // @wordpress/components → reakit
		'@automattic/components',
		'@automattic/social-previews',
	] );
	if ( reactOldPkgs.has( pkg.name ) ) {
		for ( const p of [ 'react', 'react-dom' ] ) {
			if ( ! pkg.peerDependencies?.[ p ] ) {
				continue;
			}

			if (
				pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^16|16\.x)/ ) &&
				! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^17|17\.x)/ )
			) {
				pkg.peerDependencies[ p ] += ' || ^17';
			}
			if (
				pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^17|17\.x)/ ) &&
				! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^18|18\.x)/ )
			) {
				pkg.peerDependencies[ p ] += ' || ^18';
			}
		}
	}

	// Outdated peer dependency.
	// No upstream bug link yet.
	if (
		pkg.name === '@automattic/components' &&
		pkg.peerDependencies[ '@wordpress/data' ] === '^6.1.5'
	) {
		pkg.peerDependencies[ '@wordpress/data' ] = '*';
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
	// If there's only one "importer", it's probably pnpx rather than the monorepo. Don't interfere.
	if ( Object.keys( lockfile.importers ).length === 1 ) {
		return lockfile;
	}

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
