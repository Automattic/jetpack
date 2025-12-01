const __create = Object.create;
const __defProp = Object.defineProperty;
const __getOwnPropDesc = Object.getOwnPropertyDescriptor;
const __getOwnPropNames = Object.getOwnPropertyNames;
const __getProtoOf = Object.getPrototypeOf;
const __hasOwnProp = Object.prototype.hasOwnProperty;
const __commonJS = ( cb, mod ) =>
	function __require() {
		return (
			mod || ( 0, cb[ __getOwnPropNames( cb )[ 0 ] ] )( ( mod = { exports: {} } ).exports, mod ),
			mod.exports
		);
	};
const __copyProps = ( to, from, except, desc ) => {
	if ( ( from && typeof from === 'object' ) || typeof from === 'function' ) {
		for ( const key of __getOwnPropNames( from ) )
			if ( ! __hasOwnProp.call( to, key ) && key !== except )
				__defProp( to, key, {
					get: () => from[ key ],
					enumerable: ! ( desc = __getOwnPropDesc( from, key ) ) || desc.enumerable,
				} );
	}
	return to;
};
const __toESM = ( mod, isNodeMode, target ) => (
	( target = mod != null ? __create( __getProtoOf( mod ) ) : {} ),
	__copyProps(
		// If the importer is in node compatibility mode or this is not an ESM
		// file that has been converted to a CommonJS file using a Babel-
		// compatible transform (i.e. "__esModule" has not been set), then set
		// "default" to the CommonJS "module.exports" for node compatibility.
		isNodeMode || ! mod || ! mod.__esModule
			? __defProp( target, 'default', { value: mod, enumerable: true } )
			: target,
		mod
	)
);

// package-external:@wordpress/element
const require_element = __commonJS( {
	'package-external:@wordpress/element'( exports, module ) {
		module.exports = window.wp.element;
	},
} );

// vendor-external:react/jsx-runtime
const require_jsx_runtime = __commonJS( {
	'vendor-external:react/jsx-runtime'( exports, module ) {
		module.exports = window.ReactJSXRuntime;
	},
} );

// package-external:@wordpress/components
const require_components = __commonJS( {
	'package-external:@wordpress/components'( exports, module ) {
		module.exports = window.wp.components;
	},
} );

// package-external:@wordpress/i18n
const require_i18n = __commonJS( {
	'package-external:@wordpress/i18n'( exports, module ) {
		module.exports = window.wp.i18n;
	},
} );

