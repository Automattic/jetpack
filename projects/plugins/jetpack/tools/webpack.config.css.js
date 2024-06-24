/**
 * All of this exists to compile SASS and minify CSS outside the context of a JavaScript bundle.
 * And a lot of that happens in a very legacy manner.
 *
 * Ideally all this CSS should instead be imported into the relevant JS so webpack will bundle it that way
 * and we can load it using `Assets::register_module()` instead of the ad hoc manner it's done currently.
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const { glob } = require( 'glob' );

const webpack = jetpackWebpackConfig.webpack;
const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '..' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ path.resolve( __dirname, '../_inc/client' ), 'node_modules' ],
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	node: {},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { plugins: [ require( 'autoprefixer' ) ] },
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								// The minifier will minify if necessary.
								outputStyle: 'expanded',
							},
						},
					},
				],
			} ),

			// Leave fonts and images in place.
			{
				test: /\.(eot|ttf|woff|png|svg)$/i,
				type: 'asset/resource',
				generator: {
					emit: false,
					filename: '[file]',
				},
			},
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: false,
			I18nLoaderPlugin: false,
			I18nCheckPlugin: false,
		} ),
		// Delete the dummy JS files Webpack would otherwise create.
		new RemoveAssetWebpackPlugin( {
			assets: /\.js(\.map)?$/,
		} ),
	],
};

// A bunch of the CSS here expects the RTL version to be named like "module-rtl.css" and "module-rtl.min.css"
// rather than "module.rtl.css" and "module.min.rtl.css" like our Webpack config does it.
// This minimal plugin renames the assets to conform to that style.
const RenamerPlugin = {
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( 'Renamer', compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: 'Renamer',
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
					additionalAssets: true,
				},
				assets => {
					for ( const [ name, asset ] of Object.entries( assets ) ) {
						const m = name.match( /^(.*?)((?:\.min)?)\.rtl\.css$/ );
						if ( m ) {
							delete assets[ name ];
							assets[ `${ m[ 1 ] }-rtl${ m[ 2 ] }.css` ] = asset;
						}
					}
				}
			);
		} );
	},
};

// CSS that's built in almost a normal way.
const entries = {
	'_inc/build/style.min': path.join( __dirname, '../_inc/client', 'scss/style.scss' ),
};

// CSS that needs to have the rtl files renamed using the above RenamerPlugin.
const weirdRtlEntries = {
	'css/jetpack': [
		// When making changes to that list, you must also update $concatenated_style_handles in class.jetpack.php.
		'modules/carousel/swiper-bundle.css',
		'modules/carousel/jetpack-carousel.css',
		'jetpack_vendor/automattic/jetpack-forms/src/contact-form/css/grunion.css',
		'modules/infinite-scroll/infinity.css',
		'modules/likes/style.css',
		'modules/related-posts/related-posts.css',
		'modules/sharedaddy/sharing.css',
		'modules/shortcodes/css/slideshow-shortcode.css',
		'modules/shortcodes/css/style.css', // TODO: Should be renamed to shortcode-presentations
		'modules/shortcodes/css/quiz.css',
		'modules/subscriptions/subscriptions.css',
		'modules/theme-tools/responsive-videos/responsive-videos.css',
		'modules/theme-tools/social-menu/social-menu.css',
		'modules/tiled-gallery/tiled-gallery/tiled-gallery.css',
		'modules/widgets/wordpress-post-widget/style.css',
		'modules/widgets/gravatar-profile.css',
		'modules/widgets/goodreads/css/goodreads.css',
		'modules/widgets/social-media-icons/style.css',
		'modules/widgets/top-posts/style.css',
		'modules/widgets/image-widget/style.css',
		'modules/widgets/my-community/style.css',
		'modules/widgets/authors/style.css',
		'modules/wordads/css/style.css',
		'modules/widgets/eu-cookie-law/style.css',
		'modules/widgets/flickr/style.css',
		'modules/widgets/instagram/instagram.css',
		'jetpack_vendor/automattic/jetpack-search/src/widgets/css/search-widget-frontend.css',
		'modules/widgets/simple-payments/style.css',
		'modules/widgets/social-icons/social-icons.css',
		'modules/widgets/milestone/milestone-widget.css',
		'modules/subscriptions/subscribe-modal/subscribe-modal.css',
		'modules/subscriptions/subscribe-overlay/subscribe-overlay.css',
	].map( n => path.join( __dirname, '..', n ) ),
};

// Non-minified CSS, that also needs to have the rtl files renamed using the above RenamerPlugin.
const weirdRtlNominEntries = {};

// Admin CSS files to insert into weirdRtlNominEntries and weirdRtlEntries.
for ( const name of [
	'modules/custom-post-types/comics/comics',
	'modules/shortcodes/css/recipes',
	'modules/shortcodes/css/recipes-print',
	'modules/shortcodes/css/slideshow-shortcode',
	'modules/custom-css/csstidy/cssparse',
	'modules/custom-css/csstidy/cssparsed',
	'modules/custom-css/custom-css/css/codemirror',
	'modules/post-by-email/post-by-email',
	'modules/sharedaddy/admin-sharing',
	'modules/videopress/videopress-admin',
	'modules/videopress/css/editor',
	'modules/videopress/css/videopress-editor-style',
	'modules/widget-visibility/widget-conditions/widget-conditions',
	'modules/widgets/gallery/css/admin',
	'modules/sso/jetpack-sso-login',
	'modules/sso/jetpack-sso-admin-create-user',
	'modules/masterbar/admin-menu/admin-menu',
	'modules/masterbar/admin-menu/admin-menu-nav-unification',
] ) {
	weirdRtlNominEntries[ name ] = path.join( __dirname, '..', name + '.css' );
	weirdRtlEntries[ name + '.min' ] = path.join( __dirname, '..', name + '.css' );
}

// Weird frontend CSS files, only a minified rtl is built (and without the ".min" extension).
// The ltr version is apparently used unminified.
for ( const name of [
	'modules/carousel/jetpack-carousel',
	'modules/related-posts/related-posts',
	'modules/shortcodes/css/recipes',
	'modules/shortcodes/css/recipes-print',
	'modules/tiled-gallery/tiled-gallery/tiled-gallery',
	'modules/theme-tools/compat/twentynineteen',
	'modules/theme-tools/compat/twentytwenty',
	'modules/theme-tools/compat/twentytwentyone',
] ) {
	weirdRtlEntries[ name ] = path.join( __dirname, '..', name + '.css' );
}

// Calypso scss to compile.
// prettier-ignore
for ( const file of glob
	.sync( 'modules/calypsoify/*.scss' )
	.filter( n => ! path.basename( n ).startsWith( '_' ) )
) {
	weirdRtlEntries[ file.substring( 0, file.length - 5 ) + '.min' ] = './' + file;
}

// General scss to compile.
// prettier-ignore
for ( const file of glob
	.sync( 'scss/*.scss' )
	.filter( n => ! path.basename( n ).startsWith( '_' ) )
) {
	weirdRtlNominEntries[ 'css/' + file.substring( 5, file.length - 5 ) ] = './' + file;
	weirdRtlEntries[ 'css/' + file.substring( 5, file.length - 5 ) + '.min' ] = './' + file;
}

module.exports = [
	{
		...sharedWebpackConfig,
		entry: entries,
	},
	{
		...sharedWebpackConfig,
		entry: weirdRtlEntries,
		plugins: [
			...sharedWebpackConfig.plugins,
			// In some cases an output filename is the same as the input. Don't overwrite in that case.
			new RemoveAssetWebpackPlugin( {
				assets: Object.values( weirdRtlEntries )
					.filter( n => typeof n === 'string' )
					.map( n => path.relative( path.dirname( __dirname ), n ) ),
			} ),
			RenamerPlugin,
		],
	},
	{
		...sharedWebpackConfig,
		entry: weirdRtlNominEntries,
		optimization: {
			...sharedWebpackConfig.optimization,
			minimize: false,
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			// In some cases an output filename is the same as the input. Don't overwrite in that case.
			new RemoveAssetWebpackPlugin( {
				assets: Object.values( weirdRtlNominEntries )
					.filter( n => typeof n === 'string' )
					.map( n => path.relative( path.dirname( __dirname ), n ) ),
			} ),
			RenamerPlugin,
		],
	},
];
