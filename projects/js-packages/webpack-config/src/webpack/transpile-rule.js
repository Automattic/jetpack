const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Make the condition to include certain node_modules prefixes.
 *
 * @param {string[]} modules - Module prefixes to include.
 * @returns {Function} Condition function.
 */
function makeIncludeNodeModulesCondition( modules ) {
	return file => {
		const i = file.lastIndexOf( '/node_modules/' ) + 14;
		return i >= 14 && modules.some( module => file.startsWith( module, i ) );
	};
}

const TranspileRule = ( options = {} ) => {
	const babelDefaults = {
		babelrc: false,
		cacheDirectory: path.resolve( '.cache/babel' ),
		cacheCompression: true,
	};

	const configFile = path.resolve( 'babel.config.js' );
	if ( fs.existsSync( configFile ) ) {
		babelDefaults.configFile = configFile;
	} else {
		babelDefaults.presets = [ require.resolve( '../babel-preset.js' ) ];
	}

	const ret = {
		test: /\.(?:[jt]sx?|[cm]js)$/,
		include: options.include,
		exclude: options.exclude,
		use: [
			{
				loader: require.resolve( 'thread-loader' ),
				options: options.threadOpts,
			},
			{
				loader: require.resolve( 'babel-loader' ),
				options: { ...babelDefaults, ...options.babelOpts },
			},
		],
	};

	if ( options.includeNodeModules ) {
		const condition = makeIncludeNodeModulesCondition( options.includeNodeModules );
		if ( typeof ret.include === 'undefined' ) {
			ret.include = condition;
		} else if ( Array.isArray( ret.include ) ) {
			ret.include.push( condition );
		} else {
			ret.include = [ ret.include, condition ];
		}
	}

	return ret;
};

module.exports = TranspileRule;