// vendor-external:react
const require_react = __commonJS( {
	'vendor-external:react'( exports, module ) {
		module.exports = window.React;
	},
} );

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
const require_use_sync_external_store_shim_development = __commonJS( {
	'../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js'(
		exports
	) {
		( function () {
			/**
			 *
			 * @param x
			 * @param y
			 */
			function is( x, y ) {
				return ( x === y && ( 0 !== x || 1 / x === 1 / y ) ) || ( x !== x && y !== y );
			}
			/**
			 *
			 * @param subscribe
			 * @param getSnapshot
			 */
			function useSyncExternalStore$2( subscribe, getSnapshot ) {
				didWarnOld18Alpha ||
					void 0 === React5.startTransition ||
					( ( didWarnOld18Alpha = true ),
					console.error(
						'You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release.'
					) );
				const value = getSnapshot();
				if ( ! didWarnUncachedGetSnapshot ) {
					var cachedValue = getSnapshot();
					objectIs( value, cachedValue ) ||
						( console.error(
							'The result of getSnapshot should be cached to avoid an infinite loop'
						),
						( didWarnUncachedGetSnapshot = true ) );
				}
				cachedValue = useState( {
					inst: { value, getSnapshot },
				} );
				const inst = cachedValue[ 0 ].inst,
					forceUpdate = cachedValue[ 1 ];
				useLayoutEffect(
					function () {
						inst.value = value;
						inst.getSnapshot = getSnapshot;
						checkIfSnapshotChanged( inst ) && forceUpdate( { inst } );
					},
					[ subscribe, value, getSnapshot ]
				);
				useEffect(
					function () {
						checkIfSnapshotChanged( inst ) && forceUpdate( { inst } );
						return subscribe( function () {
							checkIfSnapshotChanged( inst ) && forceUpdate( { inst } );
						} );
					},
					[ subscribe ]
				);
				useDebugValue( value );
				return value;
			}
			/**
			 *
			 * @param inst
			 */
			function checkIfSnapshotChanged( inst ) {
				const latestGetSnapshot = inst.getSnapshot;
				inst = inst.value;
				try {
					const nextValue = latestGetSnapshot();
					return ! objectIs( inst, nextValue );
				} catch ( error ) {
					return true;
				}
			}
			/**
			 *
			 * @param subscribe
			 * @param getSnapshot
			 */
			function useSyncExternalStore$1( subscribe, getSnapshot ) {
				return getSnapshot();
			}
			'undefined' !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
				'function' === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart &&
				__REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart( Error() );
			var React5 = require_react(),
				objectIs = 'function' === typeof Object.is ? Object.is : is,
				useState = React5.useState,
				useEffect = React5.useEffect,
				useLayoutEffect = React5.useLayoutEffect,
				useDebugValue = React5.useDebugValue,
				didWarnOld18Alpha = false,
				didWarnUncachedGetSnapshot = false,
				shim =
					'undefined' === typeof window ||
					'undefined' === typeof window.document ||
					'undefined' === typeof window.document.createElement
						? useSyncExternalStore$1
						: useSyncExternalStore$2;
			exports.useSyncExternalStore =
				void 0 !== React5.useSyncExternalStore ? React5.useSyncExternalStore : shim;
			'undefined' !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
				'function' === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop &&
				__REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop( Error() );
		} )();
	},
} );

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/index.js
const require_shim = __commonJS( {
	'../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/index.js'(
		exports,
		module
	) {
		if ( false ) {
			module.exports = null;
		} else {
			module.exports = require_use_sync_external_store_shim_development();
		}
	},
} );

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
const require_with_selector_development = __commonJS( {
	'../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js'(
		exports
	) {
		( function () {
			/**
			 *
			 * @param x
			 * @param y
			 */
			function is( x, y ) {
				return ( x === y && ( 0 !== x || 1 / x === 1 / y ) ) || ( x !== x && y !== y );
			}
			'undefined' !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
				'function' === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart &&
				__REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart( Error() );
			const React5 = require_react(),
				shim = require_shim(),
				objectIs = 'function' === typeof Object.is ? Object.is : is,
				useSyncExternalStore = shim.useSyncExternalStore,
				useRef2 = React5.useRef,
				useEffect = React5.useEffect,
				useMemo = React5.useMemo,
				useDebugValue = React5.useDebugValue;
			exports.useSyncExternalStoreWithSelector = function (
				subscribe,
				getSnapshot,
				getServerSnapshot,
				selector,
				isEqual
			) {
				let instRef = useRef2( null );
				if ( null === instRef.current ) {
					var inst = { hasValue: false, value: null };
					instRef.current = inst;
				} else inst = instRef.current;
				instRef = useMemo(
					function () {
						/**
						 *
						 * @param nextSnapshot
						 */
						function memoizedSelector( nextSnapshot ) {
							if ( ! hasMemo ) {
								hasMemo = true;
								memoizedSnapshot = nextSnapshot;
								nextSnapshot = selector( nextSnapshot );
								if ( void 0 !== isEqual && inst.hasValue ) {
									var currentSelection = inst.value;
									if ( isEqual( currentSelection, nextSnapshot ) )
										return ( memoizedSelection = currentSelection );
								}
								return ( memoizedSelection = nextSnapshot );
							}
							currentSelection = memoizedSelection;
							if ( objectIs( memoizedSnapshot, nextSnapshot ) ) return currentSelection;
							const nextSelection = selector( nextSnapshot );
							if ( void 0 !== isEqual && isEqual( currentSelection, nextSelection ) )
								return ( memoizedSnapshot = nextSnapshot ), currentSelection;
							memoizedSnapshot = nextSnapshot;
							return ( memoizedSelection = nextSelection );
						}
						var hasMemo = false,
							memoizedSnapshot,
							memoizedSelection,
							maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
						return [
							function () {
								return memoizedSelector( getSnapshot() );
							},
							null === maybeGetServerSnapshot
								? void 0
								: function () {
										return memoizedSelector( maybeGetServerSnapshot() );
								  },
						];
					},
					[ getSnapshot, getServerSnapshot, selector, isEqual ]
				);
				const value = useSyncExternalStore( subscribe, instRef[ 0 ], instRef[ 1 ] );
				useEffect(
					function () {
						inst.hasValue = true;
						inst.value = value;
					},
					[ value ]
				);
				useDebugValue( value );
				return value;
			};
			'undefined' !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
				'function' === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop &&
				__REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop( Error() );
		} )();
	},
} );

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/with-selector.js
const require_with_selector = __commonJS( {
	'../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/with-selector.js'(
		exports,
		module
	) {
		if ( false ) {
			module.exports = null;
		} else {
			module.exports = require_with_selector_development();
		}
	},
} );

// ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
/**
 *
 * @param e
 */
function r( e ) {
	let t,
		f,
		n = '';
	if ( 'string' === typeof e || 'number' === typeof e ) n += e;
	else if ( 'object' === typeof e )
		if ( Array.isArray( e ) ) {
			const o = e.length;
			for ( t = 0; t < o; t++ ) e[ t ] && ( f = r( e[ t ] ) ) && ( n && ( n += ' ' ), ( n += f ) );
		} else for ( f in e ) e[ f ] && ( n && ( n += ' ' ), ( n += f ) );
	return n;
}
/**
 *
 */
function clsx() {
	for ( var e, t, f = 0, n = '', o = arguments.length; f < o; f++ )
		( e = arguments[ f ] ) && ( t = r( e ) ) && ( n && ( n += ' ' ), ( n += t ) );
	return n;
}
const clsx_default = clsx;

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.3.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6_b3f1c0a24b274b87ef84b171d163fe1c/node_modules/@wordpress/admin-ui/build-module/navigable-region/index.js
const import_element = __toESM( require_element(), 1 );
const import_jsx_runtime = __toESM( require_jsx_runtime(), 1 );
const NavigableRegion = ( 0, import_element.forwardRef )(
	( { children, className, ariaLabel, as: Tag = 'div', ...props }, ref ) => {
		return /* @__PURE__ */ ( 0, import_jsx_runtime.jsx )( Tag, {
			ref,
			className: clsx_default( 'admin-ui-navigable-region', className ),
			'aria-label': ariaLabel,
			role: 'region',
			tabIndex: '-1',
			...props,
			children,
		} );
	}
);
NavigableRegion.displayName = 'NavigableRegion';
const navigable_region_default = NavigableRegion;

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.3.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6_b3f1c0a24b274b87ef84b171d163fe1c/node_modules/@wordpress/admin-ui/build-module/page/header.js
const import_components = __toESM( require_components(), 1 );
const import_jsx_runtime2 = __toESM( require_jsx_runtime(), 1 );
/**
 *
 * @param root0
 * @param root0.breadcrumbs
 * @param root0.badges
 * @param root0.title
 * @param root0.subTitle
 * @param root0.actions
 */
function Header( { breadcrumbs, badges, title, subTitle, actions } ) {
	return /* @__PURE__ */ ( 0, import_jsx_runtime2.jsxs )( import_components.__experimentalVStack, {
		className: 'admin-ui-page__header',
		as: 'header',
		children: [
			/* @__PURE__ */ ( 0, import_jsx_runtime2.jsxs )( import_components.__experimentalHStack, {
				className: 'admin-ui-page__header-title',
				justify: 'space-between',
				spacing: 2,
				children: [
					/* @__PURE__ */ ( 0, import_jsx_runtime2.jsxs )( import_components.__experimentalHStack, {
						spacing: 2,
						children: [
							title &&
								/* @__PURE__ */ ( 0, import_jsx_runtime2.jsx )(
									import_components.__experimentalHeading,
									{ as: 'h2', level: 3, weight: 500, truncate: true, children: title }
								),
							breadcrumbs,
							badges,
						],
					} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime2.jsx )( import_components.__experimentalHStack, {
						style: { width: 'auto', flexShrink: 0 },
						spacing: 2,
						className: 'admin-ui-page__header-actions',
						children: actions,
					} ),
				],
			} ),
			subTitle &&
				/* @__PURE__ */ ( 0, import_jsx_runtime2.jsx )( 'p', {
					className: 'admin-ui-page__header-subtitle',
					children: subTitle,
				} ),
		],
	} );
}

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.3.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6_b3f1c0a24b274b87ef84b171d163fe1c/node_modules/@wordpress/admin-ui/build-module/page/index.js
const import_jsx_runtime3 = __toESM( require_jsx_runtime(), 1 );
/**
 *
 * @param root0
 * @param root0.breadcrumbs
 * @param root0.badges
 * @param root0.title
 * @param root0.subTitle
 * @param root0.children
 * @param root0.className
 * @param root0.actions
 * @param root0.hasPadding
 */
