// Packages we need to copy versions from for `@wordpress/dataviews/wp`.
const wpPkgs = [
	[ '@wordpress/components', 'change-case' ],
	[ '@wordpress/components', 'colord' ],
	[ '@wordpress/components', 'date-fns' ],
	[ '@wordpress/components', 'deepmerge' ],
	[ '@wordpress/components', '@emotion/cache' ],
	[ '@wordpress/components', '@emotion/css' ],
	[ '@wordpress/components', '@emotion/react' ],
	[ '@wordpress/components', '@emotion/styled' ],
	[ '@wordpress/components', '@emotion/utils' ],
	[ '@wordpress/components', 'fast-deep-equal' ],
	[ '@wordpress/components', '@floating-ui/react-dom' ],
	[ '@wordpress/components', 'framer-motion' ],
	[ '@wordpress/components', 'highlight-words-core' ],
	[ '@wordpress/components', 'is-plain-object' ],
	[ '@wordpress/components', 'memize' ],
	[ '@wordpress/components', '@use-gesture/react' ],
	[ '@wordpress/components', 'uuid' ],
	[ '@wordpress/components', '@wordpress/date' ],
	[ '@wordpress/components', '@wordpress/hooks' ],
	[ '@wordpress/components', 'react-colorful' ],
	[ '@wordpress/components', 'react-day-picker' ],
	[ '@wordpress/element', 'react-dom' ],
	[ '@wordpress/data', 'use-memo-one' ],
	[ '@wordpress/ui', '@base-ui/react' ],
	[ '@wordpress/ui', '@wordpress/theme', 'colorjs.io' ],
];
const wpPkgFetches = {};
const addWpPkgDep = async ( pkg, fromPkg, ver, deplist ) => {
	const [ dep, ...rest ] = deplist;

	if ( ! wpPkgFetches[ fromPkg ] ) {
		wpPkgFetches[ fromPkg ] = fetch( `https://registry.npmjs.org/${ fromPkg }` ).then( r =>
			r.json()
		);
	}
	const deps = ( await wpPkgFetches[ fromPkg ] ).versions[ ver ].dependencies;

	if ( rest.length > 0 ) {
		if ( deps[ dep ] === undefined ) {
			// Old version of package lacks a new dep? We'll check in afterAllResolved for it being an old dep instead.
			return;
		}
		const ver2 = deps[ dep ].replace( /^\^/, '' ).replace( /\+[0-9a-f]+$/, '' );
		await addWpPkgDep( pkg, dep, ver2, rest );
	} else {
		if ( deps[ dep ] === undefined ) {
			// prettier-ignore
			throw new Error( `pnpmfile hack needs updating, ${ fromPkg } ${ ver } doesn't depend on ${ dep } anymore?` );
		}
		pkg.optionalDependencies[ dep ] = deps[ dep ];
	}
};

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
	if (
		pkg.name === '@wordpress/icons' &&
		! pkg.dependencies?.react &&
		! pkg.peerDependencies?.react
	) {
		pkg.peerDependencies.react = '^18';
	}

	// We need to add the missing deps for `@wordpress/dataviews` because
	// the build fails when using pnpm with hoisting.
	// @see https://github.com/WordPress/gutenberg/issues/67864
	if ( pkg.name === '@wordpress/dataviews' ) {
		for ( const deplist of wpPkgs ) {
			const [ fromPkg, ...rest ] = deplist;
			if ( ! pkg.dependencies[ fromPkg ] ) {
				// Old version of dataviews lacks a new dep? We'll check in afterAllResolved for it being an old dep instead.
				continue;
			}
			const ver = pkg.dependencies[ fromPkg ].replace( /^\^/, '' ).replace( /\+[0-9a-f]+$/, '' );
			await addWpPkgDep( pkg, fromPkg, ver, rest );
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
	if ( pkg.name === '@wordpress/babel-preset-default' ) {
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

	// @wordpress/stylelint-config is still CJS, which caps how high we can upgrade.
	// https://github.com/WordPress/gutenberg/issues/75047
	if ( pkg.name === '@wordpress/stylelint-config' ) {
		if ( pkg.dependencies?.[ '@stylistic/stylelint-plugin' ]?.startsWith( '^3.' ) ) {
			pkg.dependencies[ '@stylistic/stylelint-plugin' ] = '^5';
		}
		if ( pkg.dependencies?.[ 'stylelint-config-recommended' ]?.startsWith( '^14.' ) ) {
			pkg.dependencies[ 'stylelint-config-recommended' ] = '^17'; // 18 is ESM
		}
		if ( pkg.dependencies?.[ 'stylelint-config-recommended-scss' ]?.startsWith( '^14.' ) ) {
			pkg.dependencies[ 'stylelint-config-recommended-scss' ] = '^16'; // 17 is ESM
		}
		if ( pkg.peerDependencies?.stylelint?.startsWith( '^16.' ) ) {
			pkg.peerDependencies.stylelint = '^17';
		}
		if ( pkg.peerDependencies?.[ 'stylelint-scss' ]?.startsWith( '^6.' ) ) {
			pkg.peerDependencies[ 'stylelint-scss' ] = '^7';
		}
	}
	if ( pkg.name === '@wordpress/theme' && pkg.peerDependencies?.stylelint ) {
		pkg.peerDependencies.stylelint = pkg.peerDependencies.stylelint.replace( /^(?:\^|>=)?/, '>=' );
	}

	// Make sure @wordpress/eslint-plugin and @wordpress/stylelint-config gets whatever @wordpress/theme is installed.
	if (
		( pkg.name === '@wordpress/stylelint-config' || pkg.name === '@wordpress/eslint-plugin' ) &&
		pkg.dependencies?.[ '@wordpress/theme' ]
	) {
		delete pkg.dependencies[ '@wordpress/theme' ];
		pkg.peerDependencies[ '@wordpress/theme' ] = '*';
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
	// https://github.com/jestjs/jest/issues/15236
	if (
		( pkg.name === 'babel-jest' || pkg.name === '@jest/transform' ) &&
		pkg.dependencies[ 'babel-plugin-istanbul' ] === '^7.0.1'
	) {
		pkg.dependencies[ 'babel-plugin-istanbul' ] = '^8.0.0';
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

	// Outdated, vulnerable dep. Seems to work with the updated version.
	// https://github.com/istanbuljs/load-nyc-config/issues/26
	if (
		pkg.name === '@istanbuljs/load-nyc-config' &&
		pkg.dependencies?.[ 'js-yaml' ] === '^3.13.1'
	) {
		pkg.dependencies[ 'js-yaml' ] = '^4.2.0';
	}

	// Glob decided to deprecate everything <12, even though tons of stuff still depends on older versions.
	// On the plus side, the net change from v10 to v13 is deleting the CLI from the package.
	if ( pkg.dependencies?.glob?.match( /^\^1[0-2](?:\.\d+)*$/ ) ) {
		pkg.dependencies.glob = '^13';
	}
	if ( pkg.peerDependencies?.glob?.match( /^\^1[0-2](?:\.\d+)*$/ ) ) {
		pkg.dependencies.glob = '^13';
	}

	// Temporarily outdated deps. Storybook is already updated upstream.
	if (
		pkg.dependencies?.esbuild?.match( /\^0\.27/ ) &&
		! pkg.dependencies?.esbuild?.match( /\^0\.28/ )
	) {
		pkg.dependencies.esbuild += ' || ^0.28';
	}

	// We don't use this in our E2E runs, and it brings in a lot of extraneous deps (and CVE-2026-54285).
	// (if you bring this back, do it by reverting the pnpmfile changes in commit e90548654eacfa7493388331dd644a6f927d16c5, don't just delete this bit).
	if ( pkg.name === '@wordpress/e2e-test-utils-playwright' ) {
		pkg.dependencies.lighthouse = 'workspace:@automattic/_jetpack-no-lighthouse@*';
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

	// Outdated eslint deps.
	const eslintOldPkgs = new Set( [
		'eslint-plugin-import', // https://github.com/import-js/eslint-plugin-import/issues/3227
		'eslint-plugin-jsx-a11y', // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1075
		'eslint-plugin-react', // https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
		'@babel/eslint-parser', // https://github.com/babel/babel/issues/17951
		'eslint-plugin-jest-dom', // https://github.com/testing-library/eslint-plugin-jest-dom/issues/418
	] );
	if ( eslintOldPkgs.has( pkg.name ) ) {
		for ( const p of [ 'eslint' ] ) {
			if ( ! pkg.peerDependencies?.[ p ] ) {
				continue;
			}

			if (
				pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^9|9\.x)/ ) &&
				! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^10|10\.x)/ )
			) {
				pkg.peerDependencies[ p ] += ' || ^10';
			}
		}
	}

	// Apparently this for some reason includes a vite plugin, instead of that being a separate package.
	// And it depends on the wrong version of vite. Since we mostly don't use vite anyway (just in storybook),
	// it should be safe to broaden the dep.
	if ( pkg.name === '@wordpress/theme' && pkg.peerDependencies?.vite ) {
		pkg.peerDependencies.vite = '*';
	}

	// We use this under tsdown (Rolldown), not Rollup. The `rollup` peer is only used for one TypeScript type, and it being missing apparently makes no difference in our usage.
	// @see https://github.com/mjeanroy/rollup-plugin-license/issues/2110
	if ( pkg.name === 'rollup-plugin-license' ) {
		pkg.peerDependenciesMeta ??= {};
		pkg.peerDependenciesMeta.rollup = { optional: true };
	}

	// It assumes hoisting to find its plugins. Sigh. Add peer deps for the plugins we use.
	// https://github.com/ai/size-limit/issues/366
	if ( pkg.name === 'size-limit' ) {
		pkg.peerDependencies ??= {};
		pkg.peerDependencies[ '@size-limit/file' ] = '*';
		pkg.peerDependenciesMeta ??= {};
		pkg.peerDependenciesMeta[ '@size-limit/file' ] = { optional: true };
	}

	// Override @automattic/launchpad outdated peer dependencies.
	if ( pkg.name === '@automattic/launchpad' ) {
		if (
			pkg.peerDependencies?.[ '@wordpress/element' ] &&
			pkg.peerDependencies?.[ '@wordpress/element' ].startsWith( '^6.' )
		) {
			pkg.peerDependencies[ '@wordpress/element' ] = '^8';
		}
		if (
			pkg.peerDependencies?.[ '@wordpress/i18n' ] &&
			pkg.peerDependencies?.[ '@wordpress/i18n' ].startsWith( '^5.' )
		) {
			pkg.peerDependencies[ '@wordpress/i18n' ] = '^6';
		}
	}

	// Outdated peer dependency because Gutenberg is still on node 20.
	if (
		pkg.name === '@wordpress/e2e-test-utils-playwright' &&
		! pkg.peerDependencies?.[ '@types/node' ]?.includes( '^24.' )
	) {
		pkg.peerDependencies[ '@types/node' ] += ' || ^24.0.0';
	}

	// Outdated dependency because Calypso is still on node 22.
	if (
		pkg.name === '@automattic/calypso-config' &&
		! pkg.dependencies?.[ '@types/node' ]?.includes( '^24.' )
	) {
		pkg.dependencies[ '@types/node' ] += ' || ^24.0.0';
	}

	// Should be an optional peer dep, but isn't.
	// Since it already has a (non-optional 🙄) peer dep on sass-embedded, we can just delete the sass dep.
	if ( pkg.name === 'esbuild-sass-plugin' && pkg.dependencies.sass ) {
		delete pkg.dependencies.sass;
	}

	// These packages went ESM-only in their latest versions, which breaks `@wordpress/stylelint-config`.
	// So we need to keep older CJS versions for now, while bumping their stylelint peer deps.
	// https://github.com/WordPress/gutenberg/issues/75047
	if (
		( pkg.name === 'stylelint-config-recommended' ||
			pkg.name === 'stylelint-config-recommended-scss' ||
			pkg.name === '@stylistic/stylelint-plugin' ||
			pkg.name === 'stylelint-scss' ) &&
		pkg.peerDependencies?.stylelint?.startsWith( '^16.' )
	) {
		pkg.peerDependencies.stylelint = '^17';
	}

	// Having copies with and without the peer dep tends to break tests. So let's just make it non-optional.
	if ( pkg.name === '@wordpress/data' ) {
		delete pkg.peerDependenciesMeta?.[ '@types/react' ];
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

	for ( const deplist of wpPkgs ) {
		for ( const dep of deplist.slice( 0, deplist.length - 1 ) ) {
			if ( ! wpPkgFetches[ dep ] ) {
				context.log(
					// prettier-ignore
					`pnpmfile hack needs updating: wpPkgs entry [ ${ deplist.join( ', ' ) } ] was not used. Is it obsolete?`
				);
			}
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
