const pluginName = require( '../package.json' ).name;
const debug = require( 'debug' )( pluginName );

const defaultFunctions = Object.freeze( {
	__: 1,
	_x: 2,
	_n: 3,
	_nx: 4,
} );

module.exports = ( babel, opts ) => {
	const { types: t } = babel;
	const seenDomains = {};

	let functions = defaultFunctions;
	let replacementDomain;

	if ( typeof opts.textdomain === 'undefined' ) {
		throw new Error( `${ pluginName }: The \`textdomain\` option is not set.` );
	} else if ( typeof opts.textdomain === 'string' ) {
		replacementDomain = () => opts.textdomain;
	} else if ( opts.textdomain instanceof Function ) {
		replacementDomain = opts.textdomain;
	} else if ( Object.getPrototypeOf( opts.textdomain ) === Object.prototype ) {
		replacementDomain = domain => opts.textdomain[ domain ];
	} else {
		throw new Error( `${ pluginName }: The \`textdomain\` option is set to an invalid value.` );
	}

	if ( opts.functions ) {
		if ( Object.getPrototypeOf( opts.functions ) !== Object.prototype ) {
			throw new Error( `${ pluginName }: The \`functions\` option is set to an invalid value.` );
		}
		for ( const [ k, v ] of Object.entries( opts.functions ) ) {
			if ( ! Number.isInteger( v ) || v < 0 ) {
				throw new Error(
					`${ pluginName }: Invalid argument index for \`functions.${ k }\`, value must be a non-negative integer.`
				);
			}
		}
		functions = opts.functions;
	}

	return {
		name: pluginName,
		visitor: {
			CallExpression( path ) {
				const funcName = t.isMemberExpression( path.node.callee )
					? path.node.callee.property.name
					: path.node.callee.name;
				const idx = functions[ funcName ];
				if ( typeof idx === 'undefined' ) {
					return;
				}

				const arg = path.node.arguments[ idx ];
				if ( ! t.isStringLiteral( arg ) ) {
					if ( arg ) {
						debug(
							path
								.get( `arguments.${ idx }` )
								.buildCodeFrameError(
									`Domain argument should be a StringLiteral, not ${ arg.type }`,
									Error
								).message
						);
					} else {
						debug(
							path.buildCodeFrameError( `Domain argument (index ${ idx + 1 }) is missing`, Error )
								.message
						);
					}
					return;
				}

				const newdomain = replacementDomain( arg.value );
				if ( typeof newdomain === 'string' ) {
					arg.value = newdomain;
				} else if ( ! seenDomains[ arg.value ] ) {
					seenDomains[ arg.value ] = true;
					debug(
						path
							.get( `arguments.${ idx }` )
							.buildCodeFrameError(
								`No mapping for textdomain ${ arg.value } (first instance)`,
								Error
							).message
					);
				}
			},
		},
	};
};

module.exports.defaultFunctions = defaultFunctions;
