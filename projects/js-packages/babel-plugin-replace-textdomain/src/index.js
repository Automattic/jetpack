const pluginName = require( '../package.json' ).name;
const debug = require( 'debug' )( pluginName ); // eslint-disable-line import/order

const defaultFunctions = Object.freeze( {
	__: 1,
	_x: 2,
	_n: 3,
	_nx: 4,
} );

const defaultI18nModule = '@wordpress/i18n';

/**
 * Checks whether a given function name is an alias for an i18n module import.
 * @param {object} path       - The Babel path object.
 * @param {string} name       - The function name to check.
 * @param {string} i18nModule - The module name to match against.
 * @return {string|null} The resolved function name, or null if the function name is not an alias.
 */
function resolveI18nAlias( path, name, i18nModule ) {
	const binding = path.scope.getBinding( name );
	if ( ! binding ) {
		return null;
	}
	const bindingPath = binding.path;
	if ( ! bindingPath.isImportSpecifier() ) {
		return null;
	}
	const importDecl = bindingPath.parentPath;
	if ( ! importDecl.isImportDeclaration() || importDecl.node.source.value !== i18nModule ) {
		return null;
	}
	return bindingPath.node.imported.name;
}

module.exports = ( babel, opts ) => {
	const { types: t } = babel;
	const seenDomains = {};

	let functions = defaultFunctions;
	let i18nModule = defaultI18nModule;
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

	if ( opts.i18nModule !== undefined ) {
		if ( typeof opts.i18nModule !== 'string' ) {
			throw new Error( `${ pluginName }: The \`i18nModule\` option must be a string.` );
		}
		i18nModule = opts.i18nModule;
	}

	return {
		name: pluginName,
		visitor: {
			CallExpression( path ) {
				let callee = path.node.callee;
				if ( t.isSequenceExpression( callee ) ) {
					callee = callee.expressions[ callee.expressions.length - 1 ];
				}
				const calleeName = t.isMemberExpression( callee ) ? callee.property.name : callee.name;

				let funcName = calleeName;
				if ( ! Object.hasOwn( functions, funcName ) ) {
					if ( t.isMemberExpression( callee ) ) {
						return;
					}
					funcName = resolveI18nAlias( path, calleeName, i18nModule );
					if ( ! funcName || ! Object.hasOwn( functions, funcName ) ) {
						return;
					}
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
