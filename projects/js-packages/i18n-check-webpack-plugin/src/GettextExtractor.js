const fs = require( 'fs/promises' );
const babel = require( '@babel/core' );
const GettextEntries = require( './GettextEntries' );
const GettextEntry = require( './GettextEntry' );
const PLUGIN_NAME = require( './plugin-name.js' );
const debug = require( 'debug' )( `${ PLUGIN_NAME }:gettext` ); // eslint-disable-line import/order

const { parseAsync, parseSync, traverse, types: t } = babel;

// Some typedefs for jsdoc. Babel doesn't export the actual constructors for us.
/** @typedef babel.Node */
/** @typedef babel.Comment */
/** @typedef {babel.Node} babel.CallExpression */

/**
 * Default function mappings.
 *
 * Key is the function. Value specifies whether each argument holds the
 * msgid, plural, context, or domain.
 */
const defaultFunctions = Object.freeze( {
	__: [ 'msgid', 'domain' ],
	_x: [ 'msgid', 'context', 'domain' ],
	_n: [ 'msgid', 'plural', null, 'domain' ],
	_nx: [ 'msgid', 'plural', null, 'context', 'domain' ],
} );

/**
 * A gettext-style string extractor compatible with that used by wp-cli.
 *
 * @see https://github.com/wp-cli/i18n-command/
 */
class GettextExtractor {
	#babelOptions;
	#functions;
	#lintlogger;

	/**
	 * Constructor.
	 *
	 * @param {object} options - Configuration options.
	 * @param {object} options.babelOptions - Options for Babel.
	 * @param {object<string, (string | null)[]>} options.functions - Functions to extract. Defaults are available as a static property `defaultFunctions`.
	 * @param {Function} options.lintLogger - Lint logging callback. See `this.setLintLogger()`.
	 */
	constructor( options = {} ) {
		this.#babelOptions = options.babelOptions || {};
		this.#functions = options.functions || defaultFunctions;
		this.#lintlogger = options.lintLogger || null;
	}

	/**
	 * Extract gettext strings from a file.
	 *
	 * @param {string} file - File name.
	 * @param {object} opts - Babel options.
	 * @returns {GettextEntries} Set of entries.
	 */
	async extractFromFile( file, opts = {} ) {
		const contents = await fs.readFile( file, { encoding: 'utf8' } );
		return await this.extract( contents, { filename: file, ...opts } );
	}

