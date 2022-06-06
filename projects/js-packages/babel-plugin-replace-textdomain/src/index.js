const pluginName = require( '../package.json' ).name;
const debug = require( 'debug' )( pluginName ); // eslint-disable-line import/order

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
				if ( ! functions.hasOwnProperty( funcName ) ) {
					return;
				}
				const idx = functions[ funcName ];

				// If the domain argument is not set, maybe inject one.
				if ( ! path.node.arguments[ idx ] ) {
					debug(
						path.buildCodeFrameError( `Domain argument (index ${ idx + 1 }) is missing`, Error )
							.message
					);
					const newdomain = replacementDomain( '' );
					if ( typeof newdomain === 'string' ) {
						for ( let i = path.node.arguments.length; i < idx; i++ ) {
							path.pushContainer( 'arguments', t.identifier( 'undefined' ) );
						}
						path.pushContainer( 'arguments', t.stringLiteral( newdomain ) );
					}
					return;
				}

				// Determine the old domain.
				const argpath = path.get( `arguments.${ idx }` );
				const argnode = argpath.node;
				let olddomain;
				if ( t.isStringLiteral( argnode ) ) {
					olddomain = argnode.value;
				} else if ( t.isTemplateLiteral( argnode ) && argnode.expressions.length === 0 ) {
					olddomain = argnode.quasis[ 0 ].value.cooked;
				} else {
					debug(
						argpath.buildCodeFrameError(
							`Domain argument should be a StringLiteral, not ${ argnode.type }`,
							Error
						).message
					);
					return;
				}

				// Replace it, if appropriate.
				const newdomain = replacementDomain( olddomain );
				if ( typeof newdomain === 'string' ) {
					argpath.replaceWith( t.stringLiteral( newdomain ) );
				} else if ( ! seenDomains[ olddomain ] ) {
					seenDomains[ olddomain ] = true;
					debug(
						argpath.buildCodeFrameError(
							`No mapping for textdomain ${ olddomain } (first instance)`,
							Error
						).message
					);
				}
			},
		},
	};
};

module.exports.defaultFunctions = defaultFunctions;
