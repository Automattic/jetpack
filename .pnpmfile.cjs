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
		'react-colorful',
		'react-day-picker',
	],
	'@wordpress/element': [ 'react-dom' ],
	'@wordpress/data': [ 'use-memo-one' ],
	'@wordpress/ui': [ '@base-ui/react' ],
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
	if (
		pkg.name === '@automattic/api-core' ||
		pkg.name === '@automattic/components' ||
		pkg.name === '@automattic/data-stores' ||
		pkg.name === '@automattic/i18n-utils' ||
		pkg.name === '@automattic/launchpad' ||
		pkg.name === '@automattic/ui'
	) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( '@wordpress/' ) ) {
				if ( ver.startsWith( '^' ) ) {
					pkg.dependencies[ dep ] = '>=' + ver.substring( 1 );
				} else if ( ver.match( /^\d/ ) ) {
					pkg.dependencies[ dep ] = '>=' + ver;
				}
			}
		}
	}

	// Breaking change in @wordpress/icons v11.
	if (
		pkg.name === '@automattic/components' &&
		pkg.dependencies[ '@wordpress/icons' ]?.startsWith( '>=10' )
	) {
		pkg.dependencies[ '@wordpress/icons' ] += ' <11';
	}

	// Outdated dependency version causing dependabot warnings.
	// Once we can drop @wordpress/icons v10 (see above), looks like this can go away.
	// https://github.com/WordPress/gutenberg/issues/69557
	if ( pkg.name === '@wordpress/icons' && pkg.dependencies?.[ '@babel/runtime' ] === '7.25.7' ) {
		pkg.dependencies[ '@babel/runtime' ] = '^7.26.10';
	}

	// Missing dep or peer dep on react.
	// https://github.com/WordPress/gutenberg/issues/73257 (fixed in @wordpress/icons v11, but see above)
	// https://github.com/WordPress/gutenberg/issues/74394
	if (
		( pkg.name === '@wordpress/icons' || pkg.name === '@wordpress/image-cropper' ) &&
		! pkg.dependencies?.react &&
		! pkg.peerDependencies?.react
	) {
		pkg.peerDependencies.react = '^18';
	}

	// We need to add the missing deps for `@wordpress/dataviews` because
	// the build fails when using pnpm with hoisting.
	// @see https://github.com/WordPress/gutenberg/issues/67864
	if ( pkg.name === '@wordpress/dataviews' ) {
		for ( const fromPkg of Object.keys( wpPkgs ) ) {
			if ( ! pkg.dependencies[ fromPkg ] ) {
				// Old version of dataviews lacks a new dep? We'll check in afterAllResolved for it being an old dep instead.
				continue;
			}

			if ( ! wpPkgFetches[ fromPkg ] ) {
				wpPkgFetches[ fromPkg ] = fetch( `https://registry.npmjs.org/${ fromPkg }` ).then( r =>
					r.json()
				);
			}
			const ver = pkg.dependencies[ fromPkg ].replace( /^\^/, '' ).replace( /\+[0-9a-f]+$/, '' );
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

	// Outdated dependency and unnecessarily explicit deps.
	if ( pkg.name === '@wordpress/build' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( ! ver.startsWith( '^' ) && ! ver.startsWith( '>' ) ) {
				pkg.dependencies[ dep ] = '^' + ver;
			}
		}
		if ( pkg.dependencies.cssnano === '^6.0.1' ) {
			pkg.dependencies.cssnano = '^6 || ^7';
		}
	}

	// Outdated dependency
	if ( pkg.name === '@wordpress/jest-console' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( dep.startsWith( 'jest-' ) && ver.startsWith( '^29.' ) ) {
				pkg.dependencies[ dep ] = '>=' + ver.substring( 1 );
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

	// Unnecessary strict deps.
	if ( pkg.name === 'estimo' ) {
		for ( const [ dep, ver ] of Object.entries( pkg.dependencies ) ) {
			if ( ver.match( /^\d+(\.\d+)+$/ ) ) {
				pkg.dependencies[ dep ] = '^' + ver;
			}
		}
	}

	// Outdated dependency.
	// https://github.com/istanbuljs/babel-plugin-istanbul/issues/300
	// https://github.com/jestjs/jest/issues/15236
	if ( pkg.name === 'babel-plugin-istanbul' && pkg.dependencies[ 'test-exclude' ] === '^6.0.0' ) {
		pkg.dependencies[ 'test-exclude' ] = '^7.0.0';
	}

	// Outdated dependency.
	// https://github.com/egoist/rollup-plugin-postcss/issues/469
	if ( pkg.name === 'rollup-plugin-postcss' && pkg.dependencies.cssnano === '^5.0.1' ) {
		pkg.dependencies.cssnano = '^5.0.1 || ^6 || ^7';
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
	// https://github.com/ajv-validator/ajv-formats/issues/80
	if ( pkg.name === 'ajv-formats' && pkg.dependencies?.ajv && pkg.peerDependencies?.ajv ) {
		delete pkg.dependencies.ajv;
		delete pkg.peerDependenciesMeta?.ajv;
	}

	// Types packages have outdated deps. Reset all their `@wordpress/*` deps to star-version,
	// which pnpm should 🤞 dedupe to match whatever is in use elsewhere in the monorepo.
	// https://github.com/Automattic/jetpack/pull/35904#discussion_r1508681777
	// Currently @types/wordpress__block-editor is the only one still in use; see also https://github.com/WordPress/gutenberg/issues/67691
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

	// Dependency on "latest" makes for many spurious updates. Leave it for the lockfile maintenance PRs.
	// No upstream evident to report bugs to.
	if ( pkg.name === '@paulirish/trace_engine' ) {
		for ( const k of Object.keys( pkg.dependencies ) ) {
			if ( pkg.dependencies[ k ] === 'latest' ) {
				pkg.dependencies[ k ] = '*';
			}
		}
	}

	// Seems to depend on hoisting. 33306 doesn't seem to directly address it, but 33315 looks like it will fix it anyway.
	// https://github.com/storybookjs/storybook/issues/33306
	if ( pkg.name === 'storybook' && ! pkg.dependencies[ '@vitest/mocker' ] ) {
		pkg.dependencies[ '@vitest/mocker' ] = '*';
	}

	// GHSA-73rr-hh4g-fpgx
	// https://github.com/WordPress/gutenberg/issues/74669
	if (
		( pkg.name === '@wordpress/block-editor' || pkg.name === '@wordpress/sync' ) &&
		( pkg.dependencies?.diff?.startsWith( '^4.' ) || pkg.dependencies?.diff?.startsWith( '4.' ) )
	) {
		pkg.dependencies.diff = '^8.0.3';
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

	// Override @automattic/launchpad peer dependency to use @wordpress/i18n v6 if it's on v5.
	if (
		pkg.name === '@automattic/launchpad' &&
		pkg.peerDependencies?.[ '@wordpress/i18n' ] &&
		pkg.peerDependencies?.[ '@wordpress/i18n' ].startsWith( '^5.' )
	) {
		pkg.peerDependencies[ '@wordpress/i18n' ] = '^6';
	}

	// Should be an optional peer dep, but isn't.
	// Since it already has a (non-optional 🙄) peer dep on sass-embedded, we can just delete the sass dep.
	if ( pkg.name === 'esbuild-sass-plugin' && pkg.dependencies.sass ) {
		delete pkg.dependencies.sass;
	}

	// 0.x versions treat `^` like `~`. Replace with `>=`.
	if ( pkg.name === '@wordpress/build' && pkg.peerDependencies ) {
		for ( const [ dep, ver ] of Object.entries( pkg.peerDependencies ) ) {
			if ( ver.startsWith( '^0.' ) ) {
				pkg.peerDependencies[ dep ] = '>=' + ver.substring( 1 );
			}
		}
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
 * @param {object} context  - Pnpm object of some sort.
 * @return {object} Modified lockfile.
 */
function afterAllResolved( lockfile, context ) {
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

		// Encourage `sass-embedded` over `sass`. Supposed to be faster, and it would be easy for `sass` to leak in.
		if ( k.startsWith( 'sass@' ) || k.startsWith( 'node-sass@' ) ) {
			throw new Error(
				// prettier-ignore
				`Please use \`sass-embedded\` rather than \`${ k.replace( /@.*/, '' ) }\`. We've standardized on the former.`
			);
		}

		// We want to use `@jest/environment-jsdom-abstract` instead to allow for using newer `jsdom`.
		if ( k.startsWith( 'jest-environment-jsdom@' ) ) {
			throw new Error(
				// prettier-ignore
				`You don't need \`jest-environment-jsdom\`. Our base config in \`tools/js-tools/jest/config.base.js\` already sets up a JSDOM environment from \`tools/js-tools/jest/fix-environment-jsdom.mjs\`, use that instead. pdWQjU-1vl-p2`
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

	for ( const fromPkg of Object.keys( wpPkgs ) ) {
		if ( ! wpPkgFetches[ fromPkg ] ) {
			context.log(
				`pnpmfile hack needs updating: wpPkgs['${ fromPkg }'] was not used. Is it obsolete?`
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