	/**
	 * Parse source.
	 *
	 * @param {string} source - JavaScript source.
	 * @param {object} opts - Babel options.
	 * @returns {babel.File} Babel File object.
	 */
	async parse( source, opts = {} ) {
		const options = { ...this.#babelOptions, ...opts };
		delete options.lintLogger;
		const ast = await parseAsync( source, options );
		return new babel.File( options, { code: source, ast } );
	}

	/**
	 * Extract gettext strings from source.
	 *
	 * @param {string} source - JavaScript source.
	 * @param {object} opts - Babel options.
	 * @returns {GettextEntries} Set of entries.
	 */
	async extract( source, opts ) {
		return this.extractFromAst( await this.parse( source, opts ), opts );
	}

	/**
	 * Extract gettext strings from a Babel File object.
	 *
	 * @param {babel.File} file - Babel File object, e.g. from `this.parse()`.
	 * @param {object} opts - Babel options.
	 * @returns {GettextEntries} Set of entries.
	 */
	extractFromAst( file, opts = {} ) {
		const entries = new GettextEntries();
		return this.#extractFromAst( file, entries, false, opts );
	}

	/**
	 * Extract gettext strings from a Babel File object.
	 *
	 * @param {babel.File} file - Babel File object, e.g. from `this.parse()`.
	 * @param {GettextEntries} entries - Entries object to fill in.
	 * @param {number|false} evalline - If this is a recursive call from an `eval()`, the line of the eval.
	 * @param {object} opts - Babel options.
	 * @returns {GettextEntries} `entries`.
	 */
	#extractFromAst( file, entries, evalline, opts ) {
		const options = { ...this.#babelOptions, ...opts };
		delete options.lintLogger;
		const filename = opts.filename ? opts.filename + ':' : '';
		const allComments = new Set();
		const commentsCache = new WeakSet();

		let lintlogger = typeof opts.lintLogger !== 'undefined' ? opts.lintLogger : this.#lintlogger;
		let dolint = true;
		if ( ! lintlogger ) {
			lintlogger = debug;
			dolint = debug.enabled;
		}

		traverse(
			file.ast,
			{
				// Unfortunately we have to visit every node to collect comments.
				// @see https://github.com/wp-cli/i18n-command/blob/e9eef8aab4b5e43c3aa09bf60e1e7a9d6d30d302/src/JsFunctionsScanner.php#L73
				// @see https://github.com/wp-cli/i18n-command/blob/e9eef8aab4b5e43c3aa09bf60e1e7a9d6d30d302/src/JsFunctionsScanner.php#L208
				enter: path => {
					const node = path.node;

					if ( node.leadingComments ) {
						node.leadingComments.forEach( c => allComments.add( c ) );
					}

					if ( ! t.isCallExpression( node ) ) {
						return;
					}

					const callee = this.#resolveExpressionCallee( node );
					if ( ! callee ) {
						return;
					}

					// If we see an `eval()`, process the contents.
					if ( callee.name === 'eval' ) {
						for ( const arg of node.arguments ) {
							if ( t.isLiteral( arg ) ) {
								const ast = parseSync( arg.value, options );
								const evalfile = new babel.File( options, { code: arg.value, ast } );
								this.#extractFromAst( evalfile, entries, evalline || node.loc.start.line, opts );
								break;
							}
						}
						return;
					}

					if ( ! this.#functions.hasOwnProperty( callee.name ) ) {
						return;
					}

					// Support nested function calls.
					if ( node.leadingComments ) {
						for ( const arg of node.arguments ) {
							arg.leadingComments = arg.leadingComments
								? arg.leadingComments.concat( node.leadingComments )
								: node.leadingComments;
						}
					}

					callee.comments.forEach( c => allComments.add( c ) );

					// Yes, this doesn't quite match the code from wp-cli/i18n-command. Theirs is buggy.
					const args = [];
					for ( const arg of node.arguments ) {
						if (
							arg.leadingComments &&
							// The mck89/peast parser used by wp-cli/i18n-command attaches the comment to the callee of the call expression,
							// while Babel's attaches it to the expression itself. Avoid adding things here.
							! t.isCallExpression( arg )
						) {
							arg.leadingComments.forEach( c => allComments.add( c ) );
						}

						if (
							t.isLiteral( arg ) &&
							! t.isTemplateLiteral( arg ) &&
							! t.isRegExpLiteral( arg )
						) {
							args.push( arg.value );
						} else if ( t.isTemplateLiteral( arg ) && arg.expressions.length === 0 ) {
							args.push( arg.quasis[ 0 ].value.cooked );
						} else {
							args.push( null );
						}
					}

					const entryData = {
						comments: [],
					};
					for ( const [ i, k ] of Object.entries( this.#functions[ callee.name ] ) ) {
						entryData[ k ] = args[ i ];
					}

					if ( entryData.msgid === '' ) {
						if ( dolint ) {
							const loc = filename + node.loc.start.line + ':' + ( node.loc.start.column + 1 );
							const str = path.getSource();
							lintlogger( `${ loc }: msgid is empty: ${ str }` );
						}
						return;
					}

					// While wp-cli will stringify numbers and `true`, that's kind of pointless (and will break the check plugin) so let's not.
					if ( typeof entryData.msgid !== 'string' ) {
						if ( dolint ) {
							const loc = filename + node.loc.start.line + ':' + ( node.loc.start.column + 1 );
							const str = path.getSource();
							const idx = this.#functions[ callee.name ].indexOf( 'msgid' );
							if ( node.arguments[ idx ] ) {
								lintlogger( `${ loc }: msgid argument is not a string literal: ${ str }` );
							} else {
								lintlogger( `${ loc }: msgid argument (index ${ idx + 1 }) is missing: ${ str }` );
							}
						}
						return;
					}

					// None of the rest of the fields prevent it from being processed, the invalid value is just stringified.
					if ( entryData.domain === '' && dolint ) {
						const loc = filename + node.loc.start.line + ':' + ( node.loc.start.column + 1 );
						const str = path.getSource();
						lintlogger( `${ loc }: domain is empty: ${ str }` );
					}
					for ( const k of [ 'plural', 'context', 'domain' ] ) {
						if (
							typeof entryData[ k ] !== 'string' &&
							this.#functions[ callee.name ].indexOf( k ) >= 0
						) {
							if ( dolint ) {
								const loc = filename + node.loc.start.line + ':' + ( node.loc.start.column + 1 );
								const str = path.getSource();
								const idx = this.#functions[ callee.name ].indexOf( k );
								if ( node.arguments[ idx ] ) {
									lintlogger( `${ loc }: ${ k } argument is not a string literal: ${ str }` );
								} else {
									lintlogger(
										`${ loc }: ${ k } argument (index ${ idx + 1 }) is missing: ${ str }`
									);
								}
							}
							if ( entryData[ k ] === true ) {
								entryData[ k ] = '1';
							} else if (
								entryData[ k ] === false ||
								entryData[ k ] === null ||
								typeof entryData[ k ] === 'undefined'
							) {
								delete entryData[ k ];
							} else {
								entryData[ k ] = entryData[ k ].toString();
							}
						}
					}

					let entry = new GettextEntry( entryData );
					if ( entries.has( entry ) ) {
						entry = entries.get( entry );
					} else {
						entries.add( entry );
					}
					if ( filename !== '' ) {
						entry.locations.add( filename + ( evalline || node.loc.start.line ) );
					}

					let parsedComment = false;
					for ( const comment of allComments ) {
						if ( ! this.#commentPrecedesNode( comment, node ) ) {
							continue;
						}

						if ( commentsCache.has( comment ) ) {
							continue;
						}

						parsedComment = comment.value
							.split( '\n' )
							.map( l => l.replace( /^[#*/ \t\r\n\0\v]+|[#*/ \t\r\n\0\v]+$/g, '' ) )
							.filter( v => v !== '' )
							.join( ' ' );
						if ( /^[tT]ranslators/.test( parsedComment ) ) {
							entry.comments.add( parsedComment );
							commentsCache.add( comment );
						}
					}

					if ( parsedComment ) {
						allComments.clear();
					}
				},
			},
			file.scope
		);

		return entries;
	}

	/**
	 * Resolve the callee of a CallExpression.
	 *
	 * @see https://github.com/wp-cli/i18n-command/blob/e9eef8aab4b5e43c3aa09bf60e1e7a9d6d30d302/src/JsFunctionsScanner.php#L254
	 * @param {babel.CallExpression} node - CallExpression node.
	 * @returns {{ name: string, comments: string[] }|undefined} Callee name and comments, or undefined.
	 */
	#resolveExpressionCallee( node ) {
		const callee = node.callee;

		// If the callee is a simple identifier it can simply be returned.
		// For example: __( "translation" ).
		if ( t.isIdentifier( callee ) ) {
			return {
				name: callee.name,
				comments: callee.leadingComments || [],
			};
		}

		// If the callee is a member expression resolve it to the property.
		// For example: wp.i18n.__( "translation" ) or u.__( "translation" ).
		if ( t.isMemberExpression( callee ) && t.isIdentifier( callee.property ) ) {
			// Make sure to unpack wp.i18n which is a nested MemberExpression.
			const comments = t.isMemberExpression( callee.object )
				? callee.object.object.leadingComments
				: callee.object.leadingComments;
			return {
				name: callee.property.name,
				comments: comments || [],
			};
		}

		// If the callee is a call expression as created by Webpack resolve it.
		// For example: Object(u.__)( "translation" ).
		if (
			t.isCallExpression( callee ) &&
			t.isIdentifier( callee.callee ) &&
			callee.callee.name === 'Object' &&
			callee.arguments.length > 0 &&
			t.isMemberExpression( callee.arguments[ 0 ] )
		) {
			const property = callee.arguments[ 0 ].property;

			// Matches minified webpack statements: Object(u.__)( "translation" ).
			if ( t.isIdentifier( property ) ) {
				return {
					name: property.name,
					comments: callee.callee.leadingComments || [],
				};
			}

			// Matches unminified webpack statements:
			// Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__["__"])( "translation" );
			if ( t.isStringLiteral( property ) ) {
				let name = property.value;

				// Matches mangled webpack statement:
				// Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_7__[/* __ */ "a"])( "translation" );
				const leadingPropertyComments = property.leadingComments;
				if (
					leadingPropertyComments &&
					leadingPropertyComments.length === 1 &&
					leadingPropertyComments[ 0 ].type === 'CommentBlock'
				) {
					name = leadingPropertyComments[ 0 ].value.trim();
				}

				return {
					name: name,
					comments: callee.callee.leadingComments || [],
				};
			}
		}

		// If the callee is an indirect function call as created by babel, resolve it.
		// For example: `(0, u.__)( "translation" )`.
		// Local change: Apparently Babel's parser doesn't reproduce the ParenthesizedExpression?
		let expressions;
		if ( t.isParenthesizedExpression( callee ) && t.isSequenceExpression( callee.expression ) ) {
			expressions = callee.expression.expressions;
		} else if ( t.isSequenceExpression( callee ) ) {
			expressions = callee.expressions;
		}
		if (
			expressions &&
			expressions.length === 2 &&
			t.isLiteral( expressions[ 0 ] ) &&
			node.arguments.length > 0
		) {
			// Matches any general indirect function call: `(0, __)( "translation" )`.
			if ( t.isIdentifier( expressions[ 1 ] ) ) {
				return {
					name: expressions[ 1 ].name,
					comments: callee.leadingComments || [],
				};
			}

			// Matches indirect function calls used by babel for module imports: `(0, _i18n.__)( "translation" )`.
			if ( t.isMemberExpression( expressions[ 1 ] ) ) {
				const property = expressions[ 1 ].property;

				if ( t.isIdentifier( property ) ) {
					return {
						name: property.name,
						comments: callee.leadingComments || [],
					};
				}
			}
		}
	}

	/**
	 * Test if the comment comes before the node.
	 *
	 * @see https://github.com/wp-cli/i18n-command/blob/e9eef8aab4b5e43c3aa09bf60e1e7a9d6d30d302/src/JsFunctionsScanner.php#L364
	 * @param {babel.Comment} comment - Comment.
	 * @param {babel.Node} node - Node.
	 * @returns {boolean} Whether the comment comes before the node.
	 */
	#commentPrecedesNode( comment, node ) {
		// Comments should be on the same or an earlier line than the translation.
		if ( node.loc.start.line - comment.loc.end.line > 1 ) {
			return false;
		}

		// Comments on the same line should be before the translation.
		if (
			node.loc.start.line === comment.loc.end.line &&
			node.loc.start.column < comment.loc.start.column
		) {
			return false;
		}

		return true;
	}
}

module.exports = GettextExtractor;
module.exports.defaultFunctions = defaultFunctions;
