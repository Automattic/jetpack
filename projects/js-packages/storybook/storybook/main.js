/**
 * This file is inspired by https://github.com/WordPress/gutenberg/blob/trunk/storybook/main.js
 */

/**
 * External dependencies
 */
const path = require( 'path' );

const modulesDir = path.join( __dirname, '../node_modules' );

const stories = [
	process.env.NODE_ENV !== 'test' && './stories/**/*.@(js|jsx|mdx)',
	path.join( modulesDir, '@automattic/jetpack-base-styles/stories/*.@(js|jsx|mdx)' ),
	path.join( modulesDir, '@automattic/jetpack-components/components/**/stories/*.@(js|jsx|mdx)' ),
	path.join( modulesDir, '@automattic/jetpack-connection/components/**/stories/*.@(js|jsx|mdx)' ),
].filter( Boolean );

const customEnvVariables = {};

// Workaround for Emotion 11
// https://github.com/storybookjs/storybook/pull/13300#issuecomment-783268111
const updateEmotionAliases = config => ( {
	...config,
	resolve: {
		...config.resolve,
		alias: {
			...config.resolve.alias,
			'@emotion/core': path.join( modulesDir, '@emotion/react' ),
			'@emotion/styled': path.join( modulesDir, '@emotion/styled' ),
			'@emotion/styled-base': path.join( modulesDir, '@emotion/styled' ),
			'emotion-theming': path.join( modulesDir, '@emotion/react' ),
		},
	},
} );

module.exports = {
	core: {
		builder: 'webpack5',
	},
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
		'@storybook/addon-essentials',
	],
	managerWebpack: updateEmotionAliases,
	// Workaround:
	// https://github.com/storybookjs/storybook/issues/12270
	webpackFinal: async config => {
		// Find the DefinePlugin
		const plugin = config.plugins.find( p => {
			return p.definitions && p.definitions[ 'process.env' ];
		} );
		// Add custom env variables
		Object.keys( customEnvVariables ).forEach( key => {
			plugin.definitions[ 'process.env' ][ key ] = JSON.stringify( customEnvVariables[ key ] );
		} );

		const finalConfig = updateEmotionAliases( config );

		return finalConfig;
	},
	refs: {
		gutenberg: {
			title: 'Gutenberg Components',
			url: 'https://wordpress.github.io/gutenberg/',
		},
	},
};
