// Packages we need to copy versions from for `@wordpress/dataviews/wp`.
const wpPkgs = {
	'@wordpress/components': [
		'change-case',
		'colord',
		'date-fns',
		'deepmerge',
		'@emotion/cache',
		'@emotion/css',
		'@emotion/react',
		'@emotion/styled',
		'@emotion/utils',
		'fast-deep-equal',
		'@floating-ui/react-dom',
		'framer-motion',
		'highlight-words-core',
		'is-plain-object',
		'memize',
		'@use-gesture/react',
		'uuid',
		'@wordpress/date',
		'@wordpress/hooks',
	],
	'@wordpress/element': [ 'react-dom' ],
	'@wordpress/data': [ 'use-memo-one' ],
};
const wpPkgFetches = {};

/**
 * Fix package dependencies.
 *
 * We could generally do the same with pnpm.overrides in packages.json, but this allows for comments.
 *
 * @param {object} pkg - Dependency package.json contents.
 * @return {object} Modified pkg.
 */
async function fixDeps( pkg ) {
	// Deps tend to get outdated due to a slow release cycle.
	// So change `^` to `>=` and hope any breaking changes will not really break.
	if ( pkg.name === '@automattic/social-previews' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( '@wordpress/' ) && ver.startsWith( '^' ) ) {
				pkg.dependencies[ dep ] = '>=' + ver.substring( 1 );
			}
		}
	}

	// Outdated dependency version causing dependabot warnings.
	// https://github.com/WordPress/gutenberg/issues/69557
	if (
		pkg.name.startsWith( '@wordpress/' ) &&
		pkg.dependencies?.[ '@babel/runtime' ] === '7.25.7'
	) {
		pkg.dependencies[ '@babel/runtime' ] = '^7.26.10';
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

	// Unused deprecated dependency.
	// https://github.com/WordPress/gutenberg/issues/69254
	if ( pkg.name === '@wordpress/upload-media' ) {
		delete pkg.dependencies?.[ '@shopify/web-worker' ];
	}

	// We need to add the missing deps for `@wordpress/dataviews` because
	// the build fails when using pnpm with hoisting.
	// @see https://github.com/WordPress/gutenberg/issues/67864
	if ( pkg.name === '@wordpress/dataviews' ) {
		for ( const fromPkg of Object.keys( wpPkgs ) ) {
			if ( ! wpPkgFetches[ fromPkg ] ) {
				wpPkgFetches[ fromPkg ] = fetch( `https://registry.npmjs.org/${ fromPkg }` ).then( r =>
					r.json()
				);
			}
			const ver = pkg.dependencies[ fromPkg ].replace( /^\^/, '' );
			const deps = ( await wpPkgFetches[ fromPkg ] ).versions[ ver ].dependencies;
			for ( const dep of wpPkgs[ fromPkg ] ) {
				if ( deps[ dep ] === undefined ) {
					// prettier-ignore
					throw new Error( `pnpmfile hack needs updating, ${ fromPkg } ${ ver } doesn't depend on ${ dep } anymore?` );
				}
				pkg.optionalDependencies[ dep ] = deps[ dep ];
			}
		}
	}

	// Missing dep or peer dep. Fixed in main, but needs a release.
	// https://github.com/actions/toolkit/issues/1993
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
				dep.endsWith( '/eslint-config' ) ||
				dep.startsWith( '@typescript-eslint/' )
			) {
				delete pkg.dependencies[ dep ];
				pkg.peerDependencies[ dep ] = ver.replace( /^\^?/, '>=' );
			}
		}

		// Doesn't really need these at all with eslint 9 and our config.
		pkg.peerDependenciesMeta ??= {};
		pkg.peerDependenciesMeta[ '@typescript-eslint/eslint-plugin' ] = { optional: true };
		pkg.peerDependenciesMeta[ '@typescript-eslint/parser' ] = { optional: true };
	}

	// Unnecessarily explicit deps. I don't think we really even need @wordpress/babel-preset-default at all.
	if ( pkg.name === '@wordpress/babel-preset-default' || pkg.name === '@wordpress/eslint-plugin' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( '@babel/' ) && ! ver.startsWith( '^' ) && ! ver.startsWith( '>' ) ) {
				pkg.dependencies[ dep ] = '^' + ver;
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

	// Seemingly unmaintained upstream, and has strict deps that are outdated.
	// https://github.com/mbalabash/estimo/issues/50
	if ( pkg.name === 'estimo' ) {
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

	// Outdated dependency. And it doesn't really use it in our configuration anyway.
	// Looks like it's updated in master but has had no release since.
	if ( pkg.name === 'rollup-plugin-svelte-svg' && pkg.dependencies.svgo === '^2.3.1' ) {
		pkg.dependencies.svgo = '*';
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

	// Gutenberg is intending to get rid of this. For now, let's just not upgrade it.
	// https://github.com/WordPress/gutenberg/issues/60975
	if ( pkg.name === '@wordpress/components' && pkg.dependencies?.[ 'framer-motion' ] ) {
		pkg.dependencies[ 'framer-motion' ] += ' <11.5.0';
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

	// Outdated, deprecated dependency.
	// https://github.com/fontello/svg2ttf/issues/123
	if ( pkg.name === 'svg2ttf' && pkg.dependencies?.[ '@xmldom/xmldom' ] === '^0.7.2' ) {
		pkg.dependencies[ '@xmldom/xmldom' ] = '^0.9';
	}

	// Outdated, deprecated dependency.
	// https://github.com/hipstersmoothie/react-docgen-typescript-plugin/issues/93
	if (
		pkg.name === '@storybook/react-docgen-typescript-plugin' &&
		pkg.dependencies?.[ 'flat-cache' ] === '^3.0.4'
	) {
		pkg.dependencies[ 'flat-cache' ] = '^4';
	}

	return pkg;
}

/**
 * Fix package peer dependencies.
 *
 * This can't be done with pnpm.overrides.
 *
 * @param {object} pkg - Dependency package.json contents.
 * @return {object} Modified pkg.
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

	// It assumes hoisting to find its plugins. Sigh. Add peer deps for the plugins we use.
	// https://github.com/ai/size-limit/issues/366
	if ( pkg.name === 'size-limit' ) {
		pkg.peerDependencies ??= {};
		pkg.peerDependencies[ '@size-limit/preset-app' ] = '*';
		pkg.peerDependenciesMeta ??= {};
		pkg.peerDependenciesMeta[ '@size-limit/preset-app' ] = { optional: true };
	}

	return pkg;
}

/**
 * Pnpm package hook.
 *
 * @see https://pnpm.io/pnpmfile#hooksreadpackagepkg-context-pkg--promisepkg
 * @param {object} pkg     - Dependency package.json contents.
 * @param {object} context - Pnpm object of some sort.
 * @return {object} Modified pkg.
 */
async function readPackage( pkg, context ) {
	if ( pkg.name ) {
		pkg = await fixDeps( pkg, context );
		pkg = fixPeerDeps( pkg, context );
	}
	return pkg;
}

/**
 * Pnpm lockfile hook.
 *
 * @see https://pnpm.io/pnpmfile#hooksafterallresolvedlockfile-context-lockfile--promiselockfile
 * @param {object} lockfile - Lockfile data.
 * @return {object} Modified lockfile.
 */
function afterAllResolved( lockfile ) {
	// If there's only one "importer", it's probably pnpx rather than the monorepo. Don't interfere.
	if ( Object.keys( lockfile.importers ).length === 1 ) {
		return lockfile;
	}

	for ( const [ k, v ] of Object.entries( lockfile.packages ) ) {
		// Forbid `@wordpress/scripts`. Brings in too many different versions of deps, like (as of March 2025) eslint 8 when we've already updated to eslint 9.
		if ( k.startsWith( '@wordpress/scripts@' ) ) {
			throw new Error(
				"Please don't bring in `@wordpress/scripts`. It brings in different versions of a lot of dependencies, and we generally have our own way to do the things that it tries to do.\nFor example, instead of `wp-scripts build`, run `webpack` directly with a config based on our monorepo-internal `@automattic/jetpack-webpack-config` package."
			);
		}

		// Forbid installing webpack without webpack-cli. It results in lots of spurious lockfile changes.
		// https://github.com/pnpm/pnpm/issues/3935
		if ( k.startsWith( 'webpack@' ) && ! v.optionalDependencies?.[ 'webpack-cli' ] ) {
			throw new Error(
				"Something you've done is trying to add a dependency on webpack without webpack-cli.\nThis is not allowed, as it tends to result in pnpm lockfile flip-flopping.\nSee https://github.com/pnpm/pnpm/issues/3935 for the upstream bug report.\n"
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
