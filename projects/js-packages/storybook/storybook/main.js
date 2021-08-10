/**
 * External dependencies
 */
const path = require( 'path' );

console.warn("current directory", process.cwd());

const stories = [
	process.env.NODE_ENV !== 'test' && './stories/**/*.@(js|mdx)',
	// '../packages/block-editor/src/**/stories/*.js',
	// '../packages/components/src/**/stories/*.js',
	// '../packages/icons/src/**/stories/*.js',
].filter( Boolean );

const customEnvVariables = {};

const modulesDir = path.join( __dirname, './node_modules' );

// Workaround for Emotion 11
// https://github.com/storybookjs/storybook/pull/13300#issuecomment-783268111
const updateEmotionAliases = ( config ) => ( {
	...config,
	resolve: {
		...config.resolve,
		alias: {
			...config.resolve.alias,
			// '@emotion/core': path.join( modulesDir, '@emotion/core' ),
			// '@emotion/styled': path.join( modulesDir, '@emotion/styled' ),
			'@emotion/styled/base': path.join( modulesDir, '@emotion/styled-base' ),
			// 'emotion-theming': path.join( modulesDir, '@emotion/core' ),
		},
	},
} );

module.exports = {
	stories,
	addons: [
		{
			name: '@storybook/addon-docs',
			options: { configureJSX: true },
		},
		'@storybook/addon-knobs',
		'@storybook/addon-storysource',
		'@storybook/addon-viewport',
		'@storybook/addon-a11y',
	],
	managerWebpack: updateEmotionAliases,
	// Workaround:
	// https://github.com/storybookjs/storybook/issues/12270
	webpackFinal: async ( config ) => {
		// Find the DefinePlugin
		const plugin = config.plugins.find( ( p ) => {
			return p.definitions && p.definitions[ 'process.env' ];
		} );
		// Add custom env variables
		Object.keys( customEnvVariables ).forEach( ( key ) => {
			plugin.definitions[ 'process.env' ][ key ] = JSON.stringify(
				customEnvVariables[ key ]
			);
		} );

		return updateEmotionAliases( config );
	},
};
