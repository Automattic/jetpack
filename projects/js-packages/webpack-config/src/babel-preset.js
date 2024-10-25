const path = require( 'path' );

module.exports = ( api, opts = {} ) => {
	const ret = {
		sourceType: opts.sourceType || 'unambiguous',
		presets: [],
		plugins: [],
	};

	let targets = opts.targets;
	if ( ! targets ) {
		const browserslist = require( 'browserslist' );
		const localBrowserslistConfig = browserslist.findConfig( '.' ) || {};
		targets = browserslist(
			localBrowserslistConfig.defaults || require( '@wordpress/browserslist-config' )
		);
	}

	if ( opts.autoWpPolyfill !== false ) {
		if ( opts.presetEnv?.useBuiltIns ) {
			throw new Error( 'Cannot use autoWpPolyfill along with presetEnv.useBuiltIns' );
		}
		if ( opts.pluginTransformRuntime?.corejs ) {
			throw new Error( 'Cannot use autoWpPolyfill along with pluginTransformRuntime.corejs' );
		}

		const importDir = opts.autoWpPolyfill?.absoluteImports ?? path.dirname( __dirname );
		ret.plugins.push(
			[
				require.resolve( 'babel-plugin-polyfill-corejs3' ),
				{
					method: 'usage-global',
					version: require( 'core-js/package.json' ).version,
					absoluteImports: importDir,
					targets: opts.autoWpPolyfill?.targets ?? targets,
					exclude: opts.autoWpPolyfill?.exclude ?? [
						// Ignore excessively strict polyfilling of `Array.prototype.push` to work
						// around an obscure bug involving non-writable arrays.
						// See https://issues.chromium.org/issues/42202623 for the details of the
						// bug that leads to the polyfilling, and which we are choosing to ignore.
						'es.array.push',

						// This is an IE-only feature which we don't use, and don't want to polyfill.
						// @see https://github.com/WordPress/gutenberg/pull/49234
						'web.immediate',
					],
				},
			],
			[
				require.resolve( './babel/replace-polyfills.js' ),
				{
					absoluteImports: importDir,
				},
			]
		);
	}

	if ( opts.presetEnv !== false ) {
		ret.presets.push( [
			require.resolve( '@babel/preset-env' ),
			{
				targets,
				// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
				exclude: [ 'transform-typeof-symbol' ],
				...opts.presetEnv,
			},
		] );
	}
	if ( opts.presetReact !== false ) {
		ret.presets.push( [ require.resolve( '@babel/preset-react' ), opts.presetReact ] );
	}
	if ( opts.presetTypescript !== false ) {
		ret.presets.push( [ require.resolve( '@babel/preset-typescript' ), opts.presetTypescript ] );
	}

	if ( opts.pluginReplaceTextdomain ) {
		ret.plugins.push( [
			require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
			opts.pluginReplaceTextdomain,
		] );
	}
	if ( opts.pluginTransformRuntime !== false ) {
		// babel-plugin-polyfill-corejs3 from autoWpPolyfill otherwise makes it want @babel/runtime-corejs3
		const optModuleName =
			opts.autoWpPolyfill !== false ? { moduleName: '@babel/runtime' } : undefined;

		ret.plugins.push( [
			require.resolve( '@babel/plugin-transform-runtime' ),
			{
				corejs: false, // We polyfill so we don't need core-js.
				regenerator: false,
				absoluteRuntime: path.dirname( __dirname ), // Required when workspace projects are symlinked.
				version: require( '@babel/runtime/package.json' )?.version,
				...optModuleName,
				...opts.pluginTransformRuntime,
			},
		] );
	}
	if ( opts.pluginPreserveI18n !== false ) {
		ret.plugins.push( [
			require.resolve( '@automattic/babel-plugin-preserve-i18n' ),
			opts.pluginPreserveI18n,
		] );
	}

	return ret;
};
