/**
 * This file is inspired by https://github.com/WordPress/gutenberg/blob/trunk/storybook/main.js
 */

import { fileURLToPath } from 'url';
import postcssPlugins from '@wordpress/postcss-plugins-preset';
import remarkGfm from 'remark-gfm';
import projects from './projects.js';

const storiesSearch = '*.@(mdx|@(story|stories).@(js|jsx|ts|tsx))';
const stories = [ process.env.NODE_ENV !== 'test' && `./stories/**/${ storiesSearch }` ]
	.concat( projects.map( project => `${ project }/**/stories/${ storiesSearch }` ) )
	.filter( Boolean );

const includePaths = [ fileURLToPath( new URL( '.', import.meta.url ) ) ].concat( projects );

const customEnvVariables = {};

const sbconfig = {
	stories,
	addons: [
		{
			name: '@storybook/addon-docs',
			options: {
				configureJSX: true,
				mdxPluginOptions: {
					mdxCompileOptions: {
						remarkPlugins: [ remarkGfm ],
					},
				},
			},
		},
		'@storybook/addon-storysource',
		'@storybook/addon-viewport',
		'@storybook/addon-a11y',
		'@storybook/addon-essentials',
		'storybook-addon-mock',
		'storybook-addon-turbo-build',
	],
	// Workaround:
	// https://github.com/storybookjs/storybook/issues/12270
	webpackFinal: async config => {
		// Find the DefinePlugin
		const plugin = config.plugins.find( p => p.definitions?.[ 'process.env' ] );
		// Add custom env variables
		Object.keys( customEnvVariables ).forEach( key => {
			plugin.definitions[ 'process.env' ][ key ] = JSON.stringify( customEnvVariables[ key ] );
		} );

		// Add sass handling.
		config.module.rules.push( {
			test: /\.scss$/,
			use: [
				'style-loader',
				'css-loader',
				{
					loader: 'postcss-loader',
					options: {
						postcssOptions: {
							ident: 'postcss',
							plugins: postcssPlugins,
						},
					},
				},
				'sass-loader',
			],
			include: includePaths,
		} );

		// Conform to Webpack module resolution rule for Search dashboard.
		config.resolve.modules.push(
			fileURLToPath( new URL( '../../../packages/search/src/dashboard/', import.meta.url ) )
		);

		return config;
	},
	refs: {
		gutenberg: {
			title: 'Gutenberg Components',
			url: 'https://wordpress.github.io/gutenberg/',
		},
	},
	framework: {
		name: '@storybook/react-webpack5',
		options: {},
	},
	docs: {
		autodocs: true,
	},
	staticDirs: [ '../public' ],
};
export default sbconfig;
