const path = require( 'path' );
const wpPolyfillModules = require( './babel/wp-polyfill-modules.json' ).modules;

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = ! isProduction;

/**
 * Normalize a polyfill's name.
 *
 * @param {string} name - The polyfill name to normalize.
 *
 * @return {string} The normalized name.
 */
function normalizePolyfillName( name ) {
	return name.replace( /^esnext\./, 'es.' );
}

const normalizedPolyfillModules = wpPolyfillModules.map( normalizePolyfillName );

module.exports = ( api, opts = {} ) => {
	const ret = {
		sourceType: opts.sourceType || 'unambiguous',
		presets: [],
		plugins: [],
		overrides: [],
	};

	/**
	 * Decide whether a polyfill should be injected, based on exclusions and support.
	 *
	 * @param {string}  name                - The polyfill name.
	 * @param {boolean} defaultShouldInject - Babel's decision on whether the polyfill should be injected, based on browser support alone.
	 *
	 * @return {boolean} Whether the polyfill should be injected.
	 */
	function shouldInjectPolyfill( name, defaultShouldInject ) {
		if ( ! defaultShouldInject ) {
			return false;
		}

		// The `exclude` option isn't compatible with `shouldInjectPolyfill`, so we need
		// to check for exclusions ourselves.
		// `include` isn't compatible either, but that's not an option on this preset.
		const exclusions = ( opts.autoWpPolyfill?.exclude ?? [] ).map( normalizePolyfillName );
		if ( exclusions.includes( normalizePolyfillName( name ) ) ) {
			return false;
		}

		// Only inject if the polyfill is supported by `wp-polyfill`.
		return normalizedPolyfillModules.includes( normalizePolyfillName( name ) );
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
					isDevelopment,
					shouldInjectPolyfill,
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
				bugfixes: true,
				// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
				exclude: [ 'transform-typeof-symbol' ],
				...opts.presetEnv,
			},
		] );
	}
	if ( opts.presetReact !== false ) {
		ret.overrides.push( {
			test: /\.[jt]sx$/,
			presets: [
				[ require.resolve( '@babel/preset-react' ), opts.presetReact ?? { runtime: 'automatic' } ],
			],
		} );
	}
	if ( opts.presetTypescript !== false ) {
		ret.presets.push( [
			require.resolve( '@babel/preset-typescript' ),
			opts.presetTypescript ?? { allowDeclareFields: true },
		] );
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

	// React Fast Refresh - only in development mode when explicitly enabled
	if (
		isDevelopment &&
		opts.pluginReactRefresh !== false &&
		process.env.WEBPACK_SERVE === 'true'
	) {
		ret.plugins.push( [ require.resolve( 'react-refresh/babel' ), opts.pluginReactRefresh ] );
	}

	return ret;
};
