/**
 * This file is inspired by https://github.com/WordPress/gutenberg/blob/trunk/storybook/main.js
 */

import path from 'node:path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';
import { NodePackageImporter } from 'sass-embedded';
import jetpackConfig from './jetpackConfig.js';
import { projects } from './projects.js';

const __dirname = import.meta.dirname;
const premiumAnalyticsPackagesDir = path.join(
	__dirname,
	'../../../packages/premium-analytics/packages'
);

const storiesSearch = '*.@(mdx|@(story|stories).@(js|jsx|ts|tsx))';
const stories = [ process.env.NODE_ENV !== 'test' && `./stories/**/${ storiesSearch }` ]
	.concat(
		projects.map( project =>
			path.relative( __dirname, `${ project }/**/stories/${ storiesSearch }` )
		)
	)
	.filter( Boolean );

const sbconfig = {
	stories,
	addons: [
		{
			name: '@storybook/addon-docs',
			options: {
				mdxPluginOptions: {
					mdxCompileOptions: {
						remarkPlugins: [ remarkGfm ],
					},
				},
			},
		},
		'@storybook/addon-a11y',
		'@storybook/addon-vitest',
	],
	viteFinal: async config => {
		const { mergeConfig, transformWithOxc } = await import( 'vite' );
		return mergeConfig( config, {
			plugins: [
				// This would normally be in vite.config.js, but we don't have one of those.
				react( { include: /\.(m?[jt]sx?|cjs)$/ } ),

				// Our webpack setup processes .js files as jsx. Have vite do it too.
				{
					name: 'jsx-in-js',
					enforce: 'pre',
					async transform( code, id ) {
						if ( ! id.includes( 'node_modules' ) && /\.[cm]?js$/.test( id ) ) {
							return transformWithOxc( code, id, { lang: 'jsx' } );
						}
					},
				},

				// Premium Analytics internal packages point `module` to ignored build artifacts.
				// In Storybook, resolve bare package imports to TS source so local stale builds
				// cannot diverge from the code being edited.
				{
					name: 'premium-analytics-source-package-imports',
					enforce: 'pre',
					async resolveId( id, importer ) {
						const match = id.match( /^@jetpack-premium-analytics\/([^/]+)$/ );

						if ( ! match ) {
							return;
						}

						return this.resolve(
							path.join( premiumAnalyticsPackagesDir, match[ 1 ], 'src/index.ts' ),
							importer,
							{ skipSelf: true }
						);
					},
				},

				// Stub `@automattic/jetpack-config`, the whole `jetpackConfig` thing confuses Storybook/vite/vitest/esbuild/rolldown/etc to no end.
				// If you're trying to use those tools for something else, consider somehow fixing `@automattic/jetpack-config` instead of perpetuating this hack.
				{
					name: 'virtual-jetpack-config',
					enforce: 'pre',
					resolveId( id ) {
						if ( id === '@automattic/jetpack-config' ) return '\0@automattic/jetpack-config';
					},
					load( id ) {
						if ( id === '\0@automattic/jetpack-config' )
							return `
								const jetpackConfig = ${ JSON.stringify( jetpackConfig ) };
								export const jetpackConfigHas = key => Object.hasOwn( jetpackConfig, key );
								export const jetpackConfigGet = key => {
									if ( ! jetpackConfigHas( key ) ) {
										throw '@automattic/jetpack-config: "' + key + '" is not defined in Storybook.';
									}
									return jetpackConfig[ key ];
								};
							`;
					},
				},

				// Handle packages/search's weird `resolve.modules` setting.
				{
					name: 'search-dashboard-modules',
					async resolveId( id, importer ) {
						if (
							( id.startsWith( 'components/' ) || id === 'store' || id.startsWith( 'store/' ) ) &&
							importer?.includes( '/search/src/dashboard/' )
						) {
							const dashboardDir = path.join( __dirname, '../../../packages/search/src/dashboard' );
							return this.resolve( path.join( dashboardDir, id ), importer, {
								skipSelf: true,
							} );
						}
					},
				},
			],
			optimizeDeps: {
				rolldownOptions: {
					// Tell the dep pre-bundling scanner to treat .js as JSX.
					moduleTypes: { '.js': 'jsx' },
				},
			},
			server: {
				watch: {
					// Vite doesn't like our vendor symlink loops.
					ignored: [ '**/vendor/**', '**/jetpack_vendor/**' ],
				},
			},
			css: {
				preprocessorOptions: {
					scss: {
						api: 'modern-compiler',
						loadPaths: [
							'node_modules',
							// Handle packages/search's weird `resolve.modules` setting for scss resolution too.
							path.join( __dirname, '../../../packages/search/src/dashboard' ),
						],
						// Boost-specific alias. Needs separate configuration from the below, sigh.
						importers: [
							new NodePackageImporter(),
							{
								findFileUrl( url ) {
									if ( url.startsWith( '$css/' ) ) {
										return new URL(
											'../../../plugins/boost/app/assets/src/css/' + url.slice( 5 ),
											import.meta.url
										);
									}
									return null;
								},
							},
						],
					},
				},
			},
			build: {
				chunkSizeWarningLimit: Infinity, // We don't care.
			},
			resolve: {
				conditions: [ 'jetpack:src' ],
				// Somehow or other vitest blows up trying to process `node_modules/storybook/dist/manager-api/index.js` unless we set this.
				dedupe: [ 'react', 'react-dom' ],
				alias: {
					...config.resolve?.alias,

					// Premium Analytics internal subpath imports. Bare package imports are
					// resolved to TS source by the plugin above.
					'@jetpack-premium-analytics': premiumAnalyticsPackagesDir,

					// Boost-specific aliases
					$lib: path.join( __dirname, '../../../plugins/boost/app/assets/src/js/lib' ),
					$features: path.join( __dirname, '../../../plugins/boost/app/assets/src/js/features' ),
					$layout: path.join( __dirname, '../../../plugins/boost/app/assets/src/js/layout' ),
					$svg: path.join( __dirname, '../../../plugins/boost/app/assets/src/js/svg' ),
					$css: path.join( __dirname, '../../../plugins/boost/app/assets/src/css' ),
					$images: path.join( __dirname, '../../../plugins/boost/app/assets/static/images' ),

					// Stuff @wordpress/block-editor → postcss probes but doesn't need.
					// Without these, vitest dumps lots of complaints about https://vite.dev/guide/troubleshooting#module-externalized-for-browser-compatibility.
					fs: path.join( __dirname, 'empty.js' ),
					path: path.join( __dirname, 'empty.js' ),
					url: path.join( __dirname, 'empty.js' ),
					'source-map-js': path.join( __dirname, 'empty.js' ),
				},
			},
		} );
	},
	refs: {
		gutenberg: {
			title: 'Gutenberg Components',
			url: 'https://wordpress.github.io/gutenberg/',
		},
	},
	framework: {
		// Workaround https://github.com/storybookjs/storybook/issues/21710
		// from https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
		name: path.dirname(
			fileURLToPath( import.meta.resolve( '@storybook/react-vite/package.json' ) )
		),
		options: {},
	},
	typescript: {
		reactDocgen: 'react-docgen-typescript',
	},
	staticDirs: [ '../public' ],
};
export default sbconfig;
