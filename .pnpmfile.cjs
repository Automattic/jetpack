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
	// Outdated dep. Already fixed upstream, just waiting on a release.
	// https://github.com/Automattic/wp-calypso/pull/87350
	if (
		pkg.name === '@automattic/social-previews' &&
		pkg.dependencies?.[ '@wordpress/components' ] === '^26.0.1'
	) {
		pkg.dependencies[ '@wordpress/components' ] = '>=26.0.1';
	}

	// Missing dep or peer dep on react.
	// https://github.com/WordPress/gutenberg/issues/55171
	if (
		pkg.name === '@wordpress/icons' &&
		! pkg.dependencies?.react &&
		! pkg.peerDependencies?.react
	) {
		pkg.peerDependencies.react = '^18';
	}

	// Missing dep or peer dep.
	// https://github.com/actions/toolkit/issues/1684
	if (
		pkg.name === '@actions/github' &&
		! pkg.dependencies?.undici &&
		! pkg.peerDependencies?.undici
	) {
		pkg.dependencies.undici = '*';
	}

	// Turn @wordpress/eslint-plugin's eslint plugin deps into peer deps.
	// https://github.com/WordPress/gutenberg/issues/39810
	if ( pkg.name === '@wordpress/eslint-plugin' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if (
				dep.startsWith( 'eslint-plugin-' ) ||
				dep.endsWith( '/eslint-plugin' ) ||
				dep.startsWith( 'eslint-config-' ) ||
				dep.endsWith( '/eslint-config' )
			) {
				delete pkg.dependencies[ dep ];
				pkg.peerDependencies[ dep ] = ver.replace( /^\^?/, '>=' );
			}
		}
	}

	// Update localtunnel axios dep to avoid CVE
	// https://github.com/localtunnel/localtunnel/issues/632
	if ( pkg.name === 'localtunnel' && pkg.dependencies.axios === '0.21.4' ) {
		pkg.dependencies.axios = '^1.6.0';
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

	// Outdated dependency.
	// No upstream bug link yet.
	if ( pkg.name === 'rollup-plugin-postcss' && pkg.dependencies.cssnano === '^5.0.1' ) {
		pkg.dependencies.cssnano = '^5.0.1 || ^6';
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

	// Apparently this package tried to switch from a dep to a peer dep, but screwed it up.
	// The screwed-up-ness makes pnpm 8.15.2 behave differently from earlier versions.
	// https://github.com/ajv-validator/ajv-formats/issues/80
	if ( pkg.name === 'ajv-formats' && pkg.dependencies?.ajv && pkg.peerDependencies?.ajv ) {
		delete pkg.dependencies.ajv;
		delete pkg.peerDependenciesMeta?.ajv;
	}

	// Missing deps.
	// https://github.com/storybookjs/test-runner/issues/414
	if ( pkg.name === '@storybook/test-runner' ) {
		pkg.dependencies.semver ??= '*';
		pkg.dependencies[ 'detect-package-manager' ] ??= '*';
	}

	// Types packages have outdated deps. Reset all their `@wordpress/*` deps to star-version,
	// which pnpm should 🤞 dedupe to match whatever is in use elsewhere in the monorepo.
	// https://github.com/Automattic/jetpack/pull/35904#discussion_r1508681777
	if ( pkg.name.startsWith( '@types/wordpress__' ) && pkg.dependencies ) {
		for ( const k of Object.keys( pkg.dependencies ) ) {
			if ( k.startsWith( '@wordpress/' ) ) {
				pkg.dependencies[ k ] = '*';
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
