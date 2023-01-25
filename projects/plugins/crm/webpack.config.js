const path = require( 'path' );
const glob = require( 'glob' );
const RemovePlugin = require( 'remove-files-webpack-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );

const sassPattern = '**/sass/**/*.scss';
const jsPattern = '**/js/**/*.js';
const alwaysIgnoredFiles = [
	'**/js/**/*.min.js',
	'**/sass/**/_*.scss',
	'**/node_modules/**',
	'**/vendor/**',
	'**/tests/**',
	'**/lib/**',
];

/**
 * Returns an array the full list of our '.js' files in the form:
 * [ './full/path/file' => './full/path/file.js'].
 * This list is generated using the above defined jsPattern and alwaysIgnoredFiles.
 *
 * @returns {Array} The list of js files that must be minified.
 */
function getJsEntries() {
	const entries = {};
	glob.sync( jsPattern, { ignore: alwaysIgnoredFiles } ).forEach( file => {
		entries[ './' + file.substring( 0, file.length - '.js'.length ) ] = './' + file;
	} );

	return entries;
}

/**
 * Returns an array the full list of our '.scss' files in the form:
 * [ './full/path/file' => './full/path/file.scss'].
 * This list is generated using the above defined sassPattern and alwaysIgnoredFiles.
 *
 * @returns {Array} The list of scss files that must be compiled and minified.
 */
function getSassEntries() {
	const entries = {};
	glob.sync( sassPattern, { ignore: alwaysIgnoredFiles } ).forEach( file => {
		entries[ './' + file.substring( 0, file.length - '*.scss'.length ) ] = './' + file;
	} );
	return entries;
}

const crmJsConfig = {
	entry: getJsEntries(),
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin( {
				extractComments: false,
				terserOptions: {
					format: {
						comments: false,
					},
				},
			} ),
		],
	},
	output: {
		path: path.resolve( '.' ),
		filename: '[name].min.js',
	},
};

const crmSassConfig = {
	entry: getSassEntries(),

	output: {
		filename: './delete-me/[name].js',
		path: path.resolve( __dirname, '.' ),
		assetModuleFilename: '[path]/../css/[name].min.css',
	},

	module: {
		rules: [
			{
				type: 'asset/resource',
				use: [
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								outputStyle: 'compressed',
							},
						},
					},
				],
			},
		],
	},
	plugins: [
		new RemovePlugin( {
			/**
			 * After compilation permanently remove JS files created from our CSS entries.
			 */
			after: {
				include: [ './delete-me' ],
			},
		} ),
	],
};

module.exports = [ crmJsConfig, crmSassConfig ];
