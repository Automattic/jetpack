const calypsoBuildPreset = require( '@automattic/calypso-build/babel/default' );
const browserTargets = require( '@wordpress/browserslist-config' );

// Drop IE 11 from Babel bundle; IE 11 support added separately via PHP.
const targets = [ ...browserTargets.filter( target => ! target.includes( 'ie' ) ), 'not ie > 0' ];

module.exports = ( api, opts ) => {
	const defaultConfig = calypsoBuildPreset( api, opts );
	return {
		presets: [
			[
				require.resolve( '@babel/preset-env' ),
				{
					corejs: '3.8.3',
					ignoreBrowserslistConfig: true,
					modules: false,
					targets,
					useBuiltIns: 'usage',
					// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
					exclude: [ 'transform-typeof-symbol' ],
				},
			],
			require.resolve( '@babel/preset-react' ),
			require.resolve( '@babel/preset-typescript' ),
		],
		plugins: defaultConfig.plugins,
	};
};
