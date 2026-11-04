/**
 * Callee resolution for gettext-style calls, shared by the plugin itself and
 * by tools that need to recognise exactly the same calls (e.g. the wp-build
 * i18n stub generator).
 *
 * A gettext call reaches the AST in one of three shapes: a bare identifier
 * (`__( 'x' )`, possibly import-aliased), a member call (`i18n.__( 'x' )`), or
 * esbuild's interop sequence expression (`(0, import_i18n.__)( 'x' )`).
 *
 * Matching those purely by name is fine for hand-written source, but not for
 * whole bundles: a `cache.__( key )` inside a bundled dependency looks
 * identical. `requireI18nSource` turns on a provenance check that refuses to
 * treat a call as gettext when its callee provably comes from somewhere other
 * than the i18n module.
 *
 * The check is deliberately "reject what is proven foreign" rather than
 * "accept only what is proven i18n". A callee whose origin can't be
 * determined is still treated as gettext, so an unrecognised bundler shape
 * degrades to the old behaviour — noisier — instead of silently leaving a
 * whole bundle unstamped and its UI in English.
 */

/** How many binding hops the provenance trace follows before reporting "unknown". */
const MAX_TRACE_DEPTH = 6;

/**
 * Memoized trace results, keyed by binding and then by i18n module name.
 * Bindings are per-file objects, so entries fall out with the file's AST.
 *
 * @type {WeakMap<object, Map<string, boolean|null>>}
 */
const traceCache = new WeakMap();

/**
 * Whether a node reads a property named `i18n` — `wp.i18n`,
 * `window.wp.i18n`: the shape bundlers emit when `@wordpress/i18n` is
 * externalized to a global.
 *
 * @param {object} t    - Babel types.
 * @param {object} node - Node to test.
 * @return {boolean} Whether the node reads an `i18n` property.
 */
function isI18nPropertyAccess( t, node ) {
	return (
		( t.isMemberExpression( node ) || t.isOptionalMemberExpression( node ) ) &&
		! node.computed &&
		t.isIdentifier( node.property, { name: 'i18n' } )
	);
}

/**
 * Whether a string names the i18n module. Bundlers prefix their synthetic
 * module keys (esbuild writes `package-external:@wordpress/i18n`), so a
 * suffix match after a colon counts too.
 *
 * @param {string} value      - String literal value.
 * @param {string} i18nModule - Module name to match.
 * @return {boolean} Whether the string names the module.
 */
function namesI18nModule( value, i18nModule ) {
	return value === i18nModule || value.endsWith( `:${ i18nModule }` );
}

/**
 * Trace an identifier back to the i18n module through its binding.
 *
 * @param {object}     t             - Babel types.
 * @param {object}     scopePath     - Path whose scope resolves `name`.
 * @param {string}     name          - Identifier name.
 * @param {string}     i18nModule    - Module name to trace to.
 * @param {object}     state         - Trace state: `{ depth, seen }`.
 * @param {false|null} unboundResult - What an unresolvable name means here.
 * @return {boolean|null} `true` when it resolves to the i18n module, `false` when it resolves elsewhere, `null` when unknown.
 */
function traceIdentifier( t, scopePath, name, i18nModule, state, unboundResult ) {
	const binding = scopePath.scope.getBinding( name );
	if ( ! binding ) {
		return unboundResult;
	}
	if ( state.seen.has( binding ) || state.depth > MAX_TRACE_DEPTH ) {
		return null;
	}

	const cached = traceCache.get( binding );
	if ( cached?.has( i18nModule ) ) {
		return cached.get( i18nModule );
	}

	state.seen.add( binding );
	const result = traceBinding( t, binding, i18nModule, state );

	if ( cached ) {
		cached.set( i18nModule, result );
	} else {
		traceCache.set( binding, new Map( [ [ i18nModule, result ] ] ) );
	}
	return result;
}

/**
 * Classify what a binding was bound to.
 *
 * @param {object} t          - Babel types.
 * @param {object} binding    - Babel binding.
 * @param {string} i18nModule - Module name to trace to.
 * @param {object} state      - Trace state: `{ depth, seen }`.
 * @return {boolean|null} Tri-state as in `traceIdentifier()`.
 */
function traceBinding( t, binding, i18nModule, state ) {
	const bindingPath = binding.path;

	if (
		bindingPath.isImportSpecifier() ||
		bindingPath.isImportDefaultSpecifier() ||
		bindingPath.isImportNamespaceSpecifier()
	) {
		const importDecl = bindingPath.parentPath;
		return (
			importDecl.isImportDeclaration() &&
			namesI18nModule( importDecl.node.source.value, i18nModule )
		);
	}

	if ( bindingPath.isVariableDeclarator() && bindingPath.node.init ) {
		return traceInitializer( t, bindingPath, bindingPath.node.init, i18nModule, state );
	}

	// A locally declared function or class is definitively not an import of
	// the i18n module.
	if ( bindingPath.isFunctionDeclaration() || bindingPath.isClassDeclaration() ) {
		return false;
	}

	// Parameters, catch clauses, uninitialized declarations: unknown.
	return null;
}

