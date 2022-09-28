const path = require( 'path' );

const PresetEnv = ( options = {} ) => {
	if ( typeof options.targets === 'undefined' ) {
		const browserslist = require( 'browserslist' );
		const localBrowserslistConfig = browserslist.findConfig( '.' ) || {};
		options.targets = browserslist(
			localBrowserslistConfig.defaults || require( '@wordpress/browserslist-config' )
		);
	}

	return [
		require.resolve( '@babel/preset-env' ),
		{
			// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
			exclude: [ 'transform-typeof-symbol' ],
			...options,
		},
	];
};

module.exports = ( api, opts = {} ) => {
	const ret = {
		sourceType: opts.sourceType || 'unambiguous',
		presets: [],
		plugins: [],
	};

	if ( opts.presetEnv !== false ) {
		ret.presets.push( PresetEnv( opts.presetEnv ) );
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
	if ( opts.pluginProposalClassProperties !== false ) {
		ret.plugins.push( [
			require.resolve( '@babel/plugin-proposal-class-properties' ),
			opts.pluginProposalClassProperties,
		] );
	}
	if ( opts.pluginTransformRuntime !== false ) {
		ret.plugins.push( [
			require.resolve( '@babel/plugin-transform-runtime' ),
			{
				corejs: false, // We polyfill so we don't need core-js.
				regenerator: false,
				absoluteRuntime: path.dirname( __dirname ), // Required when workspace projects are symlinked.
				version: require( '@babel/runtime/package.json' )?.version,
				...opts.pluginTransformRuntime,
			},
		] );
	}
	if ( opts.pluginCalypsoOptimizeI18n !== false ) {
		ret.plugins.push( [
			require.resolve( '@automattic/babel-plugin-preserve-i18n' ),
			opts.pluginPreserveI18n,
		] );
	}

	return ret;
};