function Page( {
	breadcrumbs,
	badges,
	title,
	subTitle,
	children,
	className,
	actions,
	hasPadding = false,
} ) {
	const classes = clsx_default( 'admin-ui-page', className );
	return /* @__PURE__ */ ( 0, import_jsx_runtime3.jsxs )( navigable_region_default, {
		className: classes,
		ariaLabel: title,
		children: [
			( title || breadcrumbs || badges ) &&
				/* @__PURE__ */ ( 0, import_jsx_runtime3.jsx )( Header, {
					breadcrumbs,
					badges,
					title,
					subTitle,
					actions,
				} ),
			hasPadding
				? /* @__PURE__ */ ( 0, import_jsx_runtime3.jsx )( 'div', {
						className: 'admin-ui-page__content has-padding',
						children,
				  } )
				: children,
		],
	} );
}
const page_default = Page;

// routes/responses/stage.tsx
const import_i18n = __toESM( require_i18n() );
const import_jsx_runtime4 = __toESM( require_jsx_runtime() );
/**
 *
 */
function stage() {
	return /* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )( page_default, {
		title: ( 0, import_i18n.__ )( 'Form Responses', 'jetpack-forms' ),
		children: /* @__PURE__ */ ( 0, import_jsx_runtime4.jsxs )( 'div', {
			style: { padding: '20px' },
			children: [
				/* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )( 'h2', { children: 'Form Responses' } ),
				/* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )( 'p', {
					children: 'This is a test without DataViews.',
				} ),
				/* @__PURE__ */ ( 0, import_jsx_runtime4.jsxs )( 'ul', {
					children: [
						/* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )( 'li', {
							children: 'Response 1 - John Doe',
						} ),
						/* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )( 'li', {
							children: 'Response 2 - Jane Smith',
						} ),
					],
				} ),
			],
		} ),
	} );
}

// ../../../node_modules/.pnpm/@tanstack+router-core@1.139.12/node_modules/@tanstack/router-core/dist/esm/utils.js
const hasOwn = Object.prototype.hasOwnProperty;
/**
 *
 * @param prev
 * @param _next
 */
function replaceEqualDeep( prev, _next ) {
	if ( prev === _next ) {
		return prev;
	}
	const next = _next;
	const array = isPlainArray( prev ) && isPlainArray( next );
	if ( ! array && ! ( isPlainObject( prev ) && isPlainObject( next ) ) ) return next;
	const prevItems = array ? prev : getEnumerableOwnKeys( prev );
	if ( ! prevItems ) return next;
	const nextItems = array ? next : getEnumerableOwnKeys( next );
	if ( ! nextItems ) return next;
	const prevSize = prevItems.length;
	const nextSize = nextItems.length;
	const copy = array ? new Array( nextSize ) : {};
	let equalItems = 0;
	for ( let i = 0; i < nextSize; i++ ) {
		const key = array ? i : nextItems[ i ];
		const p = prev[ key ];
		const n = next[ key ];
		if ( p === n ) {
			copy[ key ] = p;
			if ( array ? i < prevSize : hasOwn.call( prev, key ) ) equalItems++;
			continue;
		}
		if ( p === null || n === null || typeof p !== 'object' || typeof n !== 'object' ) {
			copy[ key ] = n;
			continue;
		}
		const v = replaceEqualDeep( p, n );
		copy[ key ] = v;
		if ( v === p ) equalItems++;
	}
	return prevSize === nextSize && equalItems === prevSize ? prev : copy;
}
/**
 *
 * @param o
 */
function getEnumerableOwnKeys( o ) {
	const keys = [];
	const names = Object.getOwnPropertyNames( o );
	for ( const name of names ) {
		if ( ! Object.prototype.propertyIsEnumerable.call( o, name ) ) return false;
		keys.push( name );
	}
	const symbols = Object.getOwnPropertySymbols( o );
	for ( const symbol of symbols ) {
		if ( ! Object.prototype.propertyIsEnumerable.call( o, symbol ) ) return false;
		keys.push( symbol );
	}
	return keys;
}
/**
 *
 * @param o
 */
function isPlainObject( o ) {
	if ( ! hasObjectPrototype( o ) ) {
		return false;
	}
	const ctor = o.constructor;
	if ( typeof ctor === 'undefined' ) {
		return true;
	}
	const prot = ctor.prototype;
	if ( ! hasObjectPrototype( prot ) ) {
		return false;
	}
	if ( ! prot.hasOwnProperty( 'isPrototypeOf' ) ) {
		return false;
	}
	return true;
}
/**
 *
 * @param o
 */
function hasObjectPrototype( o ) {
	return Object.prototype.toString.call( o ) === '[object Object]';
}
/**
 *
 * @param value
 */
function isPlainArray( value ) {
	return Array.isArray( value ) && value.length === Object.keys( value ).length;
}

// ../../../node_modules/.pnpm/tiny-invariant@1.3.3/node_modules/tiny-invariant/dist/esm/tiny-invariant.js
const isProduction = false;
const prefix = 'Invariant failed';
/**
 *
 * @param condition
 * @param message
 */
function invariant( condition, message ) {
	if ( condition ) {
		return;
	}
	if ( isProduction ) {
		throw new Error( prefix );
	}
	const provided = typeof message === 'function' ? message() : message;
	const value = provided ? ''.concat( prefix, ': ' ).concat( provided ) : prefix;
	throw new Error( value );
}

// ../../../node_modules/.pnpm/tiny-warning@1.0.3/node_modules/tiny-warning/dist/tiny-warning.esm.js
const isProduction2 = false;
/**
 *
 * @param condition
 * @param message
 */
function warning( condition, message ) {
	if ( ! isProduction2 ) {
		if ( condition ) {
			return;
		}
		const text = 'Warning: ' + message;
		if ( typeof console !== 'undefined' ) {
			console.warn( text );
		}
		try {
			throw Error( text );
		} catch ( x ) {}
	}
}
const tiny_warning_esm_default = warning;

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useMatch.js
const React4 = __toESM( require_react(), 1 );

// ../../../node_modules/.pnpm/@tanstack+react-store@0.8.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-store/dist/esm/index.js
const import_with_selector = __toESM( require_with_selector(), 1 );
/**
 *
 * @param store
 * @param selector
 * @param options
 */
function useStore( store, selector = d => d, options = {} ) {
	const equal = options.equal ?? shallow;
	const slice = ( 0, import_with_selector.useSyncExternalStoreWithSelector )(
		store.subscribe,
		() => store.state,
		() => store.state,
		selector,
		equal
	);
	return slice;
}
/**
 *
 * @param objA
 * @param objB
 */
function shallow( objA, objB ) {
	if ( Object.is( objA, objB ) ) {
		return true;
	}
	if ( typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null ) {
		return false;
	}
	if ( objA instanceof Map && objB instanceof Map ) {
		if ( objA.size !== objB.size ) return false;
		for ( const [ k, v ] of objA ) {
			if ( ! objB.has( k ) || ! Object.is( v, objB.get( k ) ) ) return false;
		}
		return true;
	}
	if ( objA instanceof Set && objB instanceof Set ) {
		if ( objA.size !== objB.size ) return false;
		for ( const v of objA ) {
			if ( ! objB.has( v ) ) return false;
		}
		return true;
	}
	if ( objA instanceof Date && objB instanceof Date ) {
		if ( objA.getTime() !== objB.getTime() ) return false;
		return true;
	}
	const keysA = getOwnKeys( objA );
	if ( keysA.length !== getOwnKeys( objB ).length ) {
		return false;
	}
	for ( let i = 0; i < keysA.length; i++ ) {
		if (
			! Object.prototype.hasOwnProperty.call( objB, keysA[ i ] ) ||
			! Object.is( objA[ keysA[ i ] ], objB[ keysA[ i ] ] )
		) {
			return false;
		}
	}
	return true;
}
/**
 *
 * @param obj
 */
function getOwnKeys( obj ) {
	return Object.keys( obj ).concat( Object.getOwnPropertySymbols( obj ) );
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouterState.js
const import_react = __toESM( require_react(), 1 );

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouter.js
const React2 = __toESM( require_react(), 1 );

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/routerContext.js
const React = __toESM( require_react(), 1 );
const routerContext = React.createContext( null );
/**
 *
 */
function getRouterContext() {
	if ( typeof document === 'undefined' ) {
		return routerContext;
	}
	if ( window.__TSR_ROUTER_CONTEXT__ ) {
		return window.__TSR_ROUTER_CONTEXT__;
	}
	window.__TSR_ROUTER_CONTEXT__ = routerContext;
	return routerContext;
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouter.js
/**
 *
 * @param opts
 */
function useRouter( opts ) {
	const value = React2.useContext( getRouterContext() );
	tiny_warning_esm_default(
		! ( ( opts?.warn ?? true ) && ! value ),
		'useRouter must be used inside a <RouterProvider> component!'
	);
	return value;
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouterState.js
/**
 *
 * @param opts
 */
function useRouterState( opts ) {
	const contextRouter = useRouter( {
		warn: opts?.router === void 0,
	} );
	const router = opts?.router || contextRouter;
	const previousResult = ( 0, import_react.useRef )( void 0 );
	return useStore( router.__store, state => {
		if ( opts?.select ) {
			if ( opts.structuralSharing ?? router.options.defaultStructuralSharing ) {
				const newSlice = replaceEqualDeep( previousResult.current, opts.select( state ) );
				previousResult.current = newSlice;
				return newSlice;
			}
			return opts.select( state );
		}
		return state;
	} );
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/matchContext.js
const React3 = __toESM( require_react(), 1 );
const matchContext = React3.createContext( void 0 );
const dummyMatchContext = React3.createContext( void 0 );

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useMatch.js
/**
 *
 * @param opts
 */
function useMatch( opts ) {
	const nearestMatchId = React4.useContext( opts.from ? dummyMatchContext : matchContext );
	const matchSelection = useRouterState( {
		select: state => {
			const match = state.matches.find( d =>
				opts.from ? opts.from === d.routeId : d.id === nearestMatchId
			);
			invariant(
				! ( ( opts.shouldThrow ?? true ) && ! match ),
				`Could not find ${
					opts.from ? `an active match from "${ opts.from }"` : 'a nearest match!'
				}`
			);
			if ( match === void 0 ) {
				return void 0;
			}
			return opts.select ? opts.select( match ) : match;
		},
		structuralSharing: opts.structuralSharing,
	} );
	return matchSelection;
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useSearch.js
/**
 *
 * @param opts
 */
function useSearch( opts ) {
	return useMatch( {
		from: opts.from,
		strict: opts.strict,
		shouldThrow: opts.shouldThrow,
		structuralSharing: opts.structuralSharing,
		select: match => {
			return opts.select ? opts.select( match.search ) : match.search;
		},
	} );
}

// routes/responses/inspector.tsx
const import_i18n2 = __toESM( require_i18n() );
const import_jsx_runtime5 = __toESM( require_jsx_runtime() );
/**
 *
 */
function inspector() {
	const searchParams = useSearch( { from: '/responses/$view' } );
	const responseIds = searchParams?.responseIds || [];
	if ( ! responseIds.length ) {
		return null;
	}
	return /* @__PURE__ */ ( 0, import_jsx_runtime5.jsx )( page_default, {
		title: ( 0, import_i18n2.__ )( 'Response Details', 'jetpack-forms' ),
		children: /* @__PURE__ */ ( 0, import_jsx_runtime5.jsxs )( 'div', {
			style: { padding: '20px' },
			children: [
				/* @__PURE__ */ ( 0, import_jsx_runtime5.jsx )( 'h3', { children: 'Inspector Panel' } ),
				/* @__PURE__ */ ( 0, import_jsx_runtime5.jsxs )( 'p', {
					children: [ 'Selected response ID: ', responseIds[ 0 ] ],
				} ),
			],
		} ),
	} );
}
export { inspector, stage };
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