/**
 * Look for the i18n module inside a variable's initializer, following the
 * identifiers it references.
 *
 * Bundlers wrap the module several hops deep — esbuild binds
 * `var import_i18n = __toESM( require_i18n(), 1 )`, where `require_i18n` is a
 * `__commonJS` wrapper assigning `module.exports = window.wp.i18n` — and
 * minification renames every identifier along the way. So instead of matching
 * a fixed shape, this scans the initializer (and, a hop at a time, whatever it
 * references) for either the module's name as a string or a read of an `i18n`
 * property. Both survive minification.
 *
 * @param {object} t          - Babel types.
 * @param {object} scopePath  - Path whose scope resolves identifiers in `init`.
 * @param {object} init       - Initializer node.
 * @param {string} i18nModule - Module name to trace to.
 * @param {object} state      - Trace state: `{ depth, seen }`.
 * @return {boolean|null} Tri-state as in `traceIdentifier()`.
 */
function traceInitializer( t, scopePath, init, i18nModule, state ) {
	const identifiers = [];
	let found = false;

	t.traverseFast( init, node => {
		if ( found ) {
			return;
		}
		if (
			( t.isStringLiteral( node ) && namesI18nModule( node.value, i18nModule ) ) ||
			isI18nPropertyAccess( t, node )
		) {
			found = true;
			return;
		}
		if ( t.isIdentifier( node ) ) {
			identifiers.push( node.name );
		}
	} );

	if ( found ) {
		return true;
	}
	if ( state.depth >= MAX_TRACE_DEPTH ) {
		return null;
	}

	const nested = { depth: state.depth + 1, seen: state.seen };
	let truncated = false;
	for ( const name of identifiers ) {
		// Names with no binding here are globals (`Map`, `Symbol`, …). A
		// global i18n would have been caught by the property-access marker
		// above, so they are not evidence either way — hence `false`.
		const result = traceIdentifier( t, scopePath, name, i18nModule, nested, false );
		if ( result === true ) {
			return true;
		}
		if ( result === null ) {
			truncated = true;
		}
	}
	return truncated ? null : false;
}

/**
 * Whether an expression provably resolves to something other than the i18n
 * module.
 *
 * @param {object} t          - Babel types.
 * @param {object} path       - Path providing the scope for `node`.
 * @param {object} node       - Expression to classify (a callee, or a callee's object).
 * @param {string} i18nModule - Module name to trace to.
 * @return {boolean} Whether the expression is proven foreign.
 */
function isForeignSource( t, path, node, i18nModule ) {
	const state = { depth: 0, seen: new Set() };
	if ( isI18nPropertyAccess( t, node ) ) {
		return false;
	}
	if ( ! t.isIdentifier( node ) ) {
		// An unrecognised callee shape: unknown, not foreign.
		return false;
	}
	// An unbound name at the top of the chain is unknown, not foreign: hand-
	// written snippets and pre-bundling sources call through free variables.
	return traceIdentifier( t, path, node.name, i18nModule, state, null ) === false;
}

/**
 * Resolve the gettext function a call expression invokes.
 *
 * @param {object}  t                           - Babel types (`babel.types`).
 * @param {object}  path                        - Path of the `CallExpression` / `OptionalCallExpression`.
 * @param {object}  options                     - Options.
 * @param {object}  options.functions           - Map of gettext function name to domain argument index.
 * @param {string}  options.i18nModule          - Module the gettext functions are expected to come from.
 * @param {boolean} [options.requireI18nSource] - Reject callees that provably come from another module.
 * @return {string|null} The gettext function name, or `null` when the call is not one.
 */
function resolveGettextCallee( t, path, { functions, i18nModule, requireI18nSource = false } ) {
	let callee = path.node.callee;
	if ( t.isSequenceExpression( callee ) ) {
		callee = callee.expressions[ callee.expressions.length - 1 ];
	}

	const isMember =
		( t.isMemberExpression( callee ) || t.isOptionalMemberExpression( callee ) ) &&
		! callee.computed;
	const calleeName = isMember ? callee.property.name : callee.name;
	if ( typeof calleeName !== 'string' ) {
		return null;
	}

	if ( isMember ) {
		if ( ! Object.hasOwn( functions, calleeName ) ) {
			return null;
		}
		if ( requireI18nSource && isForeignSource( t, path, callee.object, i18nModule ) ) {
			return null;
		}
		return calleeName;
	}

	if ( ! t.isIdentifier( callee ) ) {
		return null;
	}

	if ( Object.hasOwn( functions, calleeName ) ) {
		if ( requireI18nSource && isForeignSource( t, path, callee, i18nModule ) ) {
			return null;
		}
		return calleeName;
	}

	// An import alias: `import { __ as __alias } from '@wordpress/i18n'`.
	const bindingPath = path.scope.getBinding( calleeName )?.path;
	if ( ! bindingPath || ! bindingPath.isImportSpecifier() ) {
		return null;
	}
	const importDecl = bindingPath.parentPath;
	if ( ! importDecl.isImportDeclaration() || importDecl.node.source.value !== i18nModule ) {
		return null;
	}
	const imported = bindingPath.node.imported.name;
	return Object.hasOwn( functions, imported ) ? imported : null;
}

module.exports = { resolveGettextCallee, MAX_TRACE_DEPTH };
