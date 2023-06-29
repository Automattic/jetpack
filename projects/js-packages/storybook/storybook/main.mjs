/**
 * This file is inspired by https://github.com/WordPress/gutenberg/blob/trunk/storybook/main.js
 */

import path from 'node:path';
import { fileURLToPath } from 'url';
import postcssPlugins from '@wordpress/postcss-plugins-preset';
import { EsbuildPlugin } from 'esbuild-loader';
import remarkGfm from 'remark-gfm';
import { ProgressPlugin } from 'webpack';
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
						// Workaround https://github.com/storybookjs/storybook/issues/23217
						providerImportSource: require.resolve( '@storybook/addon-docs/mdx-react-shim' ),
					},
				},
			},
		},
		'@storybook/addon-storysource',
		'@storybook/addon-a11y',
		'@storybook/addon-essentials',
		'storybook-addon-mock',
	],
	// Workaround:
	// https://github.com/storybookjs/storybook/issues/12270
	webpackFinal: async config => {
		// Remove ProgressPlugin and source maps in production builds.
		if ( process.env.NODE_ENV === 'production' ) {
			config.devtool = false;
			config.plugins = config.plugins.filter( p => ! ( p instanceof ProgressPlugin ) );
		}

		// Use esbuild to minify.
		config.optimization.minimizer = [
			new EsbuildPlugin( {
				target: 'es2018',
			} ),
		];

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
		// Workaround https://github.com/storybookjs/storybook/issues/21710
		// from https://storybook.js.org/docs/react/faq#how-do-i-fix-module-resolution-while-using-pnpm-plug-n-play
		name: path.dirname( require.resolve( '@storybook/react-webpack5/package.json' ) ),
		options: {},
	},
	docs: {
		autodocs: true,
	},
	staticDirs: [ '../public' ],
};
export default sbconfig;
