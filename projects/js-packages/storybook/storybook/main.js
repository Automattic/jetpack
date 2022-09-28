/**
 * This file is inspired by https://github.com/WordPress/gutenberg/blob/trunk/storybook/main.js
 */

const path = require( 'path' );
const projects = require( './projects' );

const modulesDir = path.join( __dirname, '../node_modules' );

const storiesSearch = '*.@(js|jsx|mdx|ts|tsx)';

const stories = [ process.env.NODE_ENV !== 'test' && `./stories/**/${ storiesSearch }` ]
	.concat( projects.map( project => `${ project }/**/stories/${ storiesSearch }` ) )
	.filter( Boolean );

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
		'@storybook/addon-storysource',
		'@storybook/addon-viewport',
		'@storybook/addon-a11y',
		'@storybook/addon-essentials',
		'storybook-addon-turbo-build',
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

		// Conform to Webpack module resolution rule for Search dashboard.
		finalConfig.resolve.modules.push(
			path.join( __dirname, '../../../packages/search/src/dashboard/' )
		);

		return finalConfig;
	},
	refs: {
		gutenberg: {
			title: 'Gutenberg Components',
			url: 'https://wordpress.github.io/gutenberg/',
		},
	},
};
