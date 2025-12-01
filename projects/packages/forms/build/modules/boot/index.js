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
const __export = ( target, all ) => {
	for ( const name in all ) __defProp( target, name, { get: all[ name ], enumerable: true } );
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

// package-external:@wordpress/data
const require_data = __commonJS( {
	'package-external:@wordpress/data'( exports, module ) {
		module.exports = window.wp.data;
	},
} );

// package-external:@wordpress/i18n
const require_i18n = __commonJS( {
	'package-external:@wordpress/i18n'( exports, module ) {
		module.exports = window.wp.i18n;
	},
} );

// package-external:@wordpress/components
const require_components = __commonJS( {
	'package-external:@wordpress/components'( exports, module ) {
		module.exports = window.wp.components;
	},
} );

// vendor-external:react/jsx-runtime
const require_jsx_runtime = __commonJS( {
	'vendor-external:react/jsx-runtime'( exports, module ) {
		module.exports = window.ReactJSXRuntime;
	},
} );

// package-external:@wordpress/commands
const require_commands = __commonJS( {
	'package-external:@wordpress/commands'( exports, module ) {
		module.exports = window.wp.commands;
	},
} );

// package-external:@wordpress/theme
const require_theme = __commonJS( {
	'package-external:@wordpress/theme'( exports, module ) {
		module.exports = window.wp.theme;
	},
} );

// package-external:@wordpress/editor
const require_editor = __commonJS( {
	'package-external:@wordpress/editor'( exports, module ) {
		module.exports = window.wp.editor;
	},
} );

// package-external:@wordpress/core-data
const require_core_data = __commonJS( {
	'package-external:@wordpress/core-data'( exports, module ) {
		module.exports = window.wp.coreData;
	},
} );

// package-external:@wordpress/html-entities
const require_html_entities = __commonJS( {
	'package-external:@wordpress/html-entities'( exports, module ) {
		module.exports = window.wp.htmlEntities;
	},
} );

// package-external:@wordpress/primitives
const require_primitives = __commonJS( {
	'package-external:@wordpress/primitives'( exports, module ) {
		module.exports = window.wp.primitives;
	},
} );

// package-external:@wordpress/keycodes
const require_keycodes = __commonJS( {
	'package-external:@wordpress/keycodes'( exports, module ) {
		module.exports = window.wp.keycodes;
	},
} );

// package-external:@wordpress/url
const require_url = __commonJS( {
	'package-external:@wordpress/url'( exports, module ) {
		module.exports = window.wp.url;
	},
} );

// package-external:@wordpress/private-apis
const require_private_apis = __commonJS( {
	'package-external:@wordpress/private-apis'( exports, module ) {
		module.exports = window.wp.privateApis;
	},
} );

// package-external:@wordpress/compose
const require_compose = __commonJS( {
	'package-external:@wordpress/compose'( exports, module ) {
		module.exports = window.wp.compose;
	},
} );

// package-external:@wordpress/keyboard-shortcuts
const require_keyboard_shortcuts = __commonJS( {
	'package-external:@wordpress/keyboard-shortcuts'( exports, module ) {
		module.exports = window.wp.keyboardShortcuts;
	},
} );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/app/index.js
const import_element13 = __toESM( require_element() );
const import_data9 = __toESM( require_data() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/app/router.js
const import_i18n9 = __toESM( require_i18n() );
const import_element12 = __toESM( require_element() );

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

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.4.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a1_a283d82ebd0c75b3ad591802c1444a69/node_modules/@wordpress/admin-ui/build-module/navigable-region/index.js
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

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.4.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a1_a283d82ebd0c75b3ad591802c1444a69/node_modules/@wordpress/admin-ui/build-module/page/header.js
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

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.4.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a1_a283d82ebd0c75b3ad591802c1444a69/node_modules/@wordpress/admin-ui/build-module/page/index.js
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

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/app/router.js
import { privateApis as routePrivateApis5 } from '@wordpress/route';

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/root/index.js
const import_commands2 = __toESM( require_commands() );
const import_theme = __toESM( require_theme() );
const import_editor4 = __toESM( require_editor() );
import { privateApis as routePrivateApis4 } from '@wordpress/route';

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/site-hub/index.js
const import_data2 = __toESM( require_data() );
const import_components2 = __toESM( require_components() );
const import_i18n2 = __toESM( require_i18n() );
const import_core_data2 = __toESM( require_core_data() );
const import_html_entities = __toESM( require_html_entities() );

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/icon/index.js
const import_element2 = __toESM( require_element(), 1 );
const icon_default = ( 0, import_element2.forwardRef )( ( { icon, size = 24, ...props }, ref ) => {
	return ( 0, import_element2.cloneElement )( icon, {
		width: size,
		height: size,
		...props,
		ref,
	} );
} );

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/arrow-up-left.js
const import_primitives = __toESM( require_primitives(), 1 );
const import_jsx_runtime4 = __toESM( require_jsx_runtime(), 1 );
const arrow_up_left_default = /* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )(
	import_primitives.SVG,
	{
		xmlns: 'http://www.w3.org/2000/svg',
		viewBox: '0 0 24 24',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime4.jsx )( import_primitives.Path, {
			d: 'M14 6H6v8h1.5V8.5L17 18l1-1-9.5-9.5H14V6Z',
		} ),
	}
);

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/check.js
const import_primitives2 = __toESM( require_primitives(), 1 );
const import_jsx_runtime5 = __toESM( require_jsx_runtime(), 1 );
const check_default = /* @__PURE__ */ ( 0, import_jsx_runtime5.jsx )( import_primitives2.SVG, {
	xmlns: 'http://www.w3.org/2000/svg',
	viewBox: '0 0 24 24',
	children: /* @__PURE__ */ ( 0, import_jsx_runtime5.jsx )( import_primitives2.Path, {
		d: 'M16.5 7.5 10 13.9l-2.5-2.4-1 1 3.5 3.6 7.5-7.6z',
	} ),
} );

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/chevron-down-small.js
const import_primitives3 = __toESM( require_primitives(), 1 );
const import_jsx_runtime6 = __toESM( require_jsx_runtime(), 1 );
const chevron_down_small_default = /* @__PURE__ */ ( 0, import_jsx_runtime6.jsx )(
	import_primitives3.SVG,
	{
		viewBox: '0 0 24 24',
		xmlns: 'http://www.w3.org/2000/svg',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime6.jsx )( import_primitives3.Path, {
			d: 'm15.99 10.889-3.988 3.418-3.988-3.418.976-1.14 3.012 2.582 3.012-2.581.976 1.139Z',
		} ),
	}
);

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/chevron-left-small.js
const import_primitives4 = __toESM( require_primitives(), 1 );
const import_jsx_runtime7 = __toESM( require_jsx_runtime(), 1 );
const chevron_left_small_default = /* @__PURE__ */ ( 0, import_jsx_runtime7.jsx )(
	import_primitives4.SVG,
	{
		xmlns: 'http://www.w3.org/2000/svg',
		viewBox: '0 0 24 24',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime7.jsx )( import_primitives4.Path, {
			d: 'm13.1 16-3.4-4 3.4-4 1.1 1-2.6 3 2.6 3-1.1 1z',
		} ),
	}
);

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/chevron-left.js
const import_primitives5 = __toESM( require_primitives(), 1 );
const import_jsx_runtime8 = __toESM( require_jsx_runtime(), 1 );
const chevron_left_default = /* @__PURE__ */ ( 0, import_jsx_runtime8.jsx )(
	import_primitives5.SVG,
	{
		xmlns: 'http://www.w3.org/2000/svg',
		viewBox: '0 0 24 24',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime8.jsx )( import_primitives5.Path, {
			d: 'M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z',
		} ),
	}
);

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/chevron-right-small.js
const import_primitives6 = __toESM( require_primitives(), 1 );
const import_jsx_runtime9 = __toESM( require_jsx_runtime(), 1 );
const chevron_right_small_default = /* @__PURE__ */ ( 0, import_jsx_runtime9.jsx )(
	import_primitives6.SVG,
	{
		xmlns: 'http://www.w3.org/2000/svg',
		viewBox: '0 0 24 24',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime9.jsx )( import_primitives6.Path, {
			d: 'M10.8622 8.04053L14.2805 12.0286L10.8622 16.0167L9.72327 15.0405L12.3049 12.0286L9.72327 9.01672L10.8622 8.04053Z',
		} ),
	}
);

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/chevron-right.js
const import_primitives7 = __toESM( require_primitives(), 1 );
const import_jsx_runtime10 = __toESM( require_jsx_runtime(), 1 );
const chevron_right_default = /* @__PURE__ */ ( 0, import_jsx_runtime10.jsx )(
	import_primitives7.SVG,
	{
		xmlns: 'http://www.w3.org/2000/svg',
		viewBox: '0 0 24 24',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime10.jsx )( import_primitives7.Path, {
			d: 'M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z',
		} ),
	}
);

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/search.js
const import_primitives8 = __toESM( require_primitives(), 1 );
const import_jsx_runtime11 = __toESM( require_jsx_runtime(), 1 );
const search_default = /* @__PURE__ */ ( 0, import_jsx_runtime11.jsx )( import_primitives8.SVG, {
	xmlns: 'http://www.w3.org/2000/svg',
	viewBox: '0 0 24 24',
	children: /* @__PURE__ */ ( 0, import_jsx_runtime11.jsx )( import_primitives8.Path, {
		d: 'M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z',
	} ),
} );

// ../../../node_modules/.pnpm/@wordpress+icons@11.3.1-next.8b30e05b0.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e_01f35022f3b1e7a734334ae195ecbe1b/node_modules/@wordpress/icons/build-module/library/wordpress.js
const import_primitives9 = __toESM( require_primitives(), 1 );
const import_jsx_runtime12 = __toESM( require_jsx_runtime(), 1 );
const wordpress_default = /* @__PURE__ */ ( 0, import_jsx_runtime12.jsx )( import_primitives9.SVG, {
	xmlns: 'http://www.w3.org/2000/svg',
	viewBox: '-2 -2 24 24',
	children: /* @__PURE__ */ ( 0, import_jsx_runtime12.jsx )( import_primitives9.Path, {
		d: 'M20 10c0-5.51-4.49-10-10-10C4.48 0 0 4.49 0 10c0 5.52 4.48 10 10 10 5.51 0 10-4.48 10-10zM7.78 15.37L4.37 6.22c.55-.02 1.17-.08 1.17-.08.5-.06.44-1.13-.06-1.11 0 0-1.45.11-2.37.11-.18 0-.37 0-.58-.01C4.12 2.69 6.87 1.11 10 1.11c2.33 0 4.45.87 6.05 2.34-.68-.11-1.65.39-1.65 1.58 0 .74.45 1.36.9 2.1.35.61.55 1.36.55 2.46 0 1.49-1.4 5-1.4 5l-3.03-8.37c.54-.02.82-.17.82-.17.5-.05.44-1.25-.06-1.22 0 0-1.44.12-2.38.12-.87 0-2.33-.12-2.33-.12-.5-.03-.56 1.2-.06 1.22l.92.08 1.26 3.41zM17.41 10c.24-.64.74-1.87.43-4.25.7 1.29 1.05 2.71 1.05 4.25 0 3.29-1.73 6.24-4.4 7.78.97-2.59 1.94-5.2 2.92-7.78zM6.1 18.09C3.12 16.65 1.11 13.53 1.11 10c0-1.3.23-2.48.72-3.59C3.25 10.3 4.67 14.2 6.1 18.09zm4.03-6.63l2.58 6.98c-.86.29-1.76.45-2.71.45-.79 0-1.57-.11-2.29-.33.81-2.38 1.62-4.74 2.42-7.1z',
	} ),
} );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/site-hub/index.js
const import_keycodes = __toESM( require_keycodes() );
const import_commands = __toESM( require_commands() );
const import_url = __toESM( require_url() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/site-icon-link/index.js
import { Link, privateApis as routePrivateApis } from '@wordpress/route';

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/lock-unlock.js
const import_private_apis = __toESM( require_private_apis() );
const { lock, unlock } = ( 0,
import_private_apis.__dangerousOptInToUnstableAPIsOnlyForCoreModules )(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/boot'
);

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/site-icon/index.js
const import_data = __toESM( require_data() );
const import_i18n = __toESM( require_i18n() );
const import_core_data = __toESM( require_core_data() );
const import_jsx_runtime13 = __toESM( require_jsx_runtime() );
const css = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-site-icon {
  display: flex;
}

.boot-site-icon__icon {
  width: 32px;
  height: 32px;
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
}

.boot-site-icon__image {
  width: 32px;
  height: 32px;
  object-fit: cover;
  aspect-ratio: 1/1;
  border-radius: var(--wpds-border-radius-medium, 4px);
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvc2l0ZS1pY29uIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fdmFyaWFibGVzLnNjc3MiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fY29sb3JzLnNjc3MiLCJzdHlsZS5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FDQUE7QUFBQTtBQUFBO0FEVUE7QUFBQTtBQUFBO0FBT0E7QUFBQTtBQUFBO0FBNkJBO0FBQUE7QUFBQTtBQUFBO0FBaUJBO0FBQUE7QUFBQTtBQVdBO0FBQUE7QUFBQTtBQWdCQTtBQUFBO0FBQUE7QUF5QkE7QUFBQTtBQUFBO0FBS0E7QUFBQTtBQUFBO0FBZUE7QUFBQTtBQUFBO0FBbUJBO0FBQUE7QUFBQTtBQVNBO0FBQUE7QUFBQTtBQUFBO0FFaktBO0VBQ0M7OztBQUdEO0VBQ0MsT0ZrRGM7RUVqRGQsUUZpRGM7RUVoRGQ7OztBQUdEO0VBQ0MsT0Y0Q2M7RUUzQ2QsUUYyQ2M7RUUxQ2Q7RUFDQTtFQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTQ1NTIFZhcmlhYmxlcy5cbiAqXG4gKiBQbGVhc2UgdXNlIHZhcmlhYmxlcyBmcm9tIHRoaXMgc2hlZXQgdG8gZW5zdXJlIGNvbnNpc3RlbmN5IGFjcm9zcyB0aGUgVUkuXG4gKiBEb24ndCBhZGQgdG8gdGhpcyBzaGVldCB1bmxlc3MgeW91J3JlIHByZXR0eSBzdXJlIHRoZSB2YWx1ZSB3aWxsIGJlIHJldXNlZCBpbiBtYW55IHBsYWNlcy5cbiAqIEZvciBleGFtcGxlLCBkb24ndCBhZGQgcnVsZXMgdG8gdGhpcyBzaGVldCB0aGF0IGFmZmVjdCBibG9jayB2aXN1YWxzLiBJdCdzIHB1cmVseSBmb3IgVUkuXG4gKi9cblxuQHVzZSBcIi4vY29sb3JzXCI7XG5cbi8qKlxuICogRm9udHMgJiBiYXNpYyB2YXJpYWJsZXMuXG4gKi9cblxuJGRlZmF1bHQtZm9udDogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmOyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGZhbWlseSB2YXJpYWJsZXNcbiRkZWZhdWx0LWxpbmUtaGVpZ2h0OiAxLjQ7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkbGluZS1oZWlnaHQgdG9rZW5zXG5cbi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbi8vIFNpemVzXG4kZm9udC1zaXplLXgtc21hbGw6IDExcHg7XG4kZm9udC1zaXplLXNtYWxsOiAxMnB4O1xuJGZvbnQtc2l6ZS1tZWRpdW06IDEzcHg7XG4kZm9udC1zaXplLWxhcmdlOiAxNXB4O1xuJGZvbnQtc2l6ZS14LWxhcmdlOiAyMHB4O1xuJGZvbnQtc2l6ZS0yeC1sYXJnZTogMzJweDtcblxuLy8gTGluZSBoZWlnaHRzXG4kZm9udC1saW5lLWhlaWdodC14LXNtYWxsOiAxNnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtc21hbGw6IDIwcHg7XG4kZm9udC1saW5lLWhlaWdodC1tZWRpdW06IDI0cHg7XG4kZm9udC1saW5lLWhlaWdodC1sYXJnZTogMjhweDtcbiRmb250LWxpbmUtaGVpZ2h0LXgtbGFyZ2U6IDMycHg7XG4kZm9udC1saW5lLWhlaWdodC0yeC1sYXJnZTogNDBweDtcblxuLy8gV2VpZ2h0c1xuJGZvbnQtd2VpZ2h0LXJlZ3VsYXI6IDQwMDtcbiRmb250LXdlaWdodC1tZWRpdW06IDQ5OTsgLy8gZW5zdXJlcyBmYWxsYmFjayB0byA0MDAgKGluc3RlYWQgb2YgNjAwKVxuXG4vLyBGYW1pbGllc1xuJGZvbnQtZmFtaWx5LWhlYWRpbmdzOiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktYm9keTogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LW1vbm86IE1lbmxvLCBDb25zb2xhcywgbW9uYWNvLCBtb25vc3BhY2U7XG5cbi8qKlxuICogR3JpZCBTeXN0ZW0uXG4gKiBodHRwczovL21ha2Uud29yZHByZXNzLm9yZy9kZXNpZ24vMjAxOS8xMC8zMS9wcm9wb3NhbC1hLWNvbnNpc3RlbnQtc3BhY2luZy1zeXN0ZW0tZm9yLXdvcmRwcmVzcy9cbiAqL1xuXG4kZ3JpZC11bml0OiA4cHg7XG4kZ3JpZC11bml0LTA1OiAwLjUgKiAkZ3JpZC11bml0O1x0Ly8gNHB4XG4kZ3JpZC11bml0LTEwOiAxICogJGdyaWQtdW5pdDtcdFx0Ly8gOHB4XG4kZ3JpZC11bml0LTE1OiAxLjUgKiAkZ3JpZC11bml0O1x0Ly8gMTJweFxuJGdyaWQtdW5pdC0yMDogMiAqICRncmlkLXVuaXQ7XHRcdC8vIDE2cHhcbiRncmlkLXVuaXQtMzA6IDMgKiAkZ3JpZC11bml0O1x0XHQvLyAyNHB4XG4kZ3JpZC11bml0LTQwOiA0ICogJGdyaWQtdW5pdDtcdFx0Ly8gMzJweFxuJGdyaWQtdW5pdC01MDogNSAqICRncmlkLXVuaXQ7XHRcdC8vIDQwcHhcbiRncmlkLXVuaXQtNjA6IDYgKiAkZ3JpZC11bml0O1x0XHQvLyA0OHB4XG4kZ3JpZC11bml0LTcwOiA3ICogJGdyaWQtdW5pdDtcdFx0Ly8gNTZweFxuJGdyaWQtdW5pdC04MDogOCAqICRncmlkLXVuaXQ7XHRcdC8vIDY0cHhcblxuLyoqXG4gKiBSYWRpdXMgc2NhbGUuXG4gKi9cblxuJHJhZGl1cy14LXNtYWxsOiAxcHg7ICAgLy8gQXBwbGllZCB0byBlbGVtZW50cyBsaWtlIGJ1dHRvbnMgbmVzdGVkIHdpdGhpbiBwcmltaXRpdmVzIGxpa2UgaW5wdXRzLlxuJHJhZGl1cy1zbWFsbDogMnB4OyAgICAgLy8gQXBwbGllZCB0byBtb3N0IHByaW1pdGl2ZXMuXG4kcmFkaXVzLW1lZGl1bTogNHB4OyAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBzbWFsbGVyIHBhZGRpbmcuXG4kcmFkaXVzLWxhcmdlOiA4cHg7ICAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBsYXJnZXIgcGFkZGluZy5cbiRyYWRpdXMtZnVsbDogOTk5OXB4OyAgIC8vIEZvciBwaWxscy5cbiRyYWRpdXMtcm91bmQ6IDUwJTsgICAgIC8vIEZvciBjaXJjbGVzIGFuZCBvdmFscy5cblxuLyoqXG4gKiBFbGV2YXRpb24gc2NhbGUuXG4gKi9cblxuLy8gRm9yIHNlY3Rpb25zIGFuZCBjb250YWluZXJzIHRoYXQgZ3JvdXAgcmVsYXRlZCBjb250ZW50IGFuZCBjb250cm9scywgd2hpY2ggbWF5IG92ZXJsYXAgb3RoZXIgY29udGVudC4gRXhhbXBsZTogUHJldmlldyBGcmFtZS5cbiRlbGV2YXRpb24teC1zbWFsbDogMCAxcHggMXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDNweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCA0cHggNHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMSk7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgcHJvdmlkZSBjb250ZXh0dWFsIGZlZWRiYWNrIHdpdGhvdXQgYmVpbmcgaW50cnVzaXZlLiBHZW5lcmFsbHkgbm9uLWludGVycnVwdGl2ZS4gRXhhbXBsZTogVG9vbHRpcHMsIFNuYWNrYmFyLlxuJGVsZXZhdGlvbi1zbWFsbDogMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDZweCA2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCA4cHggOHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgb2ZmZXIgYWRkaXRpb25hbCBhY3Rpb25zLiBFeGFtcGxlOiBNZW51cywgQ29tbWFuZCBQYWxldHRlXG4kZWxldmF0aW9uLW1lZGl1bTogMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgNHB4IDVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDEycHggMTJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDE2cHggMTZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IGNvbmZpcm0gZGVjaXNpb25zIG9yIGhhbmRsZSBuZWNlc3NhcnkgaW50ZXJydXB0aW9ucy4gRXhhbXBsZTogTW9kYWxzLlxuJGVsZXZhdGlvbi1sYXJnZTogMCA1cHggMTVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDgpLCAwIDE1cHggMjdweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDcpLCAwIDMwcHggMzZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDUwcHggNDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vKipcbiAqIERpbWVuc2lvbnMuXG4gKi9cblxuJGljb24tc2l6ZTogMjRweDtcbiRidXR0b24tc2l6ZTogMzZweDtcbiRidXR0b24tc2l6ZS1uZXh0LWRlZmF1bHQtNDBweDogNDBweDsgLy8gdHJhbnNpdGlvbmFyeSB2YXJpYWJsZSBmb3IgbmV4dCBkZWZhdWx0IGJ1dHRvbiBzaXplXG4kYnV0dG9uLXNpemUtc21hbGw6IDI0cHg7XG4kYnV0dG9uLXNpemUtY29tcGFjdDogMzJweDtcbiRoZWFkZXItaGVpZ2h0OiA2NHB4O1xuJHBhbmVsLWhlYWRlci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kbmF2LXNpZGViYXItd2lkdGg6IDMwMHB4O1xuJGFkbWluLWJhci1oZWlnaHQ6IDMycHg7XG4kYWRtaW4tYmFyLWhlaWdodC1iaWc6IDQ2cHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aDogMTYwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1iaWc6IDE5MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkOiAzNnB4O1xuJG1vZGFsLW1pbi13aWR0aDogMzUwcHg7XG4kbW9kYWwtd2lkdGgtc21hbGw6IDM4NHB4O1xuJG1vZGFsLXdpZHRoLW1lZGl1bTogNTEycHg7XG4kbW9kYWwtd2lkdGgtbGFyZ2U6IDg0MHB4O1xuJHNwaW5uZXItc2l6ZTogMTZweDtcbiRjYW52YXMtcGFkZGluZzogJGdyaWQtdW5pdC0yMDtcbiRwYWxldHRlLW1heC1oZWlnaHQ6IDM2OHB4O1xuXG4vKipcbiAqIE1vYmlsZSBzcGVjaWZpYyBzdHlsZXNcbiAqL1xuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemU6IDE2cHg7IC8vIEFueSBmb250IHNpemUgYmVsb3cgMTZweCB3aWxsIGNhdXNlIE1vYmlsZSBTYWZhcmkgdG8gXCJ6b29tIGluXCIuXG5cbi8qKlxuICogRWRpdG9yIHN0eWxlcy5cbiAqL1xuXG4kc2lkZWJhci13aWR0aDogMjgwcHg7XG4kY29udGVudC13aWR0aDogODQwcHg7XG4kd2lkZS1jb250ZW50LXdpZHRoOiAxMTAwcHg7XG4kd2lkZ2V0LWFyZWEtd2lkdGg6IDcwMHB4O1xuJHNlY29uZGFyeS1zaWRlYmFyLXdpZHRoOiAzNTBweDtcbiRlZGl0b3ItZm9udC1zaXplOiAxNnB4O1xuJGRlZmF1bHQtYmxvY2stbWFyZ2luOiAyOHB4OyAvLyBUaGlzIHZhbHVlIHByb3ZpZGVzIGEgY29uc2lzdGVudCwgY29udGlndW91cyBzcGFjaW5nIGJldHdlZW4gYmxvY2tzLlxuJHRleHQtZWRpdG9yLWZvbnQtc2l6ZTogMTVweDtcbiRlZGl0b3ItbGluZS1oZWlnaHQ6IDEuODtcbiRlZGl0b3ItaHRtbC1mb250OiAkZm9udC1mYW1pbHktbW9ubztcblxuLyoqXG4gKiBCbG9jayAmIEVkaXRvciBVSS5cbiAqL1xuXG4kYmxvY2stdG9vbGJhci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kYm9yZGVyLXdpZHRoOiAxcHg7XG4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrOiAycHg7IC8vIFRoaXMgZXhpc3RzIGFzIGEgZmFsbGJhY2ssIGFuZCBpcyBpZGVhbGx5IG92ZXJyaWRkZW4gYnkgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB1bmxlc3MgaW4gc29tZSBTQVNTIG1hdGggY2FzZXMuXG4kYm9yZGVyLXdpZHRoLXRhYjogMS41cHg7XG4kaGVscHRleHQtZm9udC1zaXplOiAxMnB4O1xuJHJhZGlvLWlucHV0LXNpemU6IDE2cHg7XG4kcmFkaW8taW5wdXQtc2l6ZS1zbTogMjRweDsgLy8gV2lkdGggJiBoZWlnaHQgZm9yIHNtYWxsIHZpZXdwb3J0cy5cblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGJsb2NrLXBhZGRpbmc6IDE0cHg7IC8vIFVzZWQgdG8gZGVmaW5lIHNwYWNlIGJldHdlZW4gYmxvY2sgZm9vdHByaW50IGFuZCBzdXJyb3VuZGluZyBib3JkZXJzLlxuJHJhZGl1cy1ibG9jay11aTogJHJhZGl1cy1zbWFsbDtcbiRzaGFkb3ctcG9wb3ZlcjogJGVsZXZhdGlvbi14LXNtYWxsO1xuJHNoYWRvdy1tb2RhbDogJGVsZXZhdGlvbi1sYXJnZTtcbiRkZWZhdWx0LWZvbnQtc2l6ZTogJGZvbnQtc2l6ZS1tZWRpdW07XG5cbi8qKlxuICogQmxvY2sgcGFkZGluZ3MuXG4gKi9cblxuLy8gUGFkZGluZyBmb3IgYmxvY2tzIHdpdGggYSBiYWNrZ3JvdW5kIGNvbG9yIChlLmcuIHBhcmFncmFwaCBvciBncm91cCkuXG4kYmxvY2stYmctcGFkZGluZy0tdjogMS4yNWVtO1xuJGJsb2NrLWJnLXBhZGRpbmctLWg6IDIuMzc1ZW07XG5cblxuLyoqXG4gKiBSZWFjdCBOYXRpdmUgc3BlY2lmaWMuXG4gKiBUaGVzZSB2YXJpYWJsZXMgZG8gbm90IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlIGVsc2UuXG4gKi9cblxuLy8gRGltZW5zaW9ucy5cbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1leHBhbmRlZC1oZWlnaHQ6IDUycHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLW1hcmdpbjogOHB4O1xuJG1vYmlsZS1jb2xvci1zd2F0Y2g6IDQ4cHg7XG5cbi8vIEJsb2NrIFVJLlxuJG1vYmlsZS1ibG9jay10b29sYmFyLWhlaWdodDogNDRweDtcbiRkaW1tZWQtb3BhY2l0eTogMTtcbiRibG9jay1lZGdlLXRvLWNvbnRlbnQ6IDE2cHg7XG4kc29saWQtYm9yZGVyLXNwYWNlOiAxMnB4O1xuJGRhc2hlZC1ib3JkZXItc3BhY2U6IDZweDtcbiRibG9jay1zZWxlY3RlZC1tYXJnaW46IDNweDtcbiRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg6IDFweDtcbiRibG9jay1zZWxlY3RlZC1wYWRkaW5nOiAwO1xuJGJsb2NrLXNlbGVjdGVkLWNoaWxkLW1hcmdpbjogNXB4O1xuJGJsb2NrLXNlbGVjdGVkLXRvLWNvbnRlbnQ6ICRibG9jay1lZGdlLXRvLWNvbnRlbnQgLSAkYmxvY2stc2VsZWN0ZWQtbWFyZ2luIC0gJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDtcbiIsIi8qKlxuICogQ29sb3JzXG4gKi9cblxuLy8gV29yZFByZXNzIGdyYXlzLlxuJGJsYWNrOiAjMDAwO1x0XHRcdC8vIFVzZSBvbmx5IHdoZW4geW91IHRydWx5IG5lZWQgcHVyZSBibGFjay4gRm9yIFVJLCB1c2UgJGdyYXktOTAwLlxuJGdyYXktOTAwOiAjMWUxZTFlO1xuJGdyYXktODAwOiAjMmYyZjJmO1xuJGdyYXktNzAwOiAjNzU3NTc1O1x0XHQvLyBNZWV0cyA0LjY6MSAoNC41OjEgaXMgbWluaW11bSkgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNjAwOiAjOTQ5NDk0O1x0XHQvLyBNZWV0cyAzOjEgVUkgb3IgbGFyZ2UgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNDAwOiAjY2NjO1xuJGdyYXktMzAwOiAjZGRkO1x0XHQvLyBVc2VkIGZvciBtb3N0IGJvcmRlcnMuXG4kZ3JheS0yMDA6ICNlMGUwZTA7XHRcdC8vIFVzZWQgc3BhcmluZ2x5IGZvciBsaWdodCBib3JkZXJzLlxuJGdyYXktMTAwOiAjZjBmMGYwO1x0XHQvLyBVc2VkIGZvciBsaWdodCBncmF5IGJhY2tncm91bmRzLlxuJHdoaXRlOiAjZmZmO1xuXG4vLyBPcGFjaXRpZXMgJiBhZGRpdGlvbmFsIGNvbG9ycy5cbiRkYXJrLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjYyKTtcbiRtZWRpdW0tZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNTUpO1xuJGxpZ2h0LWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJHdoaXRlLCAwLjY1KTtcblxuLy8gQWxlcnQgY29sb3JzLlxuJGFsZXJ0LXllbGxvdzogI2YwYjg0OTtcbiRhbGVydC1yZWQ6ICNjYzE4MTg7XG4kYWxlcnQtZ3JlZW46ICM0YWI4NjY7XG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRkYXJrLXRoZW1lLWZvY3VzOiAkd2hpdGU7XHQvLyBGb2N1cyBjb2xvciB3aGVuIHRoZSB0aGVtZSBpcyBkYXJrLlxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvdmFyaWFibGVzXCI7XG5cbi5ib290LXNpdGUtaWNvbiB7XG5cdGRpc3BsYXk6IGZsZXg7XG59XG5cbi5ib290LXNpdGUtaWNvbl9faWNvbiB7XG5cdHdpZHRoOiB2YXJpYWJsZXMuJGdyaWQtdW5pdC00MDtcblx0aGVpZ2h0OiB2YXJpYWJsZXMuJGdyaWQtdW5pdC00MDtcblx0Y29sb3I6IHZhcigtLXdwZHMtY29sb3ItZmctY29udGVudC1uZXV0cmFsLCAjMWUxZTFlKTtcbn1cblxuLmJvb3Qtc2l0ZS1pY29uX19pbWFnZSB7XG5cdHdpZHRoOiB2YXJpYWJsZXMuJGdyaWQtdW5pdC00MDtcblx0aGVpZ2h0OiB2YXJpYWJsZXMuJGdyaWQtdW5pdC00MDtcblx0b2JqZWN0LWZpdDogY292ZXI7XG5cdGFzcGVjdC1yYXRpbzogMSAvIDE7XG5cdGJvcmRlci1yYWRpdXM6IHZhcigtLXdwZHMtYm9yZGVyLXJhZGl1cy1tZWRpdW0sIDRweCk7XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css ) );
/**
 *
 * @param root0
 * @param root0.className
 */
function SiteIcon( { className } ) {
	const { isRequestingSite, siteIconUrl } = ( 0, import_data.useSelect )( select => {
		const { getEntityRecord } = select( import_core_data.store );
		const siteData = getEntityRecord( 'root', '__unstableBase', void 0 );
		return {
			isRequestingSite: ! siteData,
			siteIconUrl: siteData?.site_icon_url,
		};
	}, [] );
	let icon = null;
	if ( isRequestingSite && ! siteIconUrl ) {
		icon = /* @__PURE__ */ ( 0, import_jsx_runtime13.jsx )( 'div', {
			className: 'boot-site-icon__image',
		} );
	} else {
		icon = siteIconUrl
			? /* @__PURE__ */ ( 0, import_jsx_runtime13.jsx )( 'img', {
					className: 'boot-site-icon__image',
					alt: ( 0, import_i18n.__ )( 'Site Icon' ),
					src: siteIconUrl,
			  } )
			: /* @__PURE__ */ ( 0, import_jsx_runtime13.jsx )( icon_default, {
					className: 'boot-site-icon__icon',
					icon: wordpress_default,
					size: 48,
			  } );
	}
	return /* @__PURE__ */ ( 0, import_jsx_runtime13.jsx )( 'div', {
		className: clsx_default( className, 'boot-site-icon' ),
		children: icon,
	} );
}
const site_icon_default = SiteIcon;

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/site-icon-link/index.js
const import_jsx_runtime14 = __toESM( require_jsx_runtime() );
const css2 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-site-icon-link {
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--wpds-color-bg-surface-neutral-weak, #f0f0f0);
  text-decoration: none;
}
@media not (prefers-reduced-motion) {
  .boot-site-icon-link {
    transition: outline 0.1s ease-out;
  }
}
.boot-site-icon-link:focus:not(:active) {
  outline: var(--wpds-border-width-focus, 2px) solid var(--wpds-color-stroke-focus-brand, #0073aa);
  outline-offset: calc(-1 * var(--wpds-border-width-focus, 2px));
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvc2l0ZS1pY29uLWxpbmsiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL192YXJpYWJsZXMuc2NzcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL19jb2xvcnMuc2NzcyIsInN0eWxlLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUNBQTtBQUFBO0FBQUE7QURVQTtBQUFBO0FBQUE7QUFPQTtBQUFBO0FBQUE7QUE2QkE7QUFBQTtBQUFBO0FBQUE7QUFpQkE7QUFBQTtBQUFBO0FBV0E7QUFBQTtBQUFBO0FBZ0JBO0FBQUE7QUFBQTtBQXlCQTtBQUFBO0FBQUE7QUFLQTtBQUFBO0FBQUE7QUFlQTtBQUFBO0FBQUE7QUFtQkE7QUFBQTtBQUFBO0FBU0E7QUFBQTtBQUFBO0FBQUE7QUUvSkE7RUFDQyxPRjhGZTtFRTdGZixRRjZGZTtFRTVGZjtFQUNBO0VBQ0E7RUFDQTtFQUNBOztBQUVBO0VBVEQ7SUFVRTs7O0FBR0Q7RUFDQyxTQUNDO0VBRUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNDU1MgVmFyaWFibGVzLlxuICpcbiAqIFBsZWFzZSB1c2UgdmFyaWFibGVzIGZyb20gdGhpcyBzaGVldCB0byBlbnN1cmUgY29uc2lzdGVuY3kgYWNyb3NzIHRoZSBVSS5cbiAqIERvbid0IGFkZCB0byB0aGlzIHNoZWV0IHVubGVzcyB5b3UncmUgcHJldHR5IHN1cmUgdGhlIHZhbHVlIHdpbGwgYmUgcmV1c2VkIGluIG1hbnkgcGxhY2VzLlxuICogRm9yIGV4YW1wbGUsIGRvbid0IGFkZCBydWxlcyB0byB0aGlzIHNoZWV0IHRoYXQgYWZmZWN0IGJsb2NrIHZpc3VhbHMuIEl0J3MgcHVyZWx5IGZvciBVSS5cbiAqL1xuXG5AdXNlIFwiLi9jb2xvcnNcIjtcblxuLyoqXG4gKiBGb250cyAmIGJhc2ljIHZhcmlhYmxlcy5cbiAqL1xuXG4kZGVmYXVsdC1mb250OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCxcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkZmFtaWx5IHZhcmlhYmxlc1xuJGRlZmF1bHQtbGluZS1oZWlnaHQ6IDEuNDsgLy8gVG9kbzogZGVwcmVjYXRlIGluIGZhdm9yIG9mICRsaW5lLWhlaWdodCB0b2tlbnNcblxuLyoqXG4gKiBUeXBvZ3JhcGh5XG4gKi9cblxuLy8gU2l6ZXNcbiRmb250LXNpemUteC1zbWFsbDogMTFweDtcbiRmb250LXNpemUtc21hbGw6IDEycHg7XG4kZm9udC1zaXplLW1lZGl1bTogMTNweDtcbiRmb250LXNpemUtbGFyZ2U6IDE1cHg7XG4kZm9udC1zaXplLXgtbGFyZ2U6IDIwcHg7XG4kZm9udC1zaXplLTJ4LWxhcmdlOiAzMnB4O1xuXG4vLyBMaW5lIGhlaWdodHNcbiRmb250LWxpbmUtaGVpZ2h0LXgtc21hbGw6IDE2cHg7XG4kZm9udC1saW5lLWhlaWdodC1zbWFsbDogMjBweDtcbiRmb250LWxpbmUtaGVpZ2h0LW1lZGl1bTogMjRweDtcbiRmb250LWxpbmUtaGVpZ2h0LWxhcmdlOiAyOHB4O1xuJGZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTogMzJweDtcbiRmb250LWxpbmUtaGVpZ2h0LTJ4LWxhcmdlOiA0MHB4O1xuXG4vLyBXZWlnaHRzXG4kZm9udC13ZWlnaHQtcmVndWxhcjogNDAwO1xuJGZvbnQtd2VpZ2h0LW1lZGl1bTogNDk5OyAvLyBlbnN1cmVzIGZhbGxiYWNrIHRvIDQwMCAoaW5zdGVhZCBvZiA2MDApXG5cbi8vIEZhbWlsaWVzXG4kZm9udC1mYW1pbHktaGVhZGluZ3M6IC1hcHBsZS1zeXN0ZW0sIFwic3lzdGVtLXVpXCIsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiRmb250LWZhbWlseS1ib2R5OiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktbW9ubzogTWVubG8sIENvbnNvbGFzLCBtb25hY28sIG1vbm9zcGFjZTtcblxuLyoqXG4gKiBHcmlkIFN5c3RlbS5cbiAqIGh0dHBzOi8vbWFrZS53b3JkcHJlc3Mub3JnL2Rlc2lnbi8yMDE5LzEwLzMxL3Byb3Bvc2FsLWEtY29uc2lzdGVudC1zcGFjaW5nLXN5c3RlbS1mb3Itd29yZHByZXNzL1xuICovXG5cbiRncmlkLXVuaXQ6IDhweDtcbiRncmlkLXVuaXQtMDU6IDAuNSAqICRncmlkLXVuaXQ7XHQvLyA0cHhcbiRncmlkLXVuaXQtMTA6IDEgKiAkZ3JpZC11bml0O1x0XHQvLyA4cHhcbiRncmlkLXVuaXQtMTU6IDEuNSAqICRncmlkLXVuaXQ7XHQvLyAxMnB4XG4kZ3JpZC11bml0LTIwOiAyICogJGdyaWQtdW5pdDtcdFx0Ly8gMTZweFxuJGdyaWQtdW5pdC0zMDogMyAqICRncmlkLXVuaXQ7XHRcdC8vIDI0cHhcbiRncmlkLXVuaXQtNDA6IDQgKiAkZ3JpZC11bml0O1x0XHQvLyAzMnB4XG4kZ3JpZC11bml0LTUwOiA1ICogJGdyaWQtdW5pdDtcdFx0Ly8gNDBweFxuJGdyaWQtdW5pdC02MDogNiAqICRncmlkLXVuaXQ7XHRcdC8vIDQ4cHhcbiRncmlkLXVuaXQtNzA6IDcgKiAkZ3JpZC11bml0O1x0XHQvLyA1NnB4XG4kZ3JpZC11bml0LTgwOiA4ICogJGdyaWQtdW5pdDtcdFx0Ly8gNjRweFxuXG4vKipcbiAqIFJhZGl1cyBzY2FsZS5cbiAqL1xuXG4kcmFkaXVzLXgtc21hbGw6IDFweDsgICAvLyBBcHBsaWVkIHRvIGVsZW1lbnRzIGxpa2UgYnV0dG9ucyBuZXN0ZWQgd2l0aGluIHByaW1pdGl2ZXMgbGlrZSBpbnB1dHMuXG4kcmFkaXVzLXNtYWxsOiAycHg7ICAgICAvLyBBcHBsaWVkIHRvIG1vc3QgcHJpbWl0aXZlcy5cbiRyYWRpdXMtbWVkaXVtOiA0cHg7ICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIHNtYWxsZXIgcGFkZGluZy5cbiRyYWRpdXMtbGFyZ2U6IDhweDsgICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIGxhcmdlciBwYWRkaW5nLlxuJHJhZGl1cy1mdWxsOiA5OTk5cHg7ICAgLy8gRm9yIHBpbGxzLlxuJHJhZGl1cy1yb3VuZDogNTAlOyAgICAgLy8gRm9yIGNpcmNsZXMgYW5kIG92YWxzLlxuXG4vKipcbiAqIEVsZXZhdGlvbiBzY2FsZS5cbiAqL1xuXG4vLyBGb3Igc2VjdGlvbnMgYW5kIGNvbnRhaW5lcnMgdGhhdCBncm91cCByZWxhdGVkIGNvbnRlbnQgYW5kIGNvbnRyb2xzLCB3aGljaCBtYXkgb3ZlcmxhcCBvdGhlciBjb250ZW50LiBFeGFtcGxlOiBQcmV2aWV3IEZyYW1lLlxuJGVsZXZhdGlvbi14LXNtYWxsOiAwIDFweCAxcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMiksIDAgM3B4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDRweCA0cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAxKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBwcm92aWRlIGNvbnRleHR1YWwgZmVlZGJhY2sgd2l0aG91dCBiZWluZyBpbnRydXNpdmUuIEdlbmVyYWxseSBub24taW50ZXJydXB0aXZlLiBFeGFtcGxlOiBUb29sdGlwcywgU25hY2tiYXIuXG4kZWxldmF0aW9uLXNtYWxsOiAwIDFweCAycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNnB4IDZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDhweCA4cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBvZmZlciBhZGRpdGlvbmFsIGFjdGlvbnMuIEV4YW1wbGU6IE1lbnVzLCBDb21tYW5kIFBhbGV0dGVcbiRlbGV2YXRpb24tbWVkaXVtOiAwIDJweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCA0cHggNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgMTJweCAxMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMTZweCAxNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgY29uZmlybSBkZWNpc2lvbnMgb3IgaGFuZGxlIG5lY2Vzc2FyeSBpbnRlcnJ1cHRpb25zLiBFeGFtcGxlOiBNb2RhbHMuXG4kZWxldmF0aW9uLWxhcmdlOiAwIDVweCAxNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wOCksIDAgMTVweCAyN3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNyksIDAgMzBweCAzNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNTBweCA0M3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8qKlxuICogRGltZW5zaW9ucy5cbiAqL1xuXG4kaWNvbi1zaXplOiAyNHB4O1xuJGJ1dHRvbi1zaXplOiAzNnB4O1xuJGJ1dHRvbi1zaXplLW5leHQtZGVmYXVsdC00MHB4OiA0MHB4OyAvLyB0cmFuc2l0aW9uYXJ5IHZhcmlhYmxlIGZvciBuZXh0IGRlZmF1bHQgYnV0dG9uIHNpemVcbiRidXR0b24tc2l6ZS1zbWFsbDogMjRweDtcbiRidXR0b24tc2l6ZS1jb21wYWN0OiAzMnB4O1xuJGhlYWRlci1oZWlnaHQ6IDY0cHg7XG4kcGFuZWwtaGVhZGVyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRuYXYtc2lkZWJhci13aWR0aDogMzAwcHg7XG4kYWRtaW4tYmFyLWhlaWdodDogMzJweDtcbiRhZG1pbi1iYXItaGVpZ2h0LWJpZzogNDZweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoOiAxNjBweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoLWJpZzogMTkwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1jb2xsYXBzZWQ6IDM2cHg7XG4kbW9kYWwtbWluLXdpZHRoOiAzNTBweDtcbiRtb2RhbC13aWR0aC1zbWFsbDogMzg0cHg7XG4kbW9kYWwtd2lkdGgtbWVkaXVtOiA1MTJweDtcbiRtb2RhbC13aWR0aC1sYXJnZTogODQwcHg7XG4kc3Bpbm5lci1zaXplOiAxNnB4O1xuJGNhbnZhcy1wYWRkaW5nOiAkZ3JpZC11bml0LTIwO1xuJHBhbGV0dGUtbWF4LWhlaWdodDogMzY4cHg7XG5cbi8qKlxuICogTW9iaWxlIHNwZWNpZmljIHN0eWxlc1xuICovXG4kbW9iaWxlLXRleHQtbWluLWZvbnQtc2l6ZTogMTZweDsgLy8gQW55IGZvbnQgc2l6ZSBiZWxvdyAxNnB4IHdpbGwgY2F1c2UgTW9iaWxlIFNhZmFyaSB0byBcInpvb20gaW5cIi5cblxuLyoqXG4gKiBFZGl0b3Igc3R5bGVzLlxuICovXG5cbiRzaWRlYmFyLXdpZHRoOiAyODBweDtcbiRjb250ZW50LXdpZHRoOiA4NDBweDtcbiR3aWRlLWNvbnRlbnQtd2lkdGg6IDExMDBweDtcbiR3aWRnZXQtYXJlYS13aWR0aDogNzAwcHg7XG4kc2Vjb25kYXJ5LXNpZGViYXItd2lkdGg6IDM1MHB4O1xuJGVkaXRvci1mb250LXNpemU6IDE2cHg7XG4kZGVmYXVsdC1ibG9jay1tYXJnaW46IDI4cHg7IC8vIFRoaXMgdmFsdWUgcHJvdmlkZXMgYSBjb25zaXN0ZW50LCBjb250aWd1b3VzIHNwYWNpbmcgYmV0d2VlbiBibG9ja3MuXG4kdGV4dC1lZGl0b3ItZm9udC1zaXplOiAxNXB4O1xuJGVkaXRvci1saW5lLWhlaWdodDogMS44O1xuJGVkaXRvci1odG1sLWZvbnQ6ICRmb250LWZhbWlseS1tb25vO1xuXG4vKipcbiAqIEJsb2NrICYgRWRpdG9yIFVJLlxuICovXG5cbiRibG9jay10b29sYmFyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRib3JkZXItd2lkdGg6IDFweDtcbiRib3JkZXItd2lkdGgtZm9jdXMtZmFsbGJhY2s6IDJweDsgLy8gVGhpcyBleGlzdHMgYXMgYSBmYWxsYmFjaywgYW5kIGlzIGlkZWFsbHkgb3ZlcnJpZGRlbiBieSB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpIHVubGVzcyBpbiBzb21lIFNBU1MgbWF0aCBjYXNlcy5cbiRib3JkZXItd2lkdGgtdGFiOiAxLjVweDtcbiRoZWxwdGV4dC1mb250LXNpemU6IDEycHg7XG4kcmFkaW8taW5wdXQtc2l6ZTogMTZweDtcbiRyYWRpby1pbnB1dC1zaXplLXNtOiAyNHB4OyAvLyBXaWR0aCAmIGhlaWdodCBmb3Igc21hbGwgdmlld3BvcnRzLlxuXG4vLyBEZXByZWNhdGVkLCBwbGVhc2UgYXZvaWQgdXNpbmcgdGhlc2UuXG4kYmxvY2stcGFkZGluZzogMTRweDsgLy8gVXNlZCB0byBkZWZpbmUgc3BhY2UgYmV0d2VlbiBibG9jayBmb290cHJpbnQgYW5kIHN1cnJvdW5kaW5nIGJvcmRlcnMuXG4kcmFkaXVzLWJsb2NrLXVpOiAkcmFkaXVzLXNtYWxsO1xuJHNoYWRvdy1wb3BvdmVyOiAkZWxldmF0aW9uLXgtc21hbGw7XG4kc2hhZG93LW1vZGFsOiAkZWxldmF0aW9uLWxhcmdlO1xuJGRlZmF1bHQtZm9udC1zaXplOiAkZm9udC1zaXplLW1lZGl1bTtcblxuLyoqXG4gKiBCbG9jayBwYWRkaW5ncy5cbiAqL1xuXG4vLyBQYWRkaW5nIGZvciBibG9ja3Mgd2l0aCBhIGJhY2tncm91bmQgY29sb3IgKGUuZy4gcGFyYWdyYXBoIG9yIGdyb3VwKS5cbiRibG9jay1iZy1wYWRkaW5nLS12OiAxLjI1ZW07XG4kYmxvY2stYmctcGFkZGluZy0taDogMi4zNzVlbTtcblxuXG4vKipcbiAqIFJlYWN0IE5hdGl2ZSBzcGVjaWZpYy5cbiAqIFRoZXNlIHZhcmlhYmxlcyBkbyBub3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUgZWxzZS5cbiAqL1xuXG4vLyBEaW1lbnNpb25zLlxuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWhlYWRlci10b29sYmFyLWV4cGFuZGVkLWhlaWdodDogNTJweDtcbiRtb2JpbGUtZmxvYXRpbmctdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItbWFyZ2luOiA4cHg7XG4kbW9iaWxlLWNvbG9yLXN3YXRjaDogNDhweDtcblxuLy8gQmxvY2sgVUkuXG4kbW9iaWxlLWJsb2NrLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJGRpbW1lZC1vcGFjaXR5OiAxO1xuJGJsb2NrLWVkZ2UtdG8tY29udGVudDogMTZweDtcbiRzb2xpZC1ib3JkZXItc3BhY2U6IDEycHg7XG4kZGFzaGVkLWJvcmRlci1zcGFjZTogNnB4O1xuJGJsb2NrLXNlbGVjdGVkLW1hcmdpbjogM3B4O1xuJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDogMXB4O1xuJGJsb2NrLXNlbGVjdGVkLXBhZGRpbmc6IDA7XG4kYmxvY2stc2VsZWN0ZWQtY2hpbGQtbWFyZ2luOiA1cHg7XG4kYmxvY2stc2VsZWN0ZWQtdG8tY29udGVudDogJGJsb2NrLWVkZ2UtdG8tY29udGVudCAtICRibG9jay1zZWxlY3RlZC1tYXJnaW4gLSAkYmxvY2stc2VsZWN0ZWQtYm9yZGVyLXdpZHRoO1xuIiwiLyoqXG4gKiBDb2xvcnNcbiAqL1xuXG4vLyBXb3JkUHJlc3MgZ3JheXMuXG4kYmxhY2s6ICMwMDA7XHRcdFx0Ly8gVXNlIG9ubHkgd2hlbiB5b3UgdHJ1bHkgbmVlZCBwdXJlIGJsYWNrLiBGb3IgVUksIHVzZSAkZ3JheS05MDAuXG4kZ3JheS05MDA6ICMxZTFlMWU7XG4kZ3JheS04MDA6ICMyZjJmMmY7XG4kZ3JheS03MDA6ICM3NTc1NzU7XHRcdC8vIE1lZXRzIDQuNjoxICg0LjU6MSBpcyBtaW5pbXVtKSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS02MDA6ICM5NDk0OTQ7XHRcdC8vIE1lZXRzIDM6MSBVSSBvciBsYXJnZSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS00MDA6ICNjY2M7XG4kZ3JheS0zMDA6ICNkZGQ7XHRcdC8vIFVzZWQgZm9yIG1vc3QgYm9yZGVycy5cbiRncmF5LTIwMDogI2UwZTBlMDtcdFx0Ly8gVXNlZCBzcGFyaW5nbHkgZm9yIGxpZ2h0IGJvcmRlcnMuXG4kZ3JheS0xMDA6ICNmMGYwZjA7XHRcdC8vIFVzZWQgZm9yIGxpZ2h0IGdyYXkgYmFja2dyb3VuZHMuXG4kd2hpdGU6ICNmZmY7XG5cbi8vIE9wYWNpdGllcyAmIGFkZGl0aW9uYWwgY29sb3JzLlxuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNjIpO1xuJG1lZGl1bS1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC41NSk7XG4kbGlnaHQtZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkd2hpdGUsIDAuNjUpO1xuXG4vLyBBbGVydCBjb2xvcnMuXG4kYWxlcnQteWVsbG93OiAjZjBiODQ5O1xuJGFsZXJ0LXJlZDogI2NjMTgxODtcbiRhbGVydC1ncmVlbjogIzRhYjg2NjtcblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGRhcmstdGhlbWUtZm9jdXM6ICR3aGl0ZTtcdC8vIEZvY3VzIGNvbG9yIHdoZW4gdGhlIHRoZW1lIGlzIGRhcmsuXG4iLCJAdXNlIFwiQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy92YXJpYWJsZXNcIjtcblxuJGhlYWRlci1oZWlnaHQ6IHZhcmlhYmxlcy4kaGVhZGVyLWhlaWdodDtcblxuLmJvb3Qtc2l0ZS1pY29uLWxpbmsge1xuXHR3aWR0aDogJGhlYWRlci1oZWlnaHQ7XG5cdGhlaWdodDogJGhlYWRlci1oZWlnaHQ7XG5cdGRpc3BsYXk6IGlubGluZS1mbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0YmFja2dyb3VuZDogdmFyKC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLW5ldXRyYWwtd2VhaywgI2YwZjBmMCk7XG5cdHRleHQtZGVjb3JhdGlvbjogbm9uZTtcblxuXHRAbWVkaWEgbm90IChwcmVmZXJzLXJlZHVjZWQtbW90aW9uKSB7XG5cdFx0dHJhbnNpdGlvbjogb3V0bGluZSAwLjFzIGVhc2Utb3V0O1xuXHR9XG5cblx0Jjpmb2N1czpub3QoOmFjdGl2ZSkge1xuXHRcdG91dGxpbmU6XG5cdFx0XHR2YXIoLS13cGRzLWJvcmRlci13aWR0aC1mb2N1cywgMnB4KSBzb2xpZFxuXHRcdFx0dmFyKC0td3Bkcy1jb2xvci1zdHJva2UtZm9jdXMtYnJhbmQsICMwMDczYWEpO1xuXHRcdG91dGxpbmUtb2Zmc2V0OiBjYWxjKC0xICogdmFyKC0td3Bkcy1ib3JkZXItd2lkdGgtZm9jdXMsIDJweCkpO1xuXHR9XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css2 ) );
const { useCanGoBack, useRouter } = unlock( routePrivateApis );
/**
 *
 * @param root0
 * @param root0.to
 * @param root0.isBackButton
 */
function SiteIconLink( { to, isBackButton, ...props } ) {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	return /* @__PURE__ */ ( 0, import_jsx_runtime14.jsx )( Link, {
		to,
		'aria-label': props[ 'aria-label' ],
		className: 'boot-site-icon-link',
		onClick: event => {
			if ( canGoBack && isBackButton ) {
				event.preventDefault();
				router.history.back();
			}
		},
		children: /* @__PURE__ */ ( 0, import_jsx_runtime14.jsx )( site_icon_default, {} ),
	} );
}
const site_icon_link_default = SiteIconLink;

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/site-hub/index.js
const import_jsx_runtime15 = __toESM( require_jsx_runtime() );
const css3 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-site-hub {
  position: sticky;
  top: 0;
  background-color: var(--wpds-color-bg-surface-neutral-weak, #f0f0f0);
  z-index: 1;
  display: grid;
  grid-template-columns: 60px 1fr auto;
  align-items: center;
  padding-right: 16px;
  flex-shrink: 0;
}

.boot-site-hub__actions {
  flex-shrink: 0;
}

.boot-site-hub__title {
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
  font-size: 13px;
  font-weight: 499;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}
.boot-site-hub__title .components-external-link__contents {
  text-decoration: none;
  margin-inline-start: 4px;
}
.boot-site-hub__title .components-external-link__icon {
  opacity: 0;
  transition: opacity 0.1s ease-out;
}
.boot-site-hub__title:hover .components-external-link__icon {
  opacity: 1;
}
@media not (prefers-reduced-motion) {
  .boot-site-hub__title {
    transition: outline 0.1s ease-out;
  }
}
.boot-site-hub__title:focus:not(:active) {
  outline: var(--wpds-border-width-focus, 2px) solid var(--wpds-color-stroke-focus-brand, #0073aa);
  outline-offset: calc(-1 * var(--wpds-border-width-focus, 2px));
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvc2l0ZS1odWIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL192YXJpYWJsZXMuc2NzcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL19jb2xvcnMuc2NzcyIsInN0eWxlLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUNBQTtBQUFBO0FBQUE7QURVQTtBQUFBO0FBQUE7QUFPQTtBQUFBO0FBQUE7QUE2QkE7QUFBQTtBQUFBO0FBQUE7QUFpQkE7QUFBQTtBQUFBO0FBV0E7QUFBQTtBQUFBO0FBZ0JBO0FBQUE7QUFBQTtBQXlCQTtBQUFBO0FBQUE7QUFLQTtBQUFBO0FBQUE7QUFlQTtBQUFBO0FBQUE7QUFtQkE7QUFBQTtBQUFBO0FBU0E7QUFBQTtBQUFBO0FBQUE7QUVqS0E7RUFDQztFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBLGVGNkNjO0VFNUNkOzs7QUFHRDtFQUNDOzs7QUFHRDtFQUNDO0VBQ0EsV0ZJa0I7RUVIbEIsYUZrQm9CO0VFakJwQjtFQUNBO0VBQ0E7RUFDQTs7QUFFQTtFQUNDO0VBQ0EscUJGdUJhOztBRW5CZDtFQUNDO0VBQ0E7O0FBR0Q7RUFDQzs7QUFJRDtFQXpCRDtJQTBCRTs7O0FBR0Q7RUFDQyxTQUNDO0VBRUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNDU1MgVmFyaWFibGVzLlxuICpcbiAqIFBsZWFzZSB1c2UgdmFyaWFibGVzIGZyb20gdGhpcyBzaGVldCB0byBlbnN1cmUgY29uc2lzdGVuY3kgYWNyb3NzIHRoZSBVSS5cbiAqIERvbid0IGFkZCB0byB0aGlzIHNoZWV0IHVubGVzcyB5b3UncmUgcHJldHR5IHN1cmUgdGhlIHZhbHVlIHdpbGwgYmUgcmV1c2VkIGluIG1hbnkgcGxhY2VzLlxuICogRm9yIGV4YW1wbGUsIGRvbid0IGFkZCBydWxlcyB0byB0aGlzIHNoZWV0IHRoYXQgYWZmZWN0IGJsb2NrIHZpc3VhbHMuIEl0J3MgcHVyZWx5IGZvciBVSS5cbiAqL1xuXG5AdXNlIFwiLi9jb2xvcnNcIjtcblxuLyoqXG4gKiBGb250cyAmIGJhc2ljIHZhcmlhYmxlcy5cbiAqL1xuXG4kZGVmYXVsdC1mb250OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCxcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkZmFtaWx5IHZhcmlhYmxlc1xuJGRlZmF1bHQtbGluZS1oZWlnaHQ6IDEuNDsgLy8gVG9kbzogZGVwcmVjYXRlIGluIGZhdm9yIG9mICRsaW5lLWhlaWdodCB0b2tlbnNcblxuLyoqXG4gKiBUeXBvZ3JhcGh5XG4gKi9cblxuLy8gU2l6ZXNcbiRmb250LXNpemUteC1zbWFsbDogMTFweDtcbiRmb250LXNpemUtc21hbGw6IDEycHg7XG4kZm9udC1zaXplLW1lZGl1bTogMTNweDtcbiRmb250LXNpemUtbGFyZ2U6IDE1cHg7XG4kZm9udC1zaXplLXgtbGFyZ2U6IDIwcHg7XG4kZm9udC1zaXplLTJ4LWxhcmdlOiAzMnB4O1xuXG4vLyBMaW5lIGhlaWdodHNcbiRmb250LWxpbmUtaGVpZ2h0LXgtc21hbGw6IDE2cHg7XG4kZm9udC1saW5lLWhlaWdodC1zbWFsbDogMjBweDtcbiRmb250LWxpbmUtaGVpZ2h0LW1lZGl1bTogMjRweDtcbiRmb250LWxpbmUtaGVpZ2h0LWxhcmdlOiAyOHB4O1xuJGZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTogMzJweDtcbiRmb250LWxpbmUtaGVpZ2h0LTJ4LWxhcmdlOiA0MHB4O1xuXG4vLyBXZWlnaHRzXG4kZm9udC13ZWlnaHQtcmVndWxhcjogNDAwO1xuJGZvbnQtd2VpZ2h0LW1lZGl1bTogNDk5OyAvLyBlbnN1cmVzIGZhbGxiYWNrIHRvIDQwMCAoaW5zdGVhZCBvZiA2MDApXG5cbi8vIEZhbWlsaWVzXG4kZm9udC1mYW1pbHktaGVhZGluZ3M6IC1hcHBsZS1zeXN0ZW0sIFwic3lzdGVtLXVpXCIsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiRmb250LWZhbWlseS1ib2R5OiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktbW9ubzogTWVubG8sIENvbnNvbGFzLCBtb25hY28sIG1vbm9zcGFjZTtcblxuLyoqXG4gKiBHcmlkIFN5c3RlbS5cbiAqIGh0dHBzOi8vbWFrZS53b3JkcHJlc3Mub3JnL2Rlc2lnbi8yMDE5LzEwLzMxL3Byb3Bvc2FsLWEtY29uc2lzdGVudC1zcGFjaW5nLXN5c3RlbS1mb3Itd29yZHByZXNzL1xuICovXG5cbiRncmlkLXVuaXQ6IDhweDtcbiRncmlkLXVuaXQtMDU6IDAuNSAqICRncmlkLXVuaXQ7XHQvLyA0cHhcbiRncmlkLXVuaXQtMTA6IDEgKiAkZ3JpZC11bml0O1x0XHQvLyA4cHhcbiRncmlkLXVuaXQtMTU6IDEuNSAqICRncmlkLXVuaXQ7XHQvLyAxMnB4XG4kZ3JpZC11bml0LTIwOiAyICogJGdyaWQtdW5pdDtcdFx0Ly8gMTZweFxuJGdyaWQtdW5pdC0zMDogMyAqICRncmlkLXVuaXQ7XHRcdC8vIDI0cHhcbiRncmlkLXVuaXQtNDA6IDQgKiAkZ3JpZC11bml0O1x0XHQvLyAzMnB4XG4kZ3JpZC11bml0LTUwOiA1ICogJGdyaWQtdW5pdDtcdFx0Ly8gNDBweFxuJGdyaWQtdW5pdC02MDogNiAqICRncmlkLXVuaXQ7XHRcdC8vIDQ4cHhcbiRncmlkLXVuaXQtNzA6IDcgKiAkZ3JpZC11bml0O1x0XHQvLyA1NnB4XG4kZ3JpZC11bml0LTgwOiA4ICogJGdyaWQtdW5pdDtcdFx0Ly8gNjRweFxuXG4vKipcbiAqIFJhZGl1cyBzY2FsZS5cbiAqL1xuXG4kcmFkaXVzLXgtc21hbGw6IDFweDsgICAvLyBBcHBsaWVkIHRvIGVsZW1lbnRzIGxpa2UgYnV0dG9ucyBuZXN0ZWQgd2l0aGluIHByaW1pdGl2ZXMgbGlrZSBpbnB1dHMuXG4kcmFkaXVzLXNtYWxsOiAycHg7ICAgICAvLyBBcHBsaWVkIHRvIG1vc3QgcHJpbWl0aXZlcy5cbiRyYWRpdXMtbWVkaXVtOiA0cHg7ICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIHNtYWxsZXIgcGFkZGluZy5cbiRyYWRpdXMtbGFyZ2U6IDhweDsgICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIGxhcmdlciBwYWRkaW5nLlxuJHJhZGl1cy1mdWxsOiA5OTk5cHg7ICAgLy8gRm9yIHBpbGxzLlxuJHJhZGl1cy1yb3VuZDogNTAlOyAgICAgLy8gRm9yIGNpcmNsZXMgYW5kIG92YWxzLlxuXG4vKipcbiAqIEVsZXZhdGlvbiBzY2FsZS5cbiAqL1xuXG4vLyBGb3Igc2VjdGlvbnMgYW5kIGNvbnRhaW5lcnMgdGhhdCBncm91cCByZWxhdGVkIGNvbnRlbnQgYW5kIGNvbnRyb2xzLCB3aGljaCBtYXkgb3ZlcmxhcCBvdGhlciBjb250ZW50LiBFeGFtcGxlOiBQcmV2aWV3IEZyYW1lLlxuJGVsZXZhdGlvbi14LXNtYWxsOiAwIDFweCAxcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMiksIDAgM3B4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDRweCA0cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAxKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBwcm92aWRlIGNvbnRleHR1YWwgZmVlZGJhY2sgd2l0aG91dCBiZWluZyBpbnRydXNpdmUuIEdlbmVyYWxseSBub24taW50ZXJydXB0aXZlLiBFeGFtcGxlOiBUb29sdGlwcywgU25hY2tiYXIuXG4kZWxldmF0aW9uLXNtYWxsOiAwIDFweCAycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNnB4IDZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDhweCA4cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBvZmZlciBhZGRpdGlvbmFsIGFjdGlvbnMuIEV4YW1wbGU6IE1lbnVzLCBDb21tYW5kIFBhbGV0dGVcbiRlbGV2YXRpb24tbWVkaXVtOiAwIDJweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCA0cHggNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgMTJweCAxMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMTZweCAxNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgY29uZmlybSBkZWNpc2lvbnMgb3IgaGFuZGxlIG5lY2Vzc2FyeSBpbnRlcnJ1cHRpb25zLiBFeGFtcGxlOiBNb2RhbHMuXG4kZWxldmF0aW9uLWxhcmdlOiAwIDVweCAxNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wOCksIDAgMTVweCAyN3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNyksIDAgMzBweCAzNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNTBweCA0M3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8qKlxuICogRGltZW5zaW9ucy5cbiAqL1xuXG4kaWNvbi1zaXplOiAyNHB4O1xuJGJ1dHRvbi1zaXplOiAzNnB4O1xuJGJ1dHRvbi1zaXplLW5leHQtZGVmYXVsdC00MHB4OiA0MHB4OyAvLyB0cmFuc2l0aW9uYXJ5IHZhcmlhYmxlIGZvciBuZXh0IGRlZmF1bHQgYnV0dG9uIHNpemVcbiRidXR0b24tc2l6ZS1zbWFsbDogMjRweDtcbiRidXR0b24tc2l6ZS1jb21wYWN0OiAzMnB4O1xuJGhlYWRlci1oZWlnaHQ6IDY0cHg7XG4kcGFuZWwtaGVhZGVyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRuYXYtc2lkZWJhci13aWR0aDogMzAwcHg7XG4kYWRtaW4tYmFyLWhlaWdodDogMzJweDtcbiRhZG1pbi1iYXItaGVpZ2h0LWJpZzogNDZweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoOiAxNjBweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoLWJpZzogMTkwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1jb2xsYXBzZWQ6IDM2cHg7XG4kbW9kYWwtbWluLXdpZHRoOiAzNTBweDtcbiRtb2RhbC13aWR0aC1zbWFsbDogMzg0cHg7XG4kbW9kYWwtd2lkdGgtbWVkaXVtOiA1MTJweDtcbiRtb2RhbC13aWR0aC1sYXJnZTogODQwcHg7XG4kc3Bpbm5lci1zaXplOiAxNnB4O1xuJGNhbnZhcy1wYWRkaW5nOiAkZ3JpZC11bml0LTIwO1xuJHBhbGV0dGUtbWF4LWhlaWdodDogMzY4cHg7XG5cbi8qKlxuICogTW9iaWxlIHNwZWNpZmljIHN0eWxlc1xuICovXG4kbW9iaWxlLXRleHQtbWluLWZvbnQtc2l6ZTogMTZweDsgLy8gQW55IGZvbnQgc2l6ZSBiZWxvdyAxNnB4IHdpbGwgY2F1c2UgTW9iaWxlIFNhZmFyaSB0byBcInpvb20gaW5cIi5cblxuLyoqXG4gKiBFZGl0b3Igc3R5bGVzLlxuICovXG5cbiRzaWRlYmFyLXdpZHRoOiAyODBweDtcbiRjb250ZW50LXdpZHRoOiA4NDBweDtcbiR3aWRlLWNvbnRlbnQtd2lkdGg6IDExMDBweDtcbiR3aWRnZXQtYXJlYS13aWR0aDogNzAwcHg7XG4kc2Vjb25kYXJ5LXNpZGViYXItd2lkdGg6IDM1MHB4O1xuJGVkaXRvci1mb250LXNpemU6IDE2cHg7XG4kZGVmYXVsdC1ibG9jay1tYXJnaW46IDI4cHg7IC8vIFRoaXMgdmFsdWUgcHJvdmlkZXMgYSBjb25zaXN0ZW50LCBjb250aWd1b3VzIHNwYWNpbmcgYmV0d2VlbiBibG9ja3MuXG4kdGV4dC1lZGl0b3ItZm9udC1zaXplOiAxNXB4O1xuJGVkaXRvci1saW5lLWhlaWdodDogMS44O1xuJGVkaXRvci1odG1sLWZvbnQ6ICRmb250LWZhbWlseS1tb25vO1xuXG4vKipcbiAqIEJsb2NrICYgRWRpdG9yIFVJLlxuICovXG5cbiRibG9jay10b29sYmFyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRib3JkZXItd2lkdGg6IDFweDtcbiRib3JkZXItd2lkdGgtZm9jdXMtZmFsbGJhY2s6IDJweDsgLy8gVGhpcyBleGlzdHMgYXMgYSBmYWxsYmFjaywgYW5kIGlzIGlkZWFsbHkgb3ZlcnJpZGRlbiBieSB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpIHVubGVzcyBpbiBzb21lIFNBU1MgbWF0aCBjYXNlcy5cbiRib3JkZXItd2lkdGgtdGFiOiAxLjVweDtcbiRoZWxwdGV4dC1mb250LXNpemU6IDEycHg7XG4kcmFkaW8taW5wdXQtc2l6ZTogMTZweDtcbiRyYWRpby1pbnB1dC1zaXplLXNtOiAyNHB4OyAvLyBXaWR0aCAmIGhlaWdodCBmb3Igc21hbGwgdmlld3BvcnRzLlxuXG4vLyBEZXByZWNhdGVkLCBwbGVhc2UgYXZvaWQgdXNpbmcgdGhlc2UuXG4kYmxvY2stcGFkZGluZzogMTRweDsgLy8gVXNlZCB0byBkZWZpbmUgc3BhY2UgYmV0d2VlbiBibG9jayBmb290cHJpbnQgYW5kIHN1cnJvdW5kaW5nIGJvcmRlcnMuXG4kcmFkaXVzLWJsb2NrLXVpOiAkcmFkaXVzLXNtYWxsO1xuJHNoYWRvdy1wb3BvdmVyOiAkZWxldmF0aW9uLXgtc21hbGw7XG4kc2hhZG93LW1vZGFsOiAkZWxldmF0aW9uLWxhcmdlO1xuJGRlZmF1bHQtZm9udC1zaXplOiAkZm9udC1zaXplLW1lZGl1bTtcblxuLyoqXG4gKiBCbG9jayBwYWRkaW5ncy5cbiAqL1xuXG4vLyBQYWRkaW5nIGZvciBibG9ja3Mgd2l0aCBhIGJhY2tncm91bmQgY29sb3IgKGUuZy4gcGFyYWdyYXBoIG9yIGdyb3VwKS5cbiRibG9jay1iZy1wYWRkaW5nLS12OiAxLjI1ZW07XG4kYmxvY2stYmctcGFkZGluZy0taDogMi4zNzVlbTtcblxuXG4vKipcbiAqIFJlYWN0IE5hdGl2ZSBzcGVjaWZpYy5cbiAqIFRoZXNlIHZhcmlhYmxlcyBkbyBub3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUgZWxzZS5cbiAqL1xuXG4vLyBEaW1lbnNpb25zLlxuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWhlYWRlci10b29sYmFyLWV4cGFuZGVkLWhlaWdodDogNTJweDtcbiRtb2JpbGUtZmxvYXRpbmctdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItbWFyZ2luOiA4cHg7XG4kbW9iaWxlLWNvbG9yLXN3YXRjaDogNDhweDtcblxuLy8gQmxvY2sgVUkuXG4kbW9iaWxlLWJsb2NrLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJGRpbW1lZC1vcGFjaXR5OiAxO1xuJGJsb2NrLWVkZ2UtdG8tY29udGVudDogMTZweDtcbiRzb2xpZC1ib3JkZXItc3BhY2U6IDEycHg7XG4kZGFzaGVkLWJvcmRlci1zcGFjZTogNnB4O1xuJGJsb2NrLXNlbGVjdGVkLW1hcmdpbjogM3B4O1xuJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDogMXB4O1xuJGJsb2NrLXNlbGVjdGVkLXBhZGRpbmc6IDA7XG4kYmxvY2stc2VsZWN0ZWQtY2hpbGQtbWFyZ2luOiA1cHg7XG4kYmxvY2stc2VsZWN0ZWQtdG8tY29udGVudDogJGJsb2NrLWVkZ2UtdG8tY29udGVudCAtICRibG9jay1zZWxlY3RlZC1tYXJnaW4gLSAkYmxvY2stc2VsZWN0ZWQtYm9yZGVyLXdpZHRoO1xuIiwiLyoqXG4gKiBDb2xvcnNcbiAqL1xuXG4vLyBXb3JkUHJlc3MgZ3JheXMuXG4kYmxhY2s6ICMwMDA7XHRcdFx0Ly8gVXNlIG9ubHkgd2hlbiB5b3UgdHJ1bHkgbmVlZCBwdXJlIGJsYWNrLiBGb3IgVUksIHVzZSAkZ3JheS05MDAuXG4kZ3JheS05MDA6ICMxZTFlMWU7XG4kZ3JheS04MDA6ICMyZjJmMmY7XG4kZ3JheS03MDA6ICM3NTc1NzU7XHRcdC8vIE1lZXRzIDQuNjoxICg0LjU6MSBpcyBtaW5pbXVtKSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS02MDA6ICM5NDk0OTQ7XHRcdC8vIE1lZXRzIDM6MSBVSSBvciBsYXJnZSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS00MDA6ICNjY2M7XG4kZ3JheS0zMDA6ICNkZGQ7XHRcdC8vIFVzZWQgZm9yIG1vc3QgYm9yZGVycy5cbiRncmF5LTIwMDogI2UwZTBlMDtcdFx0Ly8gVXNlZCBzcGFyaW5nbHkgZm9yIGxpZ2h0IGJvcmRlcnMuXG4kZ3JheS0xMDA6ICNmMGYwZjA7XHRcdC8vIFVzZWQgZm9yIGxpZ2h0IGdyYXkgYmFja2dyb3VuZHMuXG4kd2hpdGU6ICNmZmY7XG5cbi8vIE9wYWNpdGllcyAmIGFkZGl0aW9uYWwgY29sb3JzLlxuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNjIpO1xuJG1lZGl1bS1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC41NSk7XG4kbGlnaHQtZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkd2hpdGUsIDAuNjUpO1xuXG4vLyBBbGVydCBjb2xvcnMuXG4kYWxlcnQteWVsbG93OiAjZjBiODQ5O1xuJGFsZXJ0LXJlZDogI2NjMTgxODtcbiRhbGVydC1ncmVlbjogIzRhYjg2NjtcblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGRhcmstdGhlbWUtZm9jdXM6ICR3aGl0ZTtcdC8vIEZvY3VzIGNvbG9yIHdoZW4gdGhlIHRoZW1lIGlzIGRhcmsuXG4iLCJAdXNlIFwiQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy92YXJpYWJsZXNcIjtcblxuLmJvb3Qtc2l0ZS1odWIge1xuXHRwb3NpdGlvbjogc3RpY2t5O1xuXHR0b3A6IDA7XG5cdGJhY2tncm91bmQtY29sb3I6IHZhcigtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1uZXV0cmFsLXdlYWssICNmMGYwZjApO1xuXHR6LWluZGV4OiAxO1xuXHRkaXNwbGF5OiBncmlkO1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDYwcHggMWZyIGF1dG87XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdHBhZGRpbmctcmlnaHQ6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTIwO1xuXHRmbGV4LXNocmluazogMDsgLy8gUHJldmVudCBmbGV4IHBhcmVudCBmcm9tIHNocmlua2luZyB0aGlzIGVsZW1lbnQuXG59XG5cbi5ib290LXNpdGUtaHViX19hY3Rpb25zIHtcblx0ZmxleC1zaHJpbms6IDA7XG59XG5cbi5ib290LXNpdGUtaHViX190aXRsZSB7XG5cdGNvbG9yOiB2YXIoLS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtbmV1dHJhbCwgIzFlMWUxZSk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtbWVkaXVtO1xuXHRmb250LXdlaWdodDogdmFyaWFibGVzLiRmb250LXdlaWdodC1tZWRpdW07XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuXHR3aGl0ZS1zcGFjZTogbm93cmFwO1xuXHR0ZXh0LWRlY29yYXRpb246IG5vbmU7XG5cblx0LmNvbXBvbmVudHMtZXh0ZXJuYWwtbGlua19fY29udGVudHMge1xuXHRcdHRleHQtZGVjb3JhdGlvbjogbm9uZTtcblx0XHRtYXJnaW4taW5saW5lLXN0YXJ0OiB2YXJpYWJsZXMuJGdyaWQtdW5pdC0wNTtcblx0fVxuXG5cdC8vIFNob3cgaWNvbiBvbiBob3ZlclxuXHQuY29tcG9uZW50cy1leHRlcm5hbC1saW5rX19pY29uIHtcblx0XHRvcGFjaXR5OiAwO1xuXHRcdHRyYW5zaXRpb246IG9wYWNpdHkgMC4xcyBlYXNlLW91dDtcblx0fVxuXG5cdCY6aG92ZXIgLmNvbXBvbmVudHMtZXh0ZXJuYWwtbGlua19faWNvbiB7XG5cdFx0b3BhY2l0eTogMTtcblx0fVxuXG5cdC8vIEZvY3VzIHN0eWxlc1xuXHRAbWVkaWEgbm90IChwcmVmZXJzLXJlZHVjZWQtbW90aW9uKSB7XG5cdFx0dHJhbnNpdGlvbjogb3V0bGluZSAwLjFzIGVhc2Utb3V0O1xuXHR9XG5cblx0Jjpmb2N1czpub3QoOmFjdGl2ZSkge1xuXHRcdG91dGxpbmU6XG5cdFx0XHR2YXIoLS13cGRzLWJvcmRlci13aWR0aC1mb2N1cywgMnB4KSBzb2xpZFxuXHRcdFx0dmFyKC0td3Bkcy1jb2xvci1zdHJva2UtZm9jdXMtYnJhbmQsICMwMDczYWEpO1xuXHRcdG91dGxpbmUtb2Zmc2V0OiBjYWxjKC0xICogdmFyKC0td3Bkcy1ib3JkZXItd2lkdGgtZm9jdXMsIDJweCkpO1xuXHR9XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css3 ) );
/**
 *
 */
function SiteHub() {
	const { homeUrl, siteTitle } = ( 0, import_data2.useSelect )( select => {
		const { getEntityRecord } = select( import_core_data2.store );
		const _base = getEntityRecord( 'root', '__unstableBase' );
		return {
			homeUrl: _base?.home,
			siteTitle:
				! _base?.name && !! _base?.url
					? ( 0, import_url.filterURLForDisplay )( _base?.url )
					: _base?.name,
		};
	}, [] );
	const { open: openCommandCenter } = ( 0, import_data2.useDispatch )( import_commands.store );
	return /* @__PURE__ */ ( 0, import_jsx_runtime15.jsxs )( 'div', {
		className: 'boot-site-hub',
		children: [
			/* @__PURE__ */ ( 0, import_jsx_runtime15.jsx )( site_icon_link_default, {
				to: '/',
				'aria-label': ( 0, import_i18n2.__ )( 'Go to the Dashboard' ),
			} ),
			/* @__PURE__ */ ( 0, import_jsx_runtime15.jsx )( import_components2.ExternalLink, {
				href: homeUrl ?? '/',
				className: 'boot-site-hub__title',
				children: siteTitle && ( 0, import_html_entities.decodeEntities )( siteTitle ),
			} ),
			/* @__PURE__ */ ( 0, import_jsx_runtime15.jsx )( import_components2.__experimentalHStack, {
				className: 'boot-site-hub__actions',
				children: /* @__PURE__ */ ( 0, import_jsx_runtime15.jsx )( import_components2.Button, {
					variant: 'tertiary',
					icon: search_default,
					onClick: () => openCommandCenter(),
					size: 'compact',
					label: ( 0, import_i18n2.__ )( 'Open command palette' ),
					shortcut: import_keycodes.displayShortcut.primary( 'k' ),
				} ),
			} ),
		],
	} );
}
const site_hub_default = SiteHub;

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/index.js
const import_element6 = __toESM( require_element() );
const import_data6 = __toESM( require_data() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/store/index.js
const import_data3 = __toESM( require_data() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/store/reducer.js
const initialState = {
	menuItems: {},
	routes: [],
};
/**
 *
 * @param state
 * @param action
 */
function reducer( state = initialState, action ) {
	switch ( action.type ) {
		case 'REGISTER_MENU_ITEM':
			return {
				...state,
				menuItems: {
					...state.menuItems,
					[ action.id ]: action.menuItem,
				},
			};
		case 'UPDATE_MENU_ITEM':
			return {
				...state,
				menuItems: {
					...state.menuItems,
					[ action.id ]: {
						...state.menuItems[ action.id ],
						...action.updates,
					},
				},
			};
		case 'REGISTER_ROUTE':
			return {
				...state,
				routes: [ ...state.routes, action.route ],
			};
	}
	return state;
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/store/actions.js
const actions_exports = {};
__export( actions_exports, {
	registerMenuItem: () => registerMenuItem,
	registerRoute: () => registerRoute,
	updateMenuItem: () => updateMenuItem,
} );
/**
 *
 * @param id
 * @param menuItem
 */
function registerMenuItem( id, menuItem ) {
	return {
		type: 'REGISTER_MENU_ITEM',
		id,
		menuItem,
	};
}
/**
 *
 * @param id
 * @param updates
 */
function updateMenuItem( id, updates ) {
	return {
		type: 'UPDATE_MENU_ITEM',
		id,
		updates,
	};
}
/**
 *
 * @param route
 */
function registerRoute( route ) {
	return {
		type: 'REGISTER_ROUTE',
		route,
	};
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/store/selectors.js
const selectors_exports = {};
__export( selectors_exports, {
	getMenuItems: () => getMenuItems,
	getRoutes: () => getRoutes,
} );
/**
 *
 * @param state
 */
function getMenuItems( state ) {
	return Object.values( state.menuItems );
}
/**
 *
 * @param state
 */
function getRoutes( state ) {
	return state.routes;
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/store/index.js
const STORE_NAME = 'wordpress/boot';
const store = ( 0, import_data3.createReduxStore )( STORE_NAME, {
	reducer,
	actions: actions_exports,
	selectors: selectors_exports,
} );
( 0, import_data3.register )( store );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/navigation-item/index.js
const import_components5 = __toESM( require_components() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/router-link-item.js
const import_element3 = __toESM( require_element() );
const import_components3 = __toESM( require_components() );
import { privateApis as routePrivateApis2 } from '@wordpress/route';
const import_jsx_runtime16 = __toESM( require_jsx_runtime() );
const { createLink } = unlock( routePrivateApis2 );
/**
 *
 * @param props
 * @param forwardedRef
 */
function AnchorOnlyItem( props, forwardedRef ) {
	return /* @__PURE__ */ ( 0, import_jsx_runtime16.jsx )( import_components3.__experimentalItem, {
		as: 'a',
		ref: forwardedRef,
		...props,
	} );
}
const RouterLinkItem = createLink( ( 0, import_element3.forwardRef )( AnchorOnlyItem ) );
const router_link_item_default = RouterLinkItem;

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/items.js
const import_element4 = __toESM( require_element() );
const import_components4 = __toESM( require_components() );
const import_primitives10 = __toESM( require_primitives() );
const import_jsx_runtime17 = __toESM( require_jsx_runtime() );
/**
 *
 * @param element
 */
function isSvg( element ) {
	return (
		( 0, import_element4.isValidElement )( element ) &&
		( element.type === import_primitives10.SVG || element.type === 'svg' )
	);
}
/**
 *
 * @param icon
 * @param shouldShowPlaceholder
 */
function wrapIcon( icon, shouldShowPlaceholder = true ) {
	if ( isSvg( icon ) ) {
		return /* @__PURE__ */ ( 0, import_jsx_runtime17.jsx )( import_components4.Icon, { icon } );
	}
	if ( typeof icon === 'string' && icon.startsWith( 'dashicons-' ) ) {
		const iconKey = icon.replace( /^dashicons-/, '' );
		return /* @__PURE__ */ ( 0, import_jsx_runtime17.jsx )( import_components4.Dashicon, {
			style: { padding: '2px' },
			icon: iconKey,
			'aria-hidden': 'true',
		} );
	}
	if ( typeof icon === 'string' && icon.startsWith( 'data:' ) ) {
		return /* @__PURE__ */ ( 0, import_jsx_runtime17.jsx )( 'img', {
			src: icon,
			alt: '',
			'aria-hidden': 'true',
			style: {
				width: '20px',
				height: '20px',
				display: 'block',
				padding: '2px',
			},
		} );
	}
	if ( icon ) {
		return icon;
	}
	if ( shouldShowPlaceholder ) {
		return /* @__PURE__ */ ( 0, import_jsx_runtime17.jsx )( 'div', {
			style: { width: '24px', height: '24px' },
			'aria-hidden': 'true',
		} );
	}
	return null;
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/navigation-item/index.js
const import_jsx_runtime18 = __toESM( require_jsx_runtime() );
const css4 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Typography
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
.boot-navigation-item.components-item {
  color: var(--wpds-color-fg-interactive-neutral, #1e1e1e);
  padding-inline: 4px;
  padding-block: 0;
  margin-inline: 12px;
  margin-block-end: 4px;
  width: calc(100% - 24px);
  border: none;
  min-height: 32px;
  display: flex;
  align-items: center;
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-weight: 400;
  font-size: 13px;
  line-height: 20px;
}
.boot-dropdown-item__children .boot-navigation-item.components-item {
  min-height: 24px;
}
.boot-navigation-item.components-item {
  border-radius: var(--wpds-border-radius-small, 2px);
}
.boot-navigation-item.components-item.active, .boot-navigation-item.components-item:hover, .boot-navigation-item.components-item:focus, .boot-navigation-item.components-item[aria-current=true] {
  color: var(--wpds-color-fg-interactive-brand-active, #0073aa);
}
.boot-navigation-item.components-item.active {
  font-weight: 499;
}
.boot-navigation-item.components-item svg:last-child {
  padding: 4px;
}
.boot-navigation-item.components-item[aria-current=true] {
  color: var(--wpds-color-fg-interactive-brand-active, #0073aa);
  font-weight: 499;
}
.boot-navigation-item.components-item:focus-visible {
  transform: translateZ(0);
}
.boot-navigation-item.components-item.with-suffix {
  padding-right: 16px;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvbmF2aWdhdGlvbi9uYXZpZ2F0aW9uLWl0ZW0iLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL192YXJpYWJsZXMuc2NzcyIsIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL19jb2xvcnMuc2NzcyIsIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL19taXhpbnMuc2NzcyIsIi4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad29yZHByZXNzL2Jhc2Utc3R5bGVzL19icmVha3BvaW50cy5zY3NzIiwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2Z1bmN0aW9ucy5zY3NzIiwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2xvbmctY29udGVudC1mYWRlLnNjc3MiLCJzdHlsZS5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FDQUE7QUFBQTtBQUFBO0FEVUE7QUFBQTtBQUFBO0FBT0E7QUFBQTtBQUFBO0FBNkJBO0FBQUE7QUFBQTtBQUFBO0FBaUJBO0FBQUE7QUFBQTtBQVdBO0FBQUE7QUFBQTtBQWdCQTtBQUFBO0FBQUE7QUF5QkE7QUFBQTtBQUFBO0FBS0E7QUFBQTtBQUFBO0FBZUE7QUFBQTtBQUFBO0FBbUJBO0FBQUE7QUFBQTtBQVNBO0FBQUE7QUFBQTtBQUFBO0FFbktBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBSDRFQTtBQUFBO0FBQUE7QUEwREE7QUFBQTtBQUFBO0FBZ0RBO0FBQUE7QUFBQTtBQXFDQTtBQUFBO0FBQUE7QUFvQkE7QUFBQTtBQUFBO0FBd0xBO0FBQUE7QUFBQTtBQUFBO0FBZ0RBO0FBQUE7QUFBQTtBSXBkQTtFQUNDO0VBQ0EsZ0JOK0NjO0VNOUNkO0VBQ0EsZU4rQ2M7RU05Q2Qsa0JONENjO0VNM0NkO0VBQ0E7RUFDQSxZTjhDYztFTTdDZDtFQUNBO0VKS0EsYUZ5QmtCO0VFeEJsQixhRm1CcUI7RUVzQnJCLFdGcENrQjtFRXFDbEIsYUY5QndCOztBTWZ4QjtFQUNDLFlOdUNhOztBTXJEZjtFQWtCQzs7QUFFQTtFQUlDOztBQUdEO0VBQ0MsYU5RbUI7O0FNTHBCO0VBQ0MsU05pQmE7O0FNZGQ7RUFDQztFQUNBLGFORG1COztBTUtwQjtFQUNDOztBQUdEO0VBQ0MsZU5NYSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU0NTUyBWYXJpYWJsZXMuXG4gKlxuICogUGxlYXNlIHVzZSB2YXJpYWJsZXMgZnJvbSB0aGlzIHNoZWV0IHRvIGVuc3VyZSBjb25zaXN0ZW5jeSBhY3Jvc3MgdGhlIFVJLlxuICogRG9uJ3QgYWRkIHRvIHRoaXMgc2hlZXQgdW5sZXNzIHlvdSdyZSBwcmV0dHkgc3VyZSB0aGUgdmFsdWUgd2lsbCBiZSByZXVzZWQgaW4gbWFueSBwbGFjZXMuXG4gKiBGb3IgZXhhbXBsZSwgZG9uJ3QgYWRkIHJ1bGVzIHRvIHRoaXMgc2hlZXQgdGhhdCBhZmZlY3QgYmxvY2sgdmlzdWFscy4gSXQncyBwdXJlbHkgZm9yIFVJLlxuICovXG5cbkB1c2UgXCIuL2NvbG9yc1wiO1xuXG4vKipcbiAqIEZvbnRzICYgYmFzaWMgdmFyaWFibGVzLlxuICovXG5cbiRkZWZhdWx0LWZvbnQ6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCxcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjsgLy8gVG9kbzogZGVwcmVjYXRlIGluIGZhdm9yIG9mICRmYW1pbHkgdmFyaWFibGVzXG4kZGVmYXVsdC1saW5lLWhlaWdodDogMS40OyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGxpbmUtaGVpZ2h0IHRva2Vuc1xuXG4vKipcbiAqIFR5cG9ncmFwaHlcbiAqL1xuXG4vLyBTaXplc1xuJGZvbnQtc2l6ZS14LXNtYWxsOiAxMXB4O1xuJGZvbnQtc2l6ZS1zbWFsbDogMTJweDtcbiRmb250LXNpemUtbWVkaXVtOiAxM3B4O1xuJGZvbnQtc2l6ZS1sYXJnZTogMTVweDtcbiRmb250LXNpemUteC1sYXJnZTogMjBweDtcbiRmb250LXNpemUtMngtbGFyZ2U6IDMycHg7XG5cbi8vIExpbmUgaGVpZ2h0c1xuJGZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDogMTZweDtcbiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsOiAyMHB4O1xuJGZvbnQtbGluZS1oZWlnaHQtbWVkaXVtOiAyNHB4O1xuJGZvbnQtbGluZS1oZWlnaHQtbGFyZ2U6IDI4cHg7XG4kZm9udC1saW5lLWhlaWdodC14LWxhcmdlOiAzMnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtMngtbGFyZ2U6IDQwcHg7XG5cbi8vIFdlaWdodHNcbiRmb250LXdlaWdodC1yZWd1bGFyOiA0MDA7XG4kZm9udC13ZWlnaHQtbWVkaXVtOiA0OTk7IC8vIGVuc3VyZXMgZmFsbGJhY2sgdG8gNDAwIChpbnN0ZWFkIG9mIDYwMClcblxuLy8gRmFtaWxpZXNcbiRmb250LWZhbWlseS1oZWFkaW5nczogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LWJvZHk6IC1hcHBsZS1zeXN0ZW0sIFwic3lzdGVtLXVpXCIsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiRmb250LWZhbWlseS1tb25vOiBNZW5sbywgQ29uc29sYXMsIG1vbmFjbywgbW9ub3NwYWNlO1xuXG4vKipcbiAqIEdyaWQgU3lzdGVtLlxuICogaHR0cHM6Ly9tYWtlLndvcmRwcmVzcy5vcmcvZGVzaWduLzIwMTkvMTAvMzEvcHJvcG9zYWwtYS1jb25zaXN0ZW50LXNwYWNpbmctc3lzdGVtLWZvci13b3JkcHJlc3MvXG4gKi9cblxuJGdyaWQtdW5pdDogOHB4O1xuJGdyaWQtdW5pdC0wNTogMC41ICogJGdyaWQtdW5pdDtcdC8vIDRweFxuJGdyaWQtdW5pdC0xMDogMSAqICRncmlkLXVuaXQ7XHRcdC8vIDhweFxuJGdyaWQtdW5pdC0xNTogMS41ICogJGdyaWQtdW5pdDtcdC8vIDEycHhcbiRncmlkLXVuaXQtMjA6IDIgKiAkZ3JpZC11bml0O1x0XHQvLyAxNnB4XG4kZ3JpZC11bml0LTMwOiAzICogJGdyaWQtdW5pdDtcdFx0Ly8gMjRweFxuJGdyaWQtdW5pdC00MDogNCAqICRncmlkLXVuaXQ7XHRcdC8vIDMycHhcbiRncmlkLXVuaXQtNTA6IDUgKiAkZ3JpZC11bml0O1x0XHQvLyA0MHB4XG4kZ3JpZC11bml0LTYwOiA2ICogJGdyaWQtdW5pdDtcdFx0Ly8gNDhweFxuJGdyaWQtdW5pdC03MDogNyAqICRncmlkLXVuaXQ7XHRcdC8vIDU2cHhcbiRncmlkLXVuaXQtODA6IDggKiAkZ3JpZC11bml0O1x0XHQvLyA2NHB4XG5cbi8qKlxuICogUmFkaXVzIHNjYWxlLlxuICovXG5cbiRyYWRpdXMteC1zbWFsbDogMXB4OyAgIC8vIEFwcGxpZWQgdG8gZWxlbWVudHMgbGlrZSBidXR0b25zIG5lc3RlZCB3aXRoaW4gcHJpbWl0aXZlcyBsaWtlIGlucHV0cy5cbiRyYWRpdXMtc21hbGw6IDJweDsgICAgIC8vIEFwcGxpZWQgdG8gbW9zdCBwcmltaXRpdmVzLlxuJHJhZGl1cy1tZWRpdW06IDRweDsgICAgLy8gQXBwbGllZCB0byBjb250YWluZXJzIHdpdGggc21hbGxlciBwYWRkaW5nLlxuJHJhZGl1cy1sYXJnZTogOHB4OyAgICAgLy8gQXBwbGllZCB0byBjb250YWluZXJzIHdpdGggbGFyZ2VyIHBhZGRpbmcuXG4kcmFkaXVzLWZ1bGw6IDk5OTlweDsgICAvLyBGb3IgcGlsbHMuXG4kcmFkaXVzLXJvdW5kOiA1MCU7ICAgICAvLyBGb3IgY2lyY2xlcyBhbmQgb3ZhbHMuXG5cbi8qKlxuICogRWxldmF0aW9uIHNjYWxlLlxuICovXG5cbi8vIEZvciBzZWN0aW9ucyBhbmQgY29udGFpbmVycyB0aGF0IGdyb3VwIHJlbGF0ZWQgY29udGVudCBhbmQgY29udHJvbHMsIHdoaWNoIG1heSBvdmVybGFwIG90aGVyIGNvbnRlbnQuIEV4YW1wbGU6IFByZXZpZXcgRnJhbWUuXG4kZWxldmF0aW9uLXgtc21hbGw6IDAgMXB4IDFweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDFweCAycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCAzcHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMiksIDAgNHB4IDRweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDEpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IHByb3ZpZGUgY29udGV4dHVhbCBmZWVkYmFjayB3aXRob3V0IGJlaW5nIGludHJ1c2l2ZS4gR2VuZXJhbGx5IG5vbi1pbnRlcnJ1cHRpdmUuIEV4YW1wbGU6IFRvb2x0aXBzLCBTbmFja2Jhci5cbiRlbGV2YXRpb24tc21hbGw6IDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDUpLCAwIDJweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA0KSwgMCA2cHggNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgOHB4IDhweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IG9mZmVyIGFkZGl0aW9uYWwgYWN0aW9ucy4gRXhhbXBsZTogTWVudXMsIENvbW1hbmQgUGFsZXR0ZVxuJGVsZXZhdGlvbi1tZWRpdW06IDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDUpLCAwIDRweCA1cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA0KSwgMCAxMnB4IDEycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCAxNnB4IDE2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBjb25maXJtIGRlY2lzaW9ucyBvciBoYW5kbGUgbmVjZXNzYXJ5IGludGVycnVwdGlvbnMuIEV4YW1wbGU6IE1vZGFscy5cbiRlbGV2YXRpb24tbGFyZ2U6IDAgNXB4IDE1cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA4KSwgMCAxNXB4IDI3cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA3KSwgMCAzMHB4IDM2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA0KSwgMCA1MHB4IDQzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLyoqXG4gKiBEaW1lbnNpb25zLlxuICovXG5cbiRpY29uLXNpemU6IDI0cHg7XG4kYnV0dG9uLXNpemU6IDM2cHg7XG4kYnV0dG9uLXNpemUtbmV4dC1kZWZhdWx0LTQwcHg6IDQwcHg7IC8vIHRyYW5zaXRpb25hcnkgdmFyaWFibGUgZm9yIG5leHQgZGVmYXVsdCBidXR0b24gc2l6ZVxuJGJ1dHRvbi1zaXplLXNtYWxsOiAyNHB4O1xuJGJ1dHRvbi1zaXplLWNvbXBhY3Q6IDMycHg7XG4kaGVhZGVyLWhlaWdodDogNjRweDtcbiRwYW5lbC1oZWFkZXItaGVpZ2h0OiAkZ3JpZC11bml0LTYwO1xuJG5hdi1zaWRlYmFyLXdpZHRoOiAzMDBweDtcbiRhZG1pbi1iYXItaGVpZ2h0OiAzMnB4O1xuJGFkbWluLWJhci1oZWlnaHQtYmlnOiA0NnB4O1xuJGFkbWluLXNpZGViYXItd2lkdGg6IDE2MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtYmlnOiAxOTBweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoLWNvbGxhcHNlZDogMzZweDtcbiRtb2RhbC1taW4td2lkdGg6IDM1MHB4O1xuJG1vZGFsLXdpZHRoLXNtYWxsOiAzODRweDtcbiRtb2RhbC13aWR0aC1tZWRpdW06IDUxMnB4O1xuJG1vZGFsLXdpZHRoLWxhcmdlOiA4NDBweDtcbiRzcGlubmVyLXNpemU6IDE2cHg7XG4kY2FudmFzLXBhZGRpbmc6ICRncmlkLXVuaXQtMjA7XG4kcGFsZXR0ZS1tYXgtaGVpZ2h0OiAzNjhweDtcblxuLyoqXG4gKiBNb2JpbGUgc3BlY2lmaWMgc3R5bGVzXG4gKi9cbiRtb2JpbGUtdGV4dC1taW4tZm9udC1zaXplOiAxNnB4OyAvLyBBbnkgZm9udCBzaXplIGJlbG93IDE2cHggd2lsbCBjYXVzZSBNb2JpbGUgU2FmYXJpIHRvIFwiem9vbSBpblwiLlxuXG4vKipcbiAqIEVkaXRvciBzdHlsZXMuXG4gKi9cblxuJHNpZGViYXItd2lkdGg6IDI4MHB4O1xuJGNvbnRlbnQtd2lkdGg6IDg0MHB4O1xuJHdpZGUtY29udGVudC13aWR0aDogMTEwMHB4O1xuJHdpZGdldC1hcmVhLXdpZHRoOiA3MDBweDtcbiRzZWNvbmRhcnktc2lkZWJhci13aWR0aDogMzUwcHg7XG4kZWRpdG9yLWZvbnQtc2l6ZTogMTZweDtcbiRkZWZhdWx0LWJsb2NrLW1hcmdpbjogMjhweDsgLy8gVGhpcyB2YWx1ZSBwcm92aWRlcyBhIGNvbnNpc3RlbnQsIGNvbnRpZ3VvdXMgc3BhY2luZyBiZXR3ZWVuIGJsb2Nrcy5cbiR0ZXh0LWVkaXRvci1mb250LXNpemU6IDE1cHg7XG4kZWRpdG9yLWxpbmUtaGVpZ2h0OiAxLjg7XG4kZWRpdG9yLWh0bWwtZm9udDogJGZvbnQtZmFtaWx5LW1vbm87XG5cbi8qKlxuICogQmxvY2sgJiBFZGl0b3IgVUkuXG4gKi9cblxuJGJsb2NrLXRvb2xiYXItaGVpZ2h0OiAkZ3JpZC11bml0LTYwO1xuJGJvcmRlci13aWR0aDogMXB4O1xuJGJvcmRlci13aWR0aC1mb2N1cy1mYWxsYmFjazogMnB4OyAvLyBUaGlzIGV4aXN0cyBhcyBhIGZhbGxiYWNrLCBhbmQgaXMgaWRlYWxseSBvdmVycmlkZGVuIGJ5IHZhcigtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1cykgdW5sZXNzIGluIHNvbWUgU0FTUyBtYXRoIGNhc2VzLlxuJGJvcmRlci13aWR0aC10YWI6IDEuNXB4O1xuJGhlbHB0ZXh0LWZvbnQtc2l6ZTogMTJweDtcbiRyYWRpby1pbnB1dC1zaXplOiAxNnB4O1xuJHJhZGlvLWlucHV0LXNpemUtc206IDI0cHg7IC8vIFdpZHRoICYgaGVpZ2h0IGZvciBzbWFsbCB2aWV3cG9ydHMuXG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRibG9jay1wYWRkaW5nOiAxNHB4OyAvLyBVc2VkIHRvIGRlZmluZSBzcGFjZSBiZXR3ZWVuIGJsb2NrIGZvb3RwcmludCBhbmQgc3Vycm91bmRpbmcgYm9yZGVycy5cbiRyYWRpdXMtYmxvY2stdWk6ICRyYWRpdXMtc21hbGw7XG4kc2hhZG93LXBvcG92ZXI6ICRlbGV2YXRpb24teC1zbWFsbDtcbiRzaGFkb3ctbW9kYWw6ICRlbGV2YXRpb24tbGFyZ2U7XG4kZGVmYXVsdC1mb250LXNpemU6ICRmb250LXNpemUtbWVkaXVtO1xuXG4vKipcbiAqIEJsb2NrIHBhZGRpbmdzLlxuICovXG5cbi8vIFBhZGRpbmcgZm9yIGJsb2NrcyB3aXRoIGEgYmFja2dyb3VuZCBjb2xvciAoZS5nLiBwYXJhZ3JhcGggb3IgZ3JvdXApLlxuJGJsb2NrLWJnLXBhZGRpbmctLXY6IDEuMjVlbTtcbiRibG9jay1iZy1wYWRkaW5nLS1oOiAyLjM3NWVtO1xuXG5cbi8qKlxuICogUmVhY3QgTmF0aXZlIHNwZWNpZmljLlxuICogVGhlc2UgdmFyaWFibGVzIGRvIG5vdCBhcHBlYXIgdG8gYmUgdXNlZCBhbnl3aGVyZSBlbHNlLlxuICovXG5cbi8vIERpbWVuc2lvbnMuXG4kbW9iaWxlLWhlYWRlci10b29sYmFyLWhlaWdodDogNDRweDtcbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItZXhwYW5kZWQtaGVpZ2h0OiA1MnB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLWhlaWdodDogNDRweDtcbiRtb2JpbGUtZmxvYXRpbmctdG9vbGJhci1tYXJnaW46IDhweDtcbiRtb2JpbGUtY29sb3Itc3dhdGNoOiA0OHB4O1xuXG4vLyBCbG9jayBVSS5cbiRtb2JpbGUtYmxvY2stdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kZGltbWVkLW9wYWNpdHk6IDE7XG4kYmxvY2stZWRnZS10by1jb250ZW50OiAxNnB4O1xuJHNvbGlkLWJvcmRlci1zcGFjZTogMTJweDtcbiRkYXNoZWQtYm9yZGVyLXNwYWNlOiA2cHg7XG4kYmxvY2stc2VsZWN0ZWQtbWFyZ2luOiAzcHg7XG4kYmxvY2stc2VsZWN0ZWQtYm9yZGVyLXdpZHRoOiAxcHg7XG4kYmxvY2stc2VsZWN0ZWQtcGFkZGluZzogMDtcbiRibG9jay1zZWxlY3RlZC1jaGlsZC1tYXJnaW46IDVweDtcbiRibG9jay1zZWxlY3RlZC10by1jb250ZW50OiAkYmxvY2stZWRnZS10by1jb250ZW50IC0gJGJsb2NrLXNlbGVjdGVkLW1hcmdpbiAtICRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg7XG4iLCIvKipcbiAqIENvbG9yc1xuICovXG5cbi8vIFdvcmRQcmVzcyBncmF5cy5cbiRibGFjazogIzAwMDtcdFx0XHQvLyBVc2Ugb25seSB3aGVuIHlvdSB0cnVseSBuZWVkIHB1cmUgYmxhY2suIEZvciBVSSwgdXNlICRncmF5LTkwMC5cbiRncmF5LTkwMDogIzFlMWUxZTtcbiRncmF5LTgwMDogIzJmMmYyZjtcbiRncmF5LTcwMDogIzc1NzU3NTtcdFx0Ly8gTWVldHMgNC42OjEgKDQuNToxIGlzIG1pbmltdW0pIHRleHQgY29udHJhc3QgYWdhaW5zdCB3aGl0ZS5cbiRncmF5LTYwMDogIzk0OTQ5NDtcdFx0Ly8gTWVldHMgMzoxIFVJIG9yIGxhcmdlIHRleHQgY29udHJhc3QgYWdhaW5zdCB3aGl0ZS5cbiRncmF5LTQwMDogI2NjYztcbiRncmF5LTMwMDogI2RkZDtcdFx0Ly8gVXNlZCBmb3IgbW9zdCBib3JkZXJzLlxuJGdyYXktMjAwOiAjZTBlMGUwO1x0XHQvLyBVc2VkIHNwYXJpbmdseSBmb3IgbGlnaHQgYm9yZGVycy5cbiRncmF5LTEwMDogI2YwZjBmMDtcdFx0Ly8gVXNlZCBmb3IgbGlnaHQgZ3JheSBiYWNrZ3JvdW5kcy5cbiR3aGl0ZTogI2ZmZjtcblxuLy8gT3BhY2l0aWVzICYgYWRkaXRpb25hbCBjb2xvcnMuXG4kZGFyay1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC42Mik7XG4kbWVkaXVtLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjU1KTtcbiRsaWdodC1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCR3aGl0ZSwgMC42NSk7XG5cbi8vIEFsZXJ0IGNvbG9ycy5cbiRhbGVydC15ZWxsb3c6ICNmMGI4NDk7XG4kYWxlcnQtcmVkOiAjY2MxODE4O1xuJGFsZXJ0LWdyZWVuOiAjNGFiODY2O1xuXG4vLyBEZXByZWNhdGVkLCBwbGVhc2UgYXZvaWQgdXNpbmcgdGhlc2UuXG4kZGFyay10aGVtZS1mb2N1czogJHdoaXRlO1x0Ly8gRm9jdXMgY29sb3Igd2hlbiB0aGUgdGhlbWUgaXMgZGFyay5cbiIsIi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbkB1c2UgXCJzYXNzOmNvbG9yXCI7XG5AdXNlIFwic2FzczptYXRoXCI7XG5AdXNlIFwiLi92YXJpYWJsZXNcIjtcbkB1c2UgXCIuL2NvbG9yc1wiO1xuQHVzZSBcIi4vYnJlYWtwb2ludHNcIjtcbkB1c2UgXCIuL2Z1bmN0aW9uc1wiO1xuQHVzZSBcIi4vbG9uZy1jb250ZW50LWZhZGVcIjtcblxuQG1peGluIF90ZXh0LWhlYWRpbmcoKSB7XG5cdGZvbnQtZmFtaWx5OiB2YXJpYWJsZXMuJGZvbnQtZmFtaWx5LWhlYWRpbmdzO1xuXHRmb250LXdlaWdodDogdmFyaWFibGVzLiRmb250LXdlaWdodC1tZWRpdW07XG59XG5cbkBtaXhpbiBfdGV4dC1ib2R5KCkge1xuXHRmb250LWZhbWlseTogdmFyaWFibGVzLiRmb250LWZhbWlseS1ib2R5O1xuXHRmb250LXdlaWdodDogdmFyaWFibGVzLiRmb250LXdlaWdodC1yZWd1bGFyO1xufVxuXG5AbWl4aW4gaGVhZGluZy1zbWFsbCgpIHtcblx0QGluY2x1ZGUgX3RleHQtaGVhZGluZygpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLXgtc21hbGw7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDtcbn1cblxuQG1peGluIGhlYWRpbmctbWVkaXVtKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1oZWFkaW5nKCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtbWVkaXVtO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsO1xufVxuXG5AbWl4aW4gaGVhZGluZy1sYXJnZSgpIHtcblx0QGluY2x1ZGUgX3RleHQtaGVhZGluZygpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLWxhcmdlO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsO1xufVxuXG5AbWl4aW4gaGVhZGluZy14LWxhcmdlKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1oZWFkaW5nKCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUteC1sYXJnZTtcblx0bGluZS1oZWlnaHQ6IHZhcmlhYmxlcy4kZm9udC1saW5lLWhlaWdodC1tZWRpdW07XG59XG5cbkBtaXhpbiBoZWFkaW5nLTJ4LWxhcmdlKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1oZWFkaW5nKCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtMngtbGFyZ2U7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQtMngtbGFyZ2U7XG59XG5cbkBtaXhpbiBib2R5LXNtYWxsKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1ib2R5KCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtc21hbGw7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDtcbn1cblxuQG1peGluIGJvZHktbWVkaXVtKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1ib2R5KCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtbWVkaXVtO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsO1xufVxuXG5AbWl4aW4gYm9keS1sYXJnZSgpIHtcblx0QGluY2x1ZGUgX3RleHQtYm9keSgpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLWxhcmdlO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LW1lZGl1bTtcbn1cblxuQG1peGluIGJvZHkteC1sYXJnZSgpIHtcblx0QGluY2x1ZGUgX3RleHQtYm9keSgpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLXgtbGFyZ2U7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTtcbn1cblxuLyoqXG4gKiBCcmVha3BvaW50IG1peGluc1xuICovXG5cbkBtaXhpbiBicmVhay14aHVnZSgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWsteGh1Z2UpIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG5AbWl4aW4gYnJlYWstaHVnZSgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstaHVnZSkgfSkge1xuXHRcdEBjb250ZW50O1xuXHR9XG59XG5cbkBtaXhpbiBicmVhay13aWRlKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay13aWRlKSB9KSB7XG5cdFx0QGNvbnRlbnQ7XG5cdH1cbn1cblxuQG1peGluIGJyZWFrLXhsYXJnZSgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWsteGxhcmdlKSB9KSB7XG5cdFx0QGNvbnRlbnQ7XG5cdH1cbn1cblxuQG1peGluIGJyZWFrLWxhcmdlKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1sYXJnZSkgfSkge1xuXHRcdEBjb250ZW50O1xuXHR9XG59XG5cbkBtaXhpbiBicmVhay1tZWRpdW0oKSB7XG5cdEBtZWRpYSAobWluLXdpZHRoOiAjeyAoYnJlYWtwb2ludHMuJGJyZWFrLW1lZGl1bSkgfSkge1xuXHRcdEBjb250ZW50O1xuXHR9XG59XG5cbkBtaXhpbiBicmVhay1zbWFsbCgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstc21hbGwpIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG5AbWl4aW4gYnJlYWstbW9iaWxlKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1tb2JpbGUpIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG5AbWl4aW4gYnJlYWstem9vbWVkLWluKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay16b29tZWQtaW4pIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG4vKipcbiAqIEZvY3VzIHN0eWxlcy5cbiAqL1xuXG5AbWl4aW4gYmxvY2stdG9vbGJhci1idXR0b24tc3R5bGVfX2ZvY3VzKCkge1xuXHRib3gtc2hhZG93OiBpbnNldCAwIDAgMCB2YXJpYWJsZXMuJGJvcmRlci13aWR0aCBjb2xvcnMuJHdoaXRlLCAwIDAgMCB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpIHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKTtcblxuXHQvLyBXaW5kb3dzIEhpZ2ggQ29udHJhc3QgbW9kZSB3aWxsIHNob3cgdGhpcyBvdXRsaW5lLCBidXQgbm90IHRoZSBib3gtc2hhZG93LlxuXHRvdXRsaW5lOiAycHggc29saWQgdHJhbnNwYXJlbnQ7XG59XG5cbi8vIFRhYnMsIElucHV0cywgU3F1YXJlIGJ1dHRvbnMuXG5AbWl4aW4gaW5wdXQtc3R5bGVfX25ldXRyYWwoKSB7XG5cdGJveC1zaGFkb3c6IDAgMCAwIHRyYW5zcGFyZW50O1xuXHRib3JkZXItcmFkaXVzOiB2YXJpYWJsZXMuJHJhZGl1cy1zbWFsbDtcblx0Ym9yZGVyOiB2YXJpYWJsZXMuJGJvcmRlci13aWR0aCBzb2xpZCBjb2xvcnMuJGdyYXktNjAwO1xuXG5cdEBtZWRpYSBub3QgKHByZWZlcnMtcmVkdWNlZC1tb3Rpb24pIHtcblx0XHR0cmFuc2l0aW9uOiBib3gtc2hhZG93IDAuMXMgbGluZWFyO1xuXHR9XG59XG5cblxuQG1peGluIGlucHV0LXN0eWxlX19mb2N1cygkYWNjZW50LWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcikpIHtcblx0Ym9yZGVyLWNvbG9yOiAkYWNjZW50LWNvbG9yO1xuXHQvLyBFeHBhbmQgdGhlIGRlZmF1bHQgYm9yZGVyIGZvY3VzIHN0eWxlIGJ5IC41cHggdG8gYmUgYSB0b3RhbCBvZiAxLjVweC5cblx0Ym94LXNoYWRvdzogMCAwIDAgMC41cHggJGFjY2VudC1jb2xvcjtcblx0Ly8gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUgd2lsbCBzaG93IHRoaXMgb3V0bGluZSwgYnV0IG5vdCB0aGUgYm94LXNoYWRvdy5cblx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xufVxuXG5AbWl4aW4gYnV0dG9uLXN0eWxlX19mb2N1cygpIHtcblx0Ym94LXNoYWRvdzogMCAwIDAgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cblx0Ly8gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUgd2lsbCBzaG93IHRoaXMgb3V0bGluZSwgYnV0IG5vdCB0aGUgYm94LXNoYWRvdy5cblx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xufVxuXG5cbkBtaXhpbiBidXR0b24tc3R5bGUtb3V0c2V0X19mb2N1cygkZm9jdXMtY29sb3IpIHtcblx0Ym94LXNoYWRvdzogMCAwIDAgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSBjb2xvcnMuJHdoaXRlLCAwIDAgMCBjYWxjKDIgKiB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpKSAkZm9jdXMtY29sb3I7XG5cblx0Ly8gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUgd2lsbCBzaG93IHRoaXMgb3V0bGluZSwgYnV0IG5vdCB0aGUgYm94LXNoYWRvdy5cblx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xuXHRvdXRsaW5lLW9mZnNldDogMnB4O1xufVxuXG5cbi8qKlxuICogQXBwbGllcyBlZGl0b3IgbGVmdCBwb3NpdGlvbiB0byB0aGUgc2VsZWN0b3IgcGFzc2VkIGFzIGFyZ3VtZW50XG4gKi9cblxuQG1peGluIGVkaXRvci1sZWZ0KCRzZWxlY3Rvcikge1xuXHQjeyRzZWxlY3Rvcn0geyAvKiBTZXQgbGVmdCBwb3NpdGlvbiB3aGVuIGF1dG8tZm9sZCBpcyBub3Qgb24gdGhlIGJvZHkgZWxlbWVudC4gKi9cblx0XHRsZWZ0OiAwO1xuXG5cdFx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstbWVkaXVtICsgMSkgfSkge1xuXHRcdFx0bGVmdDogdmFyaWFibGVzLiRhZG1pbi1zaWRlYmFyLXdpZHRoO1xuXHRcdH1cblx0fVxuXG5cdC5hdXRvLWZvbGQgI3skc2VsZWN0b3J9IHsgLyogQXV0byBmb2xkIGlzIHdoZW4gb24gc21hbGxlciBicmVha3BvaW50cywgbmF2IG1lbnUgYXV0byBjb2xsYXBzZXMuICovXG5cdFx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstbWVkaXVtICsgMSkgfSkge1xuXHRcdFx0bGVmdDogdmFyaWFibGVzLiRhZG1pbi1zaWRlYmFyLXdpZHRoLWNvbGxhcHNlZDtcblx0XHR9XG5cblx0XHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1sYXJnZSArIDEpIH0pIHtcblx0XHRcdGxlZnQ6IHZhcmlhYmxlcy4kYWRtaW4tc2lkZWJhci13aWR0aDtcblx0XHR9XG5cdH1cblxuXHQvKiBTaWRlYmFyIG1hbnVhbGx5IGNvbGxhcHNlZC4gKi9cblx0LmZvbGRlZCAjeyRzZWxlY3Rvcn0ge1xuXHRcdGxlZnQ6IDA7XG5cblx0XHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1tZWRpdW0gKyAxKSB9KSB7XG5cdFx0XHRsZWZ0OiB2YXJpYWJsZXMuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkO1xuXHRcdH1cblx0fVxuXG5cdGJvZHkuaXMtZnVsbHNjcmVlbi1tb2RlICN7JHNlbGVjdG9yfSB7XG5cdFx0bGVmdDogMCAhaW1wb3J0YW50O1xuXHR9XG59XG5cbi8qKlxuICogU3R5bGVzIHRoYXQgYXJlIHJldXNlZCB2ZXJiYXRpbSBpbiBhIGZldyBwbGFjZXNcbiAqL1xuXG4vLyBUaGVzZSBhcmUgYWRkaXRpb25hbCBzdHlsZXMgZm9yIGFsbCBjYXB0aW9ucywgd2hlbiB0aGUgdGhlbWUgb3B0cyBpbiB0byBibG9jayBzdHlsZXMuXG5AbWl4aW4gY2FwdGlvbi1zdHlsZSgpIHtcblx0bWFyZ2luLXRvcDogMC41ZW07XG5cdG1hcmdpbi1ib3R0b206IDFlbTtcbn1cblxuQG1peGluIGNhcHRpb24tc3R5bGUtdGhlbWUoKSB7XG5cdGNvbG9yOiAjNTU1O1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZGVmYXVsdC1mb250LXNpemU7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcblxuXHQuaXMtZGFyay10aGVtZSAmIHtcblx0XHRjb2xvcjogY29sb3JzLiRsaWdodC1ncmF5LXBsYWNlaG9sZGVyO1xuXHR9XG59XG5cbi8qKlxuICogQWxsb3dzIHVzZXJzIHRvIG9wdC1vdXQgb2YgYW5pbWF0aW9ucyB2aWEgT1MtbGV2ZWwgcHJlZmVyZW5jZXMuXG4gKi9cblxuQG1peGluIHJlZHVjZS1tb3Rpb24oJHByb3BlcnR5OiBcIlwiKSB7XG5cblx0QGlmICRwcm9wZXJ0eSA9PSBcInRyYW5zaXRpb25cIiB7XG5cdFx0QG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpIHtcblx0XHRcdHRyYW5zaXRpb24tZHVyYXRpb246IDBzO1xuXHRcdFx0dHJhbnNpdGlvbi1kZWxheTogMHM7XG5cdFx0fVxuXHR9IEBlbHNlIGlmICRwcm9wZXJ0eSA9PSBcImFuaW1hdGlvblwiIHtcblx0XHRAbWVkaWEgKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSkge1xuXHRcdFx0YW5pbWF0aW9uLWR1cmF0aW9uOiAxbXM7XG5cdFx0XHRhbmltYXRpb24tZGVsYXk6IDBzO1xuXHRcdH1cblx0fSBAZWxzZSB7XG5cdFx0QG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpIHtcblx0XHRcdHRyYW5zaXRpb24tZHVyYXRpb246IDBzO1xuXHRcdFx0dHJhbnNpdGlvbi1kZWxheTogMHM7XG5cdFx0XHRhbmltYXRpb24tZHVyYXRpb246IDFtcztcblx0XHRcdGFuaW1hdGlvbi1kZWxheTogMHM7XG5cdFx0fVxuXHR9XG59XG5cbkBtaXhpbiBpbnB1dC1jb250cm9sKCRhY2NlbnQtY29sb3I6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKSkge1xuXHRmb250LWZhbWlseTogdmFyaWFibGVzLiRkZWZhdWx0LWZvbnQ7XG5cdHBhZGRpbmc6IDZweCA4cHg7XG5cdC8qIEZvbnRzIHNtYWxsZXIgdGhhbiAxNnB4IGNhdXNlcyBtb2JpbGUgc2FmYXJpIHRvIHpvb20uICovXG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRtb2JpbGUtdGV4dC1taW4tZm9udC1zaXplO1xuXHQvKiBPdmVycmlkZSBjb3JlIGxpbmUtaGVpZ2h0LiBUbyBiZSByZXZpZXdlZC4gKi9cblx0bGluZS1oZWlnaHQ6IG5vcm1hbDtcblx0QGluY2x1ZGUgaW5wdXQtc3R5bGVfX25ldXRyYWwoKTtcblxuXHRAaW5jbHVkZSBicmVhay1zbWFsbCB7XG5cdFx0Zm9udC1zaXplOiB2YXJpYWJsZXMuJGRlZmF1bHQtZm9udC1zaXplO1xuXHRcdC8qIE92ZXJyaWRlIGNvcmUgbGluZS1oZWlnaHQuIFRvIGJlIHJldmlld2VkLiAqL1xuXHRcdGxpbmUtaGVpZ2h0OiBub3JtYWw7XG5cdH1cblxuXHQmOmZvY3VzIHtcblx0XHRAaW5jbHVkZSBpbnB1dC1zdHlsZV9fZm9jdXMoJGFjY2VudC1jb2xvcik7XG5cdH1cblxuXHQvLyBVc2Ugb3BhY2l0eSB0byB3b3JrIGluIHZhcmlvdXMgZWRpdG9yIHN0eWxlcy5cblx0Jjo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciB7XG5cdFx0Y29sb3I6IGNvbG9ycy4kZGFyay1ncmF5LXBsYWNlaG9sZGVyO1xuXHR9XG5cblx0Jjo6LW1vei1wbGFjZWhvbGRlciB7XG5cdFx0Y29sb3I6IGNvbG9ycy4kZGFyay1ncmF5LXBsYWNlaG9sZGVyO1xuXHR9XG5cblx0JjotbXMtaW5wdXQtcGxhY2Vob2xkZXIge1xuXHRcdGNvbG9yOiBjb2xvcnMuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjtcblx0fVxufVxuXG5AbWl4aW4gY2hlY2tib3gtY29udHJvbCB7XG5cdGJvcmRlcjogdmFyaWFibGVzLiRib3JkZXItd2lkdGggc29saWQgY29sb3JzLiRncmF5LTkwMDtcblx0bWFyZ2luLXJpZ2h0OiB2YXJpYWJsZXMuJGdyaWQtdW5pdC0xNTtcblx0dHJhbnNpdGlvbjogbm9uZTtcblx0Ym9yZGVyLXJhZGl1czogdmFyaWFibGVzLiRyYWRpdXMtc21hbGw7XG5cdEBpbmNsdWRlIGlucHV0LWNvbnRyb2w7XG5cblx0Jjpmb2N1cyB7XG5cdFx0Ym94LXNoYWRvdzogMCAwIDAgKHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoICogMikgY29sb3JzLiR3aGl0ZSwgMCAwIDAgKHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoICogMiArIHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrKSB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cblx0XHQvLyBPbmx5IHZpc2libGUgaW4gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUuXG5cdFx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xuXHR9XG5cblx0JjpjaGVja2VkIHtcblx0XHRiYWNrZ3JvdW5kOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cdFx0Ym9yZGVyLWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cblx0XHQvLyBIaWRlIGRlZmF1bHQgY2hlY2tib3ggc3R5bGVzIGluIElFLlxuXHRcdCY6Oi1tcy1jaGVjayB7XG5cdFx0XHRvcGFjaXR5OiAwO1xuXHRcdH1cblx0fVxuXG5cdCY6Y2hlY2tlZDo6YmVmb3JlLFxuXHQmW2FyaWEtY2hlY2tlZD1cIm1peGVkXCJdOjpiZWZvcmUge1xuXHRcdG1hcmdpbjogLTNweCAtNXB4O1xuXHRcdGNvbG9yOiBjb2xvcnMuJHdoaXRlO1xuXG5cdFx0QGluY2x1ZGUgYnJlYWstbWVkaXVtKCkge1xuXHRcdFx0bWFyZ2luOiAtNHB4IDAgMCAtNXB4O1xuXHRcdH1cblx0fVxuXG5cdCZbYXJpYS1jaGVja2VkPVwibWl4ZWRcIl0ge1xuXHRcdGJhY2tncm91bmQ6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKTtcblx0XHRib3JkZXItY29sb3I6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKTtcblxuXHRcdCY6OmJlZm9yZSB7XG5cdFx0XHQvLyBJbmhlcml0ZWQgZnJvbSBgZm9ybXMuY3NzYC5cblx0XHRcdC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL1dvcmRQcmVzcy93b3JkcHJlc3MtZGV2ZWxvcC90cmVlLzUuMS4xL3NyYy93cC1hZG1pbi9jc3MvZm9ybXMuY3NzI0wxMjItTDEzMlxuXHRcdFx0Y29udGVudDogXCJcXGY0NjBcIjtcblx0XHRcdGZsb2F0OiBsZWZ0O1xuXHRcdFx0ZGlzcGxheTogaW5saW5lLWJsb2NrO1xuXHRcdFx0dmVydGljYWwtYWxpZ246IG1pZGRsZTtcblx0XHRcdHdpZHRoOiAxNnB4O1xuXHRcdFx0Lyogc3R5bGVsaW50LWRpc2FibGUtbmV4dC1saW5lIGZvbnQtZmFtaWx5LW5vLW1pc3NpbmctZ2VuZXJpYy1mYW1pbHkta2V5d29yZCAtLSBkYXNoaWNvbnMgZG9uJ3QgbmVlZCBhIGdlbmVyaWMgZmFtaWx5IGtleXdvcmQuICovXG5cdFx0XHRmb250OiBub3JtYWwgMzBweC8xIGRhc2hpY29ucztcblx0XHRcdHNwZWFrOiBub25lO1xuXHRcdFx0LXdlYmtpdC1mb250LXNtb290aGluZzogYW50aWFsaWFzZWQ7XG5cdFx0XHQtbW96LW9zeC1mb250LXNtb290aGluZzogZ3JheXNjYWxlO1xuXG5cdFx0XHRAaW5jbHVkZSBicmVhay1tZWRpdW0oKSB7XG5cdFx0XHRcdGZsb2F0OiBub25lO1xuXHRcdFx0XHRmb250LXNpemU6IDIxcHg7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0JlthcmlhLWRpc2FibGVkPVwidHJ1ZVwiXSxcblx0JjpkaXNhYmxlZCB7XG5cdFx0YmFja2dyb3VuZDogY29sb3JzLiRncmF5LTEwMDtcblx0XHRib3JkZXItY29sb3I6IGNvbG9ycy4kZ3JheS0zMDA7XG5cdFx0Y3Vyc29yOiBkZWZhdWx0O1xuXG5cdFx0Ly8gT3ZlcnJpZGUgc3R5bGUgaW5oZXJpdGVkIGZyb20gd3AtYWRtaW4uIFJlcXVpcmVkIHRvIGF2b2lkIGRlZ3JhZGVkIGFwcGVhcmFuY2Ugb24gZGlmZmVyZW50IGJhY2tncm91bmRzLlxuXHRcdG9wYWNpdHk6IDE7XG5cdH1cbn1cblxuQG1peGluIHJhZGlvLWNvbnRyb2wge1xuXHRib3JkZXI6IHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoIHNvbGlkIGNvbG9ycy4kZ3JheS05MDA7XG5cdG1hcmdpbi1yaWdodDogdmFyaWFibGVzLiRncmlkLXVuaXQtMTU7XG5cdHRyYW5zaXRpb246IG5vbmU7XG5cdGJvcmRlci1yYWRpdXM6IHZhcmlhYmxlcy4kcmFkaXVzLXJvdW5kO1xuXHR3aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplLXNtO1xuXHRoZWlnaHQ6IHZhcmlhYmxlcy4kcmFkaW8taW5wdXQtc2l6ZS1zbTtcblx0bWluLXdpZHRoOiB2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUtc207XG5cdG1heC13aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplLXNtO1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cblx0QG1lZGlhIG5vdCAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbikge1xuXHRcdHRyYW5zaXRpb246IGJveC1zaGFkb3cgMC4xcyBsaW5lYXI7XG5cdH1cblxuXHRAaW5jbHVkZSBicmVhay1zbWFsbCgpIHtcblx0XHRoZWlnaHQ6IHZhcmlhYmxlcy4kcmFkaW8taW5wdXQtc2l6ZTtcblx0XHR3aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplO1xuXHRcdG1pbi13aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplO1xuXHRcdG1heC13aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplO1xuXHR9XG5cblx0JjpjaGVja2VkOjpiZWZvcmUge1xuXHRcdGJveC1zaXppbmc6IGluaGVyaXQ7XG5cdFx0d2lkdGg6IG1hdGguZGl2KHZhcmlhYmxlcy4kcmFkaW8taW5wdXQtc2l6ZS1zbSwgMik7XG5cdFx0aGVpZ2h0OiBtYXRoLmRpdih2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUtc20sIDIpO1xuXHRcdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0XHR0b3A6IDUwJTtcblx0XHRsZWZ0OiA1MCU7XG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG5cdFx0bWFyZ2luOiAwO1xuXHRcdGJhY2tncm91bmQtY29sb3I6IGNvbG9ycy4kd2hpdGU7XG5cblx0XHQvLyBUaGlzIGJvcmRlciBzZXJ2ZXMgYXMgYSBiYWNrZ3JvdW5kIGNvbG9yIGluIFdpbmRvd3MgSGlnaCBDb250cmFzdCBtb2RlLlxuXHRcdGJvcmRlcjogNHB4IHNvbGlkIGNvbG9ycy4kd2hpdGU7XG5cblx0XHRAaW5jbHVkZSBicmVhay1zbWFsbCgpIHtcblx0XHRcdHdpZHRoOiBtYXRoLmRpdih2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUsIDIpO1xuXHRcdFx0aGVpZ2h0OiBtYXRoLmRpdih2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUsIDIpO1xuXHRcdH1cblx0fVxuXG5cdCY6Zm9jdXMge1xuXHRcdGJveC1zaGFkb3c6IDAgMCAwICh2YXJpYWJsZXMuJGJvcmRlci13aWR0aCAqIDIpIGNvbG9ycy4kd2hpdGUsIDAgMCAwICh2YXJpYWJsZXMuJGJvcmRlci13aWR0aCAqIDIgKyB2YXJpYWJsZXMuJGJvcmRlci13aWR0aC1mb2N1cy1mYWxsYmFjaykgdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IpO1xuXG5cdFx0Ly8gT25seSB2aXNpYmxlIGluIFdpbmRvd3MgSGlnaCBDb250cmFzdCBtb2RlLlxuXHRcdG91dGxpbmU6IDJweCBzb2xpZCB0cmFuc3BhcmVudDtcblx0fVxuXG5cdCY6Y2hlY2tlZCB7XG5cdFx0YmFja2dyb3VuZDogdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IpO1xuXHRcdGJvcmRlcjogbm9uZTtcblx0fVxufVxuXG4vKipcbiAqIFJlc2V0IGRlZmF1bHQgc3R5bGVzIGZvciBKYXZhU2NyaXB0IFVJIGJhc2VkIHBhZ2VzLlxuICogVGhpcyBpcyBhIFdQLWFkbWluIGFnbm9zdGljIHJlc2V0XG4gKi9cblxuQG1peGluIHJlc2V0IHtcblx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcblxuXHQqLFxuXHQqOjpiZWZvcmUsXG5cdCo6OmFmdGVyIHtcblx0XHRib3gtc2l6aW5nOiBpbmhlcml0O1xuXHR9XG59XG5cbkBtaXhpbiBsaW5rLXJlc2V0IHtcblx0Jjpmb2N1cyB7XG5cdFx0Y29sb3I6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yLS1yZ2IpO1xuXHRcdGJveC1zaGFkb3c6IDAgMCAwIHZhcigtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1cykgdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IsICMwMDdjYmEpO1xuXHRcdGJvcmRlci1yYWRpdXM6IHZhcmlhYmxlcy4kcmFkaXVzLXNtYWxsO1xuXHR9XG59XG5cbi8vIFRoZSBlZGl0b3IgaW5wdXQgcmVzZXQgd2l0aCBpbmNyZWFzZWQgc3BlY2lmaWNpdHkgdG8gYXZvaWQgdGhlbWUgc3R5bGVzIGJsZWVkaW5nIGluLlxuQG1peGluIGVkaXRvci1pbnB1dC1yZXNldCgpIHtcblx0Zm9udC1mYW1pbHk6IHZhcmlhYmxlcy4kZWRpdG9yLWh0bWwtZm9udCAhaW1wb3J0YW50O1xuXHRjb2xvcjogY29sb3JzLiRncmF5LTkwMCAhaW1wb3J0YW50O1xuXHRiYWNrZ3JvdW5kOiBjb2xvcnMuJHdoaXRlICFpbXBvcnRhbnQ7XG5cdHBhZGRpbmc6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTE1ICFpbXBvcnRhbnQ7XG5cdGJvcmRlcjogdmFyaWFibGVzLiRib3JkZXItd2lkdGggc29saWQgY29sb3JzLiRncmF5LTkwMCAhaW1wb3J0YW50O1xuXHRib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XG5cdGJvcmRlci1yYWRpdXM6IHZhcmlhYmxlcy4kcmFkaXVzLXNtYWxsICFpbXBvcnRhbnQ7XG5cblx0Ly8gRm9udHMgc21hbGxlciB0aGFuIDE2cHggY2F1c2VzIG1vYmlsZSBzYWZhcmkgdG8gem9vbS5cblx0Zm9udC1zaXplOiB2YXJpYWJsZXMuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemUgIWltcG9ydGFudDtcblx0QGluY2x1ZGUgYnJlYWstc21hbGwge1xuXHRcdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRkZWZhdWx0LWZvbnQtc2l6ZSAhaW1wb3J0YW50O1xuXHR9XG5cblx0Jjpmb2N1cyB7XG5cdFx0Ym9yZGVyLWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcikgIWltcG9ydGFudDtcblx0XHRib3gtc2hhZG93OiAwIDAgMCAodmFyaWFibGVzLiRib3JkZXItd2lkdGgtZm9jdXMtZmFsbGJhY2sgLSB2YXJpYWJsZXMuJGJvcmRlci13aWR0aCkgdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IpICFpbXBvcnRhbnQ7XG5cblx0XHQvLyBXaW5kb3dzIEhpZ2ggQ29udHJhc3QgbW9kZSB3aWxsIHNob3cgdGhpcyBvdXRsaW5lLCBidXQgbm90IHRoZSBib3gtc2hhZG93LlxuXHRcdG91dGxpbmU6IDJweCBzb2xpZCB0cmFuc3BhcmVudCAhaW1wb3J0YW50O1xuXHR9XG59XG5cbi8qKlxuICogUmVzZXQgdGhlIFdQIEFkbWluIHBhZ2Ugc3R5bGVzIGZvciBHdXRlbmJlcmctbGlrZSBwYWdlcy5cbiAqL1xuXG5AbWl4aW4gd3AtYWRtaW4tcmVzZXQoICRjb250ZW50LWNvbnRhaW5lciApIHtcblx0YmFja2dyb3VuZDogY29sb3JzLiR3aGl0ZTtcblxuXHQjd3Bjb250ZW50IHtcblx0XHRwYWRkaW5nLWxlZnQ6IDA7XG5cdH1cblxuXHQjd3Bib2R5LWNvbnRlbnQge1xuXHRcdHBhZGRpbmctYm90dG9tOiAwO1xuXHR9XG5cblx0LyogV2UgaGlkZSBsZWdhY3kgbm90aWNlcyBpbiBHdXRlbmJlcmcgQmFzZWQgUGFnZXMsIGJlY2F1c2UgdGhleSB3ZXJlIG5vdCBkZXNpZ25lZCBpbiBhIHdheSB0aGF0IHNjYWxlZCB3ZWxsLlxuXHQgICBQbHVnaW5zIGNhbiB1c2UgR3V0ZW5iZXJnIG5vdGljZXMgaWYgdGhleSBuZWVkIHRvIHBhc3Mgb24gaW5mb3JtYXRpb24gdG8gdGhlIHVzZXIgd2hlbiB0aGV5IGFyZSBlZGl0aW5nLiAqL1xuXHQjd3Bib2R5LWNvbnRlbnQgPiBkaXY6bm90KCN7ICRjb250ZW50LWNvbnRhaW5lciB9KTpub3QoI3NjcmVlbi1tZXRhKSB7XG5cdFx0ZGlzcGxheTogbm9uZTtcblx0fVxuXG5cdCN3cGZvb3RlciB7XG5cdFx0ZGlzcGxheTogbm9uZTtcblx0fVxuXG5cdC5hMTF5LXNwZWFrLXJlZ2lvbiB7XG5cdFx0bGVmdDogLTFweDtcblx0XHR0b3A6IC0xcHg7XG5cdH1cblxuXHR1bCNhZG1pbm1lbnUgYS53cC1oYXMtY3VycmVudC1zdWJtZW51OjphZnRlcixcblx0dWwjYWRtaW5tZW51ID4gbGkuY3VycmVudCA+IGEuY3VycmVudDo6YWZ0ZXIge1xuXHRcdGJvcmRlci1yaWdodC1jb2xvcjogY29sb3JzLiR3aGl0ZTtcblx0fVxuXG5cdC5tZWRpYS1mcmFtZSBzZWxlY3QuYXR0YWNobWVudC1maWx0ZXJzOmxhc3Qtb2YtdHlwZSB7XG5cdFx0d2lkdGg6IGF1dG87XG5cdFx0bWF4LXdpZHRoOiAxMDAlO1xuXHR9XG59XG5cbkBtaXhpbiBhZG1pbi1zY2hlbWUoJGNvbG9yLXByaW1hcnkpIHtcblx0Ly8gRGVmaW5lIFJHQiBlcXVpdmFsZW50cyBmb3IgdXNlIGluIHJnYmEgZnVuY3Rpb24uXG5cdC8vIEhleGFkZWNpbWFsIGNzcyB2YXJzIGRvIG5vdCB3b3JrIGluIHRoZSByZ2JhIGZ1bmN0aW9uLlxuXHQtLXdwLWFkbWluLXRoZW1lLWNvbG9yOiAjeyRjb2xvci1wcmltYXJ5fTtcblx0LS13cC1hZG1pbi10aGVtZS1jb2xvci0tcmdiOiAje2Z1bmN0aW9ucy5oZXgtdG8tcmdiKCRjb2xvci1wcmltYXJ5KX07XG5cdC8vIERhcmtlciBzaGFkZXMuXG5cdC0td3AtYWRtaW4tdGhlbWUtY29sb3ItZGFya2VyLTEwOiAje2NvbG9yLmFkanVzdCgkY29sb3ItcHJpbWFyeSwgJGxpZ2h0bmVzczogLTUlKX07XG5cdC0td3AtYWRtaW4tdGhlbWUtY29sb3ItZGFya2VyLTEwLS1yZ2I6ICN7ZnVuY3Rpb25zLmhleC10by1yZ2IoY29sb3IuYWRqdXN0KCRjb2xvci1wcmltYXJ5LCAkbGlnaHRuZXNzOiAtNSUpKX07XG5cdC0td3AtYWRtaW4tdGhlbWUtY29sb3ItZGFya2VyLTIwOiAje2NvbG9yLmFkanVzdCgkY29sb3ItcHJpbWFyeSwgJGxpZ2h0bmVzczogLTEwJSl9O1xuXHQtLXdwLWFkbWluLXRoZW1lLWNvbG9yLWRhcmtlci0yMC0tcmdiOiAje2Z1bmN0aW9ucy5oZXgtdG8tcmdiKGNvbG9yLmFkanVzdCgkY29sb3ItcHJpbWFyeSwgJGxpZ2h0bmVzczogLTEwJSkpfTtcblxuXHQvLyBGb2N1cyBzdHlsZSB3aWR0aC5cblx0Ly8gQXZvaWQgcm91bmRpbmcgaXNzdWVzIGJ5IHNob3dpbmcgYSB3aG9sZSAycHggZm9yIDF4IHNjcmVlbnMsIGFuZCAxLjVweCBvbiBoaWdoIHJlc29sdXRpb24gc2NyZWVucy5cblx0LS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXM6IDJweDtcblx0QG1lZGlhICggLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpIHtcblx0XHQtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1czogMS41cHg7XG5cdH1cbn1cblxuQG1peGluIHdvcmRwcmVzcy1hZG1pbi1zY2hlbWVzKCkge1xuXHRib2R5LmFkbWluLWNvbG9yLWxpZ2h0IHtcblx0XHRAaW5jbHVkZSBhZG1pbi1zY2hlbWUoIzAwODViYSk7XG5cdH1cblxuXHRib2R5LmFkbWluLWNvbG9yLW1vZGVybiB7XG5cdFx0QGluY2x1ZGUgYWRtaW4tc2NoZW1lKCMzODU4ZTkpO1xuXHR9XG5cblx0Ym9keS5hZG1pbi1jb2xvci1ibHVlIHtcblx0XHRAaW5jbHVkZSBhZG1pbi1zY2hlbWUoIzA5NjQ4NCk7XG5cdH1cblxuXHRib2R5LmFkbWluLWNvbG9yLWNvZmZlZSB7XG5cdFx0QGluY2x1ZGUgYWRtaW4tc2NoZW1lKCM0NjQwM2MpO1xuXHR9XG5cblx0Ym9keS5hZG1pbi1jb2xvci1lY3RvcGxhc20ge1xuXHRcdEBpbmNsdWRlIGFkbWluLXNjaGVtZSgjNTIzZjZkKTtcblx0fVxuXG5cdGJvZHkuYWRtaW4tY29sb3ItbWlkbmlnaHQge1xuXHRcdEBpbmNsdWRlIGFkbWluLXNjaGVtZSgjZTE0ZDQzKTtcblx0fVxuXG5cdGJvZHkuYWRtaW4tY29sb3Itb2NlYW4ge1xuXHRcdEBpbmNsdWRlIGFkbWluLXNjaGVtZSgjNjI3YzgzKTtcblx0fVxuXG5cdGJvZHkuYWRtaW4tY29sb3Itc3VucmlzZSB7XG5cdFx0QGluY2x1ZGUgYWRtaW4tc2NoZW1lKCNkZDgyM2IpO1xuXHR9XG59XG5cbi8vIERlcHJlY2F0ZWQgZnJvbSBVSSwga2VwdCBmb3IgYmFjay1jb21wYXQuXG5AbWl4aW4gYmFja2dyb3VuZC1jb2xvcnMtZGVwcmVjYXRlZCgpIHtcblx0Lmhhcy12ZXJ5LWxpZ2h0LWdyYXktYmFja2dyb3VuZC1jb2xvciB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogI2VlZTtcblx0fVxuXG5cdC5oYXMtdmVyeS1kYXJrLWdyYXktYmFja2dyb3VuZC1jb2xvciB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogIzMxMzEzMTtcblx0fVxufVxuXG4vLyBEZXByZWNhdGVkIGZyb20gVUksIGtlcHQgZm9yIGJhY2stY29tcGF0LlxuQG1peGluIGZvcmVncm91bmQtY29sb3JzLWRlcHJlY2F0ZWQoKSB7XG5cdC5oYXMtdmVyeS1saWdodC1ncmF5LWNvbG9yIHtcblx0XHRjb2xvcjogI2VlZTtcblx0fVxuXG5cdC5oYXMtdmVyeS1kYXJrLWdyYXktY29sb3Ige1xuXHRcdGNvbG9yOiAjMzEzMTMxO1xuXHR9XG59XG5cbi8vIERlcHJlY2F0ZWQgZnJvbSBVSSwga2VwdCBmb3IgYmFjay1jb21wYXQuXG5AbWl4aW4gZ3JhZGllbnQtY29sb3JzLWRlcHJlY2F0ZWQoKSB7XG5cdC8vIE91ciBjbGFzc2VzIHVzZXMgdGhlIHNhbWUgdmFsdWVzIHdlIHNldCBmb3IgZ3JhZGllbnQgdmFsdWUgYXR0cmlidXRlcy5cblxuXHQvKiBzdHlsZWxpbnQtZGlzYWJsZSBAc3R5bGlzdGljL2Z1bmN0aW9uLWNvbW1hLXNwYWNlLWFmdGVyIC0tIFdlIGNhbiBub3QgdXNlIHNwYWNpbmcgYmVjYXVzZSBvZiBXUCBtdWx0aSBzaXRlIGtzZXMgcnVsZS4gKi9cblx0Lmhhcy12aXZpZC1ncmVlbi1jeWFuLXRvLXZpdmlkLWN5YW4tYmx1ZS1ncmFkaWVudC1iYWNrZ3JvdW5kIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLHJnYmEoMCwyMDgsMTMyLDEpIDAlLHJnYmEoNiwxNDcsMjI3LDEpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1wdXJwbGUtY3J1c2gtZ3JhZGllbnQtYmFja2dyb3VuZCB7XG5cdFx0YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZyxyZ2IoNTIsMjI2LDIyOCkgMCUscmdiKDcxLDMzLDI1MSkgNTAlLHJnYigxNzEsMjksMjU0KSAxMDAlKTtcblx0fVxuXG5cdC5oYXMtaGF6eS1kYXduLWdyYWRpZW50LWJhY2tncm91bmQge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcscmdiKDI1MCwxNzIsMTY4KSAwJSxyZ2IoMjE4LDIwOCwyMzYpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1zdWJkdWVkLW9saXZlLWdyYWRpZW50LWJhY2tncm91bmQge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcscmdiKDI1MCwyNTAsMjI1KSAwJSxyZ2IoMTAzLDE2NiwxMTMpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1hdG9taWMtY3JlYW0tZ3JhZGllbnQtYmFja2dyb3VuZCB7XG5cdFx0YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZyxyZ2IoMjUzLDIxNSwxNTQpIDAlLHJnYigwLDc0LDg5KSAxMDAlKTtcblx0fVxuXG5cdC5oYXMtbmlnaHRzaGFkZS1ncmFkaWVudC1iYWNrZ3JvdW5kIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLHJnYig1MSw5LDEwNCkgMCUscmdiKDQ5LDIwNSwyMDcpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1taWRuaWdodC1ncmFkaWVudC1iYWNrZ3JvdW5kIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLHJnYigyLDMsMTI5KSAwJSxyZ2IoNDAsMTE2LDI1MikgMTAwJSk7XG5cdH1cblx0Lyogc3R5bGVsaW50LWVuYWJsZSBAc3R5bGlzdGljL2Z1bmN0aW9uLWNvbW1hLXNwYWNlLWFmdGVyICovXG59XG5cbkBtaXhpbiBjdXN0b20tc2Nyb2xsYmFycy1vbi1ob3ZlcigkaGFuZGxlLWNvbG9yLCAkaGFuZGxlLWNvbG9yLWhvdmVyKSB7XG5cblx0Ly8gV2ViS2l0XG5cdCY6Oi13ZWJraXQtc2Nyb2xsYmFyIHtcblx0XHR3aWR0aDogMTJweDtcblx0XHRoZWlnaHQ6IDEycHg7XG5cdH1cblx0Jjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuXHRcdGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuXHR9XG5cdCY6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHtcblx0XHRiYWNrZ3JvdW5kLWNvbG9yOiAkaGFuZGxlLWNvbG9yO1xuXHRcdGJvcmRlci1yYWRpdXM6IDhweDtcblx0XHRib3JkZXI6IDNweCBzb2xpZCB0cmFuc3BhcmVudDtcblx0XHRiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xuXHR9XG5cdCY6aG92ZXI6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iLCAvLyBUaGlzIG5lZWRzIHNwZWNpZmljaXR5LlxuXHQmOmZvY3VzOjotd2Via2l0LXNjcm9sbGJhci10aHVtYixcblx0Jjpmb2N1cy13aXRoaW46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHtcblx0XHRiYWNrZ3JvdW5kLWNvbG9yOiAkaGFuZGxlLWNvbG9yLWhvdmVyO1xuXHR9XG5cblx0Ly8gRmlyZWZveCAxMDkrIGFuZCBDaHJvbWUgMTExK1xuXHRzY3JvbGxiYXItd2lkdGg6IHRoaW47XG5cdHNjcm9sbGJhci1ndXR0ZXI6IHN0YWJsZSBib3RoLWVkZ2VzO1xuXHRzY3JvbGxiYXItY29sb3I6ICRoYW5kbGUtY29sb3IgdHJhbnNwYXJlbnQ7IC8vIFN5bnRheCwgXCJkYXJrXCIsIFwibGlnaHRcIiwgb3IgXCIjaGFuZGxlLWNvbG9yICN0cmFjay1jb2xvclwiXG5cblx0Jjpob3Zlcixcblx0Jjpmb2N1cyxcblx0Jjpmb2N1cy13aXRoaW4ge1xuXHRcdHNjcm9sbGJhci1jb2xvcjogJGhhbmRsZS1jb2xvci1ob3ZlciB0cmFuc3BhcmVudDtcblx0fVxuXG5cdC8vIE5lZWRlZCB0byBmaXggYSBTYWZhcmkgcmVuZGVyaW5nIGlzc3VlLlxuXHR3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xuXG5cdC8vIEFsd2F5cyBzaG93IHNjcm9sbGJhciBvbiBNb2JpbGUgZGV2aWNlcy5cblx0QG1lZGlhIChob3Zlcjogbm9uZSkge1xuXHRcdCYge1xuXHRcdFx0c2Nyb2xsYmFyLWNvbG9yOiAkaGFuZGxlLWNvbG9yLWhvdmVyIHRyYW5zcGFyZW50O1xuXHRcdH1cblx0fVxufVxuXG5AbWl4aW4gc2VsZWN0ZWQtYmxvY2stb3V0bGluZSgkd2lkdGhSYXRpbzogMSkge1xuXHRvdXRsaW5lLWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cdG91dGxpbmUtc3R5bGU6IHNvbGlkO1xuXHRvdXRsaW5lLXdpZHRoOiBjYWxjKCN7JHdpZHRoUmF0aW99ICogKHZhcigtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1cykgLyB2YXIoLS13cC1ibG9jay1lZGl0b3ItaWZyYW1lLXpvb20tb3V0LXNjYWxlLCAxKSkpO1xuXHRvdXRsaW5lLW9mZnNldDogY2FsYygjeyR3aWR0aFJhdGlvfSAqICgoLTEgKiB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpICkgLyB2YXIoLS13cC1ibG9jay1lZGl0b3ItaWZyYW1lLXpvb20tb3V0LXNjYWxlLCAxKSkpO1xufVxuXG5AbWl4aW4gc2VsZWN0ZWQtYmxvY2stZm9jdXMoJHdpZHRoUmF0aW86IDEpIHtcblx0Y29udGVudDogXCJcIjtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHRwb2ludGVyLWV2ZW50czogbm9uZTtcblx0dG9wOiAwO1xuXHRyaWdodDogMDtcblx0Ym90dG9tOiAwO1xuXHRsZWZ0OiAwO1xuXHRAaW5jbHVkZSBzZWxlY3RlZC1ibG9jay1vdXRsaW5lKCR3aWR0aFJhdGlvKTtcbn1cbiIsIi8qKlxuICogQnJlYWtwb2ludHMgJiBNZWRpYSBRdWVyaWVzXG4gKi9cblxuLy8gTW9zdCB1c2VkIGJyZWFrcG9pbnRzXG4kYnJlYWsteGh1Z2U6IDE5MjBweDtcbiRicmVhay1odWdlOiAxNDQwcHg7XG4kYnJlYWstd2lkZTogMTI4MHB4O1xuJGJyZWFrLXhsYXJnZTogMTA4MHB4O1xuJGJyZWFrLWxhcmdlOiA5NjBweDtcdC8vIGFkbWluIHNpZGViYXIgYXV0byBmb2xkc1xuJGJyZWFrLW1lZGl1bTogNzgycHg7XHQvLyBhZG1pbmJhciBnb2VzIGJpZ1xuJGJyZWFrLXNtYWxsOiA2MDBweDtcbiRicmVhay1tb2JpbGU6IDQ4MHB4O1xuJGJyZWFrLXpvb21lZC1pbjogMjgwcHg7XG5cbi8vIEFsbCBtZWRpYSBxdWVyaWVzIGN1cnJlbnRseSBpbiBXb3JkUHJlc3M6XG4vL1xuLy8gbWluLXdpZHRoOiAyMDAwcHhcbi8vIG1pbi13aWR0aDogMTY4MHB4XG4vLyBtaW4td2lkdGg6IDEyNTBweFxuLy8gbWF4LXdpZHRoOiAxMTIwcHggKlxuLy8gbWF4LXdpZHRoOiAxMDAwcHhcbi8vIG1pbi13aWR0aDogNzY5cHggYW5kIG1heC13aWR0aDogMTAwMHB4XG4vLyBtYXgtd2lkdGg6IDk2MHB4ICpcbi8vIG1heC13aWR0aDogOTAwcHhcbi8vIG1heC13aWR0aDogODUwcHhcbi8vIG1pbi13aWR0aDogODAwcHggYW5kIG1heC13aWR0aDogMTQ5OXB4XG4vLyBtYXgtd2lkdGg6IDgwMHB4XG4vLyBtYXgtd2lkdGg6IDc5OXB4XG4vLyBtYXgtd2lkdGg6IDc4MnB4ICpcbi8vIG1heC13aWR0aDogNzY4cHhcbi8vIG1heC13aWR0aDogNjQwcHggKlxuLy8gbWF4LXdpZHRoOiA2MDBweCAqXG4vLyBtYXgtd2lkdGg6IDUyMHB4XG4vLyBtYXgtd2lkdGg6IDUwMHB4XG4vLyBtYXgtd2lkdGg6IDQ4MHB4ICpcbi8vIG1heC13aWR0aDogNDAwcHggKlxuLy8gbWF4LXdpZHRoOiAzODBweFxuLy8gbWF4LXdpZHRoOiAzMjBweCAqXG4vL1xuLy8gVGhvc2UgbWFya2VkICogc2VlbSB0byBiZSBtb3JlIGNvbW1vbmx5IHVzZWQgdGhhbiB0aGUgb3RoZXJzLlxuLy8gTGV0J3MgdHJ5IGFuZCB1c2UgYXMgZmV3IG9mIHRoZXNlIGFzIHBvc3NpYmxlLCBhbmQgYmUgbWluZGZ1bCBhYm91dCBhZGRpbmcgbmV3IG9uZXMsIHNvIHdlIGRvbid0IG1ha2UgdGhlIHNpdHVhdGlvbiB3b3JzZVxuIiwiLyoqXG4qICBDb252ZXJ0cyBhIGhleCB2YWx1ZSBpbnRvIHRoZSByZ2IgZXF1aXZhbGVudC5cbipcbiogQHBhcmFtIHtzdHJpbmd9IGhleCAtIHRoZSBoZXhhZGVjaW1hbCB2YWx1ZSB0byBjb252ZXJ0XG4qIEByZXR1cm4ge3N0cmluZ30gY29tbWEgc2VwYXJhdGVkIHJnYiB2YWx1ZXNcbiovXG5cbkB1c2UgXCJzYXNzOmNvbG9yXCI7XG5AdXNlIFwic2FzczptZXRhXCI7XG5cbkBmdW5jdGlvbiBoZXgtdG8tcmdiKCRoZXgpIHtcblx0Lypcblx0ICogVE9ETzogYGNvbG9yLntyZWR8Z3JlZW58Ymx1ZX1gIHdpbGwgdHJpZ2dlciBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgaW4gRGFydCBTYXNzLFxuXHQgKiBidXQgdGhlIFNhc3MgdXNlZCBieSB0aGUgR3V0ZW5iZXJnIHByb2plY3QgZG9lc24ndCBzdXBwb3J0IGBjb2xvci5jaGFubmVsKClgIHlldCxcblx0ICogc28gd2UgY2FuJ3QgbWlncmF0ZSB0byBpdCBhdCB0aGlzIHRpbWUuXG5cdCAqIEluIHRoZSBmdXR1cmUsIGFmdGVyIHRoZSBHdXRlbmJlcmcgcHJvamVjdCBoYXMgYmVlbiBmdWxseSBtaWdyYXRlZCB0byBEYXJ0IFNhc3MsXG5cdCAqIFJlbW92ZSB0aGlzIGNvbmRpdGlvbmFsIHN0YXRlbWVudCBhbmQgdXNlIG9ubHkgYGNvbG9yLmNoYW5uZWwoKWAuXG5cdCAqL1xuXHRAaWYgbWV0YS5mdW5jdGlvbi1leGlzdHMoXCJjaGFubmVsXCIsIFwiY29sb3JcIikge1xuXHRcdEByZXR1cm4gY29sb3IuY2hhbm5lbCgkaGV4LCBcInJlZFwiKSwgY29sb3IuY2hhbm5lbCgkaGV4LCBcImdyZWVuXCIpLCBjb2xvci5jaGFubmVsKCRoZXgsIFwiYmx1ZVwiKTtcblx0fSBAZWxzZSB7XG5cdFx0QHJldHVybiBjb2xvci5yZWQoJGhleCksIGNvbG9yLmdyZWVuKCRoZXgpLCBjb2xvci5ibHVlKCRoZXgpO1xuXHR9XG59XG4iLCIvKipcbiAqIExvbmcgY29udGVudCBmYWRlIG1peGluXG4gKlxuICogQ3JlYXRlcyBhIGZhZGluZyBvdmVybGF5IHRvIHNpZ25pZnkgdGhhdCB0aGUgY29udGVudCBpcyBsb25nZXJcbiAqIHRoYW4gdGhlIHNwYWNlIGFsbG93cy5cbiAqL1xuXG5AbWl4aW4gbG9uZy1jb250ZW50LWZhZGUoJGRpcmVjdGlvbjogcmlnaHQsICRzaXplOiAyMCUsICRjb2xvcjogI2ZmZiwgJGVkZ2U6IDAsICR6LWluZGV4OiBmYWxzZSkge1xuXHRjb250ZW50OiBcIlwiO1xuXHRkaXNwbGF5OiBibG9jaztcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHQtd2Via2l0LXRvdWNoLWNhbGxvdXQ6IG5vbmU7XG5cdC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG5cdC1raHRtbC11c2VyLXNlbGVjdDogbm9uZTtcblx0LW1vei11c2VyLXNlbGVjdDogbm9uZTtcblx0LW1zLXVzZXItc2VsZWN0OiBub25lO1xuXHR1c2VyLXNlbGVjdDogbm9uZTtcblx0cG9pbnRlci1ldmVudHM6IG5vbmU7XG5cblx0QGlmICR6LWluZGV4IHtcblx0XHR6LWluZGV4OiAkei1pbmRleDtcblx0fVxuXG5cdEBpZiAkZGlyZWN0aW9uID09IFwiYm90dG9tXCIge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byB0b3AsIHRyYW5zcGFyZW50LCAkY29sb3IgOTAlKTtcblx0XHRsZWZ0OiAkZWRnZTtcblx0XHRyaWdodDogJGVkZ2U7XG5cdFx0dG9wOiAkZWRnZTtcblx0XHRib3R0b206IGNhbGMoMTAwJSAtICRzaXplKTtcblx0XHR3aWR0aDogYXV0bztcblx0fVxuXG5cdEBpZiAkZGlyZWN0aW9uID09IFwidG9wXCIge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sIHRyYW5zcGFyZW50LCAkY29sb3IgOTAlKTtcblx0XHR0b3A6IGNhbGMoMTAwJSAtICRzaXplKTtcblx0XHRsZWZ0OiAkZWRnZTtcblx0XHRyaWdodDogJGVkZ2U7XG5cdFx0Ym90dG9tOiAkZWRnZTtcblx0XHR3aWR0aDogYXV0bztcblx0fVxuXG5cdEBpZiAkZGlyZWN0aW9uID09IFwibGVmdFwiIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gbGVmdCwgdHJhbnNwYXJlbnQsICRjb2xvciA5MCUpO1xuXHRcdHRvcDogJGVkZ2U7XG5cdFx0bGVmdDogJGVkZ2U7XG5cdFx0Ym90dG9tOiAkZWRnZTtcblx0XHRyaWdodDogYXV0bztcblx0XHR3aWR0aDogJHNpemU7XG5cdFx0aGVpZ2h0OiBhdXRvO1xuXHR9XG5cblx0QGlmICRkaXJlY3Rpb24gPT0gXCJyaWdodFwiIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIHRyYW5zcGFyZW50LCAkY29sb3IgOTAlKTtcblx0XHR0b3A6ICRlZGdlO1xuXHRcdGJvdHRvbTogJGVkZ2U7XG5cdFx0cmlnaHQ6ICRlZGdlO1xuXHRcdGxlZnQ6IGF1dG87XG5cdFx0d2lkdGg6ICRzaXplO1xuXHRcdGhlaWdodDogYXV0bztcblx0fVxufVxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvdmFyaWFibGVzXCI7XG5AdXNlIFwiQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9taXhpbnNcIjtcblxuLmJvb3QtbmF2aWdhdGlvbi1pdGVtLmNvbXBvbmVudHMtaXRlbSB7XG5cdGNvbG9yOiB2YXIoLS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLW5ldXRyYWwsICMxZTFlMWUpO1xuXHRwYWRkaW5nLWlubGluZTogdmFyaWFibGVzLiRncmlkLXVuaXQtMDU7XG5cdHBhZGRpbmctYmxvY2s6IDA7XG5cdG1hcmdpbi1pbmxpbmU6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTE1O1xuXHRtYXJnaW4tYmxvY2stZW5kOiB2YXJpYWJsZXMuJGdyaWQtdW5pdC0wNTtcblx0d2lkdGg6IGNhbGMoMTAwJSAtIHZhcmlhYmxlcy4kZ3JpZC11bml0LTE1ICogMik7XG5cdGJvcmRlcjogbm9uZTtcblx0bWluLWhlaWdodDogdmFyaWFibGVzLiRncmlkLXVuaXQtNDA7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdEBpbmNsdWRlIG1peGlucy5ib2R5LW1lZGl1bSgpO1xuXG5cdC5ib290LWRyb3Bkb3duLWl0ZW1fX2NoaWxkcmVuICYge1xuXHRcdG1pbi1oZWlnaHQ6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTMwO1xuXHR9XG5cblx0Ly8gUm91bmRlZCBmb2N1cyByaW5nXG5cdGJvcmRlci1yYWRpdXM6IHZhcigtLXdwZHMtYm9yZGVyLXJhZGl1cy1zbWFsbCwgMnB4KTtcblxuXHQmLmFjdGl2ZSxcblx0Jjpob3Zlcixcblx0Jjpmb2N1cyxcblx0JlthcmlhLWN1cnJlbnQ9XCJ0cnVlXCJdIHtcblx0XHRjb2xvcjogdmFyKC0td3Bkcy1jb2xvci1mZy1pbnRlcmFjdGl2ZS1icmFuZC1hY3RpdmUsICMwMDczYWEpO1xuXHR9XG5cblx0Ji5hY3RpdmUge1xuXHRcdGZvbnQtd2VpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtd2VpZ2h0LW1lZGl1bTtcblx0fVxuXG5cdHN2ZzpsYXN0LWNoaWxkIHtcblx0XHRwYWRkaW5nOiB2YXJpYWJsZXMuJGdyaWQtdW5pdC0wNTtcblx0fVxuXG5cdCZbYXJpYS1jdXJyZW50PVwidHJ1ZVwiXSB7XG5cdFx0Y29sb3I6IHZhcigtLXdwZHMtY29sb3ItZmctaW50ZXJhY3RpdmUtYnJhbmQtYWN0aXZlLCAjMDA3M2FhKTtcblx0XHRmb250LXdlaWdodDogdmFyaWFibGVzLiRmb250LXdlaWdodC1tZWRpdW07XG5cdH1cblxuXHQvLyBNYWtlIHN1cmUgdGhlIGZvY3VzIHN0eWxlIGlzIGRyYXduIG9uIHRvcCBvZiB0aGUgY3VycmVudCBpdGVtIGJhY2tncm91bmQuXG5cdCY6Zm9jdXMtdmlzaWJsZSB7XG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGVaKDApO1xuXHR9XG5cblx0Ji53aXRoLXN1ZmZpeCB7XG5cdFx0cGFkZGluZy1yaWdodDogdmFyaWFibGVzLiRncmlkLXVuaXQtMjA7XG5cdH1cbn1cbiJdfQ== */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css4 ) );
/**
 *
 * @param root0
 * @param root0.className
 * @param root0.icon
 * @param root0.shouldShowPlaceholder
 * @param root0.children
 * @param root0.to
 */
function NavigationItem( { className, icon, shouldShowPlaceholder = true, children, to } ) {
	const isExternal = ! String( new URL( to, window.location.origin ) ).startsWith(
		window.location.origin
	);
	const content = /* @__PURE__ */ ( 0, import_jsx_runtime18.jsxs )(
		import_components5.__experimentalHStack,
		{
			justify: 'flex-start',
			spacing: 2,
			style: { flexGrow: '1' },
			children: [
				wrapIcon( icon, shouldShowPlaceholder ),
				/* @__PURE__ */ ( 0, import_jsx_runtime18.jsx )( import_components5.FlexBlock, {
					children,
				} ),
			],
		}
	);
	if ( isExternal ) {
		return /* @__PURE__ */ ( 0, import_jsx_runtime18.jsx )( import_components5.__experimentalItem, {
			as: 'a',
			href: to,
			className: clsx_default( 'boot-navigation-item', className ),
			children: content,
		} );
	}
	return /* @__PURE__ */ ( 0, import_jsx_runtime18.jsx )( router_link_item_default, {
		to,
		className: clsx_default( 'boot-navigation-item', className ),
		children: content,
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/drilldown-item/index.js
const import_components6 = __toESM( require_components() );
const import_i18n3 = __toESM( require_i18n() );
const import_jsx_runtime19 = __toESM( require_jsx_runtime() );
/**
 *
 * @param root0
 * @param root0.className
 * @param root0.id
 * @param root0.icon
 * @param root0.shouldShowPlaceholder
 * @param root0.children
 * @param root0.onNavigate
 */
function DrilldownItem( {
	className,
	id,
	icon,
	shouldShowPlaceholder = true,
	children,
	onNavigate,
} ) {
	const handleClick = e => {
		e.preventDefault();
		onNavigate( { id, direction: 'forward' } );
	};
	return /* @__PURE__ */ ( 0, import_jsx_runtime19.jsx )( import_components6.__experimentalItem, {
		className: clsx_default( 'boot-navigation-item', className ),
		onClick: handleClick,
		children: /* @__PURE__ */ ( 0, import_jsx_runtime19.jsxs )(
			import_components6.__experimentalHStack,
			{
				justify: 'flex-start',
				spacing: 2,
				style: { flexGrow: '1' },
				children: [
					wrapIcon( icon, shouldShowPlaceholder ),
					/* @__PURE__ */ ( 0, import_jsx_runtime19.jsx )( import_components6.FlexBlock, {
						children,
					} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime19.jsx )( import_components6.Icon, {
						icon: ( 0, import_i18n3.isRTL )()
							? chevron_left_small_default
							: chevron_right_small_default,
					} ),
				],
			}
		),
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/dropdown-item/index.js
const import_components7 = __toESM( require_components() );
const import_compose = __toESM( require_compose() );
const import_data4 = __toESM( require_data() );
const import_jsx_runtime20 = __toESM( require_jsx_runtime() );
const css5 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-dropdown-item__children {
  display: flex;
  flex-direction: column;
  padding: 2px;
  margin-block-start: -2px;
  margin-block-end: 2px;
  margin-inline-start: 30px;
  overflow: hidden;
}

.boot-dropdown-item__chevron.is-up {
  transform: rotate(180deg);
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvbmF2aWdhdGlvbi9kcm9wZG93bi1pdGVtIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fdmFyaWFibGVzLnNjc3MiLCIuLi8uLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fY29sb3JzLnNjc3MiLCJzdHlsZS5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FDQUE7QUFBQTtBQUFBO0FEVUE7QUFBQTtBQUFBO0FBT0E7QUFBQTtBQUFBO0FBNkJBO0FBQUE7QUFBQTtBQUFBO0FBaUJBO0FBQUE7QUFBQTtBQVdBO0FBQUE7QUFBQTtBQWdCQTtBQUFBO0FBQUE7QUF5QkE7QUFBQTtBQUFBO0FBS0E7QUFBQTtBQUFBO0FBZUE7QUFBQTtBQUFBO0FBbUJBO0FBQUE7QUFBQTtBQVNBO0FBQUE7QUFBQTtBQUFBO0FFaktBO0VBQ0M7RUFDQTtFQU9BLFNBRHNDO0VBRXRDO0VBQ0Esa0JBSHNDO0VBSXRDLHFCQUNDO0VBRUQ7OztBQUdEO0VBQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNDU1MgVmFyaWFibGVzLlxuICpcbiAqIFBsZWFzZSB1c2UgdmFyaWFibGVzIGZyb20gdGhpcyBzaGVldCB0byBlbnN1cmUgY29uc2lzdGVuY3kgYWNyb3NzIHRoZSBVSS5cbiAqIERvbid0IGFkZCB0byB0aGlzIHNoZWV0IHVubGVzcyB5b3UncmUgcHJldHR5IHN1cmUgdGhlIHZhbHVlIHdpbGwgYmUgcmV1c2VkIGluIG1hbnkgcGxhY2VzLlxuICogRm9yIGV4YW1wbGUsIGRvbid0IGFkZCBydWxlcyB0byB0aGlzIHNoZWV0IHRoYXQgYWZmZWN0IGJsb2NrIHZpc3VhbHMuIEl0J3MgcHVyZWx5IGZvciBVSS5cbiAqL1xuXG5AdXNlIFwiLi9jb2xvcnNcIjtcblxuLyoqXG4gKiBGb250cyAmIGJhc2ljIHZhcmlhYmxlcy5cbiAqL1xuXG4kZGVmYXVsdC1mb250OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCxcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkZmFtaWx5IHZhcmlhYmxlc1xuJGRlZmF1bHQtbGluZS1oZWlnaHQ6IDEuNDsgLy8gVG9kbzogZGVwcmVjYXRlIGluIGZhdm9yIG9mICRsaW5lLWhlaWdodCB0b2tlbnNcblxuLyoqXG4gKiBUeXBvZ3JhcGh5XG4gKi9cblxuLy8gU2l6ZXNcbiRmb250LXNpemUteC1zbWFsbDogMTFweDtcbiRmb250LXNpemUtc21hbGw6IDEycHg7XG4kZm9udC1zaXplLW1lZGl1bTogMTNweDtcbiRmb250LXNpemUtbGFyZ2U6IDE1cHg7XG4kZm9udC1zaXplLXgtbGFyZ2U6IDIwcHg7XG4kZm9udC1zaXplLTJ4LWxhcmdlOiAzMnB4O1xuXG4vLyBMaW5lIGhlaWdodHNcbiRmb250LWxpbmUtaGVpZ2h0LXgtc21hbGw6IDE2cHg7XG4kZm9udC1saW5lLWhlaWdodC1zbWFsbDogMjBweDtcbiRmb250LWxpbmUtaGVpZ2h0LW1lZGl1bTogMjRweDtcbiRmb250LWxpbmUtaGVpZ2h0LWxhcmdlOiAyOHB4O1xuJGZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTogMzJweDtcbiRmb250LWxpbmUtaGVpZ2h0LTJ4LWxhcmdlOiA0MHB4O1xuXG4vLyBXZWlnaHRzXG4kZm9udC13ZWlnaHQtcmVndWxhcjogNDAwO1xuJGZvbnQtd2VpZ2h0LW1lZGl1bTogNDk5OyAvLyBlbnN1cmVzIGZhbGxiYWNrIHRvIDQwMCAoaW5zdGVhZCBvZiA2MDApXG5cbi8vIEZhbWlsaWVzXG4kZm9udC1mYW1pbHktaGVhZGluZ3M6IC1hcHBsZS1zeXN0ZW0sIFwic3lzdGVtLXVpXCIsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiRmb250LWZhbWlseS1ib2R5OiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktbW9ubzogTWVubG8sIENvbnNvbGFzLCBtb25hY28sIG1vbm9zcGFjZTtcblxuLyoqXG4gKiBHcmlkIFN5c3RlbS5cbiAqIGh0dHBzOi8vbWFrZS53b3JkcHJlc3Mub3JnL2Rlc2lnbi8yMDE5LzEwLzMxL3Byb3Bvc2FsLWEtY29uc2lzdGVudC1zcGFjaW5nLXN5c3RlbS1mb3Itd29yZHByZXNzL1xuICovXG5cbiRncmlkLXVuaXQ6IDhweDtcbiRncmlkLXVuaXQtMDU6IDAuNSAqICRncmlkLXVuaXQ7XHQvLyA0cHhcbiRncmlkLXVuaXQtMTA6IDEgKiAkZ3JpZC11bml0O1x0XHQvLyA4cHhcbiRncmlkLXVuaXQtMTU6IDEuNSAqICRncmlkLXVuaXQ7XHQvLyAxMnB4XG4kZ3JpZC11bml0LTIwOiAyICogJGdyaWQtdW5pdDtcdFx0Ly8gMTZweFxuJGdyaWQtdW5pdC0zMDogMyAqICRncmlkLXVuaXQ7XHRcdC8vIDI0cHhcbiRncmlkLXVuaXQtNDA6IDQgKiAkZ3JpZC11bml0O1x0XHQvLyAzMnB4XG4kZ3JpZC11bml0LTUwOiA1ICogJGdyaWQtdW5pdDtcdFx0Ly8gNDBweFxuJGdyaWQtdW5pdC02MDogNiAqICRncmlkLXVuaXQ7XHRcdC8vIDQ4cHhcbiRncmlkLXVuaXQtNzA6IDcgKiAkZ3JpZC11bml0O1x0XHQvLyA1NnB4XG4kZ3JpZC11bml0LTgwOiA4ICogJGdyaWQtdW5pdDtcdFx0Ly8gNjRweFxuXG4vKipcbiAqIFJhZGl1cyBzY2FsZS5cbiAqL1xuXG4kcmFkaXVzLXgtc21hbGw6IDFweDsgICAvLyBBcHBsaWVkIHRvIGVsZW1lbnRzIGxpa2UgYnV0dG9ucyBuZXN0ZWQgd2l0aGluIHByaW1pdGl2ZXMgbGlrZSBpbnB1dHMuXG4kcmFkaXVzLXNtYWxsOiAycHg7ICAgICAvLyBBcHBsaWVkIHRvIG1vc3QgcHJpbWl0aXZlcy5cbiRyYWRpdXMtbWVkaXVtOiA0cHg7ICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIHNtYWxsZXIgcGFkZGluZy5cbiRyYWRpdXMtbGFyZ2U6IDhweDsgICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIGxhcmdlciBwYWRkaW5nLlxuJHJhZGl1cy1mdWxsOiA5OTk5cHg7ICAgLy8gRm9yIHBpbGxzLlxuJHJhZGl1cy1yb3VuZDogNTAlOyAgICAgLy8gRm9yIGNpcmNsZXMgYW5kIG92YWxzLlxuXG4vKipcbiAqIEVsZXZhdGlvbiBzY2FsZS5cbiAqL1xuXG4vLyBGb3Igc2VjdGlvbnMgYW5kIGNvbnRhaW5lcnMgdGhhdCBncm91cCByZWxhdGVkIGNvbnRlbnQgYW5kIGNvbnRyb2xzLCB3aGljaCBtYXkgb3ZlcmxhcCBvdGhlciBjb250ZW50LiBFeGFtcGxlOiBQcmV2aWV3IEZyYW1lLlxuJGVsZXZhdGlvbi14LXNtYWxsOiAwIDFweCAxcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMiksIDAgM3B4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDRweCA0cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAxKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBwcm92aWRlIGNvbnRleHR1YWwgZmVlZGJhY2sgd2l0aG91dCBiZWluZyBpbnRydXNpdmUuIEdlbmVyYWxseSBub24taW50ZXJydXB0aXZlLiBFeGFtcGxlOiBUb29sdGlwcywgU25hY2tiYXIuXG4kZWxldmF0aW9uLXNtYWxsOiAwIDFweCAycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNnB4IDZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDhweCA4cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBvZmZlciBhZGRpdGlvbmFsIGFjdGlvbnMuIEV4YW1wbGU6IE1lbnVzLCBDb21tYW5kIFBhbGV0dGVcbiRlbGV2YXRpb24tbWVkaXVtOiAwIDJweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCA0cHggNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgMTJweCAxMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMTZweCAxNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgY29uZmlybSBkZWNpc2lvbnMgb3IgaGFuZGxlIG5lY2Vzc2FyeSBpbnRlcnJ1cHRpb25zLiBFeGFtcGxlOiBNb2RhbHMuXG4kZWxldmF0aW9uLWxhcmdlOiAwIDVweCAxNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wOCksIDAgMTVweCAyN3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNyksIDAgMzBweCAzNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNTBweCA0M3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8qKlxuICogRGltZW5zaW9ucy5cbiAqL1xuXG4kaWNvbi1zaXplOiAyNHB4O1xuJGJ1dHRvbi1zaXplOiAzNnB4O1xuJGJ1dHRvbi1zaXplLW5leHQtZGVmYXVsdC00MHB4OiA0MHB4OyAvLyB0cmFuc2l0aW9uYXJ5IHZhcmlhYmxlIGZvciBuZXh0IGRlZmF1bHQgYnV0dG9uIHNpemVcbiRidXR0b24tc2l6ZS1zbWFsbDogMjRweDtcbiRidXR0b24tc2l6ZS1jb21wYWN0OiAzMnB4O1xuJGhlYWRlci1oZWlnaHQ6IDY0cHg7XG4kcGFuZWwtaGVhZGVyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRuYXYtc2lkZWJhci13aWR0aDogMzAwcHg7XG4kYWRtaW4tYmFyLWhlaWdodDogMzJweDtcbiRhZG1pbi1iYXItaGVpZ2h0LWJpZzogNDZweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoOiAxNjBweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoLWJpZzogMTkwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1jb2xsYXBzZWQ6IDM2cHg7XG4kbW9kYWwtbWluLXdpZHRoOiAzNTBweDtcbiRtb2RhbC13aWR0aC1zbWFsbDogMzg0cHg7XG4kbW9kYWwtd2lkdGgtbWVkaXVtOiA1MTJweDtcbiRtb2RhbC13aWR0aC1sYXJnZTogODQwcHg7XG4kc3Bpbm5lci1zaXplOiAxNnB4O1xuJGNhbnZhcy1wYWRkaW5nOiAkZ3JpZC11bml0LTIwO1xuJHBhbGV0dGUtbWF4LWhlaWdodDogMzY4cHg7XG5cbi8qKlxuICogTW9iaWxlIHNwZWNpZmljIHN0eWxlc1xuICovXG4kbW9iaWxlLXRleHQtbWluLWZvbnQtc2l6ZTogMTZweDsgLy8gQW55IGZvbnQgc2l6ZSBiZWxvdyAxNnB4IHdpbGwgY2F1c2UgTW9iaWxlIFNhZmFyaSB0byBcInpvb20gaW5cIi5cblxuLyoqXG4gKiBFZGl0b3Igc3R5bGVzLlxuICovXG5cbiRzaWRlYmFyLXdpZHRoOiAyODBweDtcbiRjb250ZW50LXdpZHRoOiA4NDBweDtcbiR3aWRlLWNvbnRlbnQtd2lkdGg6IDExMDBweDtcbiR3aWRnZXQtYXJlYS13aWR0aDogNzAwcHg7XG4kc2Vjb25kYXJ5LXNpZGViYXItd2lkdGg6IDM1MHB4O1xuJGVkaXRvci1mb250LXNpemU6IDE2cHg7XG4kZGVmYXVsdC1ibG9jay1tYXJnaW46IDI4cHg7IC8vIFRoaXMgdmFsdWUgcHJvdmlkZXMgYSBjb25zaXN0ZW50LCBjb250aWd1b3VzIHNwYWNpbmcgYmV0d2VlbiBibG9ja3MuXG4kdGV4dC1lZGl0b3ItZm9udC1zaXplOiAxNXB4O1xuJGVkaXRvci1saW5lLWhlaWdodDogMS44O1xuJGVkaXRvci1odG1sLWZvbnQ6ICRmb250LWZhbWlseS1tb25vO1xuXG4vKipcbiAqIEJsb2NrICYgRWRpdG9yIFVJLlxuICovXG5cbiRibG9jay10b29sYmFyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRib3JkZXItd2lkdGg6IDFweDtcbiRib3JkZXItd2lkdGgtZm9jdXMtZmFsbGJhY2s6IDJweDsgLy8gVGhpcyBleGlzdHMgYXMgYSBmYWxsYmFjaywgYW5kIGlzIGlkZWFsbHkgb3ZlcnJpZGRlbiBieSB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpIHVubGVzcyBpbiBzb21lIFNBU1MgbWF0aCBjYXNlcy5cbiRib3JkZXItd2lkdGgtdGFiOiAxLjVweDtcbiRoZWxwdGV4dC1mb250LXNpemU6IDEycHg7XG4kcmFkaW8taW5wdXQtc2l6ZTogMTZweDtcbiRyYWRpby1pbnB1dC1zaXplLXNtOiAyNHB4OyAvLyBXaWR0aCAmIGhlaWdodCBmb3Igc21hbGwgdmlld3BvcnRzLlxuXG4vLyBEZXByZWNhdGVkLCBwbGVhc2UgYXZvaWQgdXNpbmcgdGhlc2UuXG4kYmxvY2stcGFkZGluZzogMTRweDsgLy8gVXNlZCB0byBkZWZpbmUgc3BhY2UgYmV0d2VlbiBibG9jayBmb290cHJpbnQgYW5kIHN1cnJvdW5kaW5nIGJvcmRlcnMuXG4kcmFkaXVzLWJsb2NrLXVpOiAkcmFkaXVzLXNtYWxsO1xuJHNoYWRvdy1wb3BvdmVyOiAkZWxldmF0aW9uLXgtc21hbGw7XG4kc2hhZG93LW1vZGFsOiAkZWxldmF0aW9uLWxhcmdlO1xuJGRlZmF1bHQtZm9udC1zaXplOiAkZm9udC1zaXplLW1lZGl1bTtcblxuLyoqXG4gKiBCbG9jayBwYWRkaW5ncy5cbiAqL1xuXG4vLyBQYWRkaW5nIGZvciBibG9ja3Mgd2l0aCBhIGJhY2tncm91bmQgY29sb3IgKGUuZy4gcGFyYWdyYXBoIG9yIGdyb3VwKS5cbiRibG9jay1iZy1wYWRkaW5nLS12OiAxLjI1ZW07XG4kYmxvY2stYmctcGFkZGluZy0taDogMi4zNzVlbTtcblxuXG4vKipcbiAqIFJlYWN0IE5hdGl2ZSBzcGVjaWZpYy5cbiAqIFRoZXNlIHZhcmlhYmxlcyBkbyBub3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUgZWxzZS5cbiAqL1xuXG4vLyBEaW1lbnNpb25zLlxuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWhlYWRlci10b29sYmFyLWV4cGFuZGVkLWhlaWdodDogNTJweDtcbiRtb2JpbGUtZmxvYXRpbmctdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItbWFyZ2luOiA4cHg7XG4kbW9iaWxlLWNvbG9yLXN3YXRjaDogNDhweDtcblxuLy8gQmxvY2sgVUkuXG4kbW9iaWxlLWJsb2NrLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJGRpbW1lZC1vcGFjaXR5OiAxO1xuJGJsb2NrLWVkZ2UtdG8tY29udGVudDogMTZweDtcbiRzb2xpZC1ib3JkZXItc3BhY2U6IDEycHg7XG4kZGFzaGVkLWJvcmRlci1zcGFjZTogNnB4O1xuJGJsb2NrLXNlbGVjdGVkLW1hcmdpbjogM3B4O1xuJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDogMXB4O1xuJGJsb2NrLXNlbGVjdGVkLXBhZGRpbmc6IDA7XG4kYmxvY2stc2VsZWN0ZWQtY2hpbGQtbWFyZ2luOiA1cHg7XG4kYmxvY2stc2VsZWN0ZWQtdG8tY29udGVudDogJGJsb2NrLWVkZ2UtdG8tY29udGVudCAtICRibG9jay1zZWxlY3RlZC1tYXJnaW4gLSAkYmxvY2stc2VsZWN0ZWQtYm9yZGVyLXdpZHRoO1xuIiwiLyoqXG4gKiBDb2xvcnNcbiAqL1xuXG4vLyBXb3JkUHJlc3MgZ3JheXMuXG4kYmxhY2s6ICMwMDA7XHRcdFx0Ly8gVXNlIG9ubHkgd2hlbiB5b3UgdHJ1bHkgbmVlZCBwdXJlIGJsYWNrLiBGb3IgVUksIHVzZSAkZ3JheS05MDAuXG4kZ3JheS05MDA6ICMxZTFlMWU7XG4kZ3JheS04MDA6ICMyZjJmMmY7XG4kZ3JheS03MDA6ICM3NTc1NzU7XHRcdC8vIE1lZXRzIDQuNjoxICg0LjU6MSBpcyBtaW5pbXVtKSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS02MDA6ICM5NDk0OTQ7XHRcdC8vIE1lZXRzIDM6MSBVSSBvciBsYXJnZSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS00MDA6ICNjY2M7XG4kZ3JheS0zMDA6ICNkZGQ7XHRcdC8vIFVzZWQgZm9yIG1vc3QgYm9yZGVycy5cbiRncmF5LTIwMDogI2UwZTBlMDtcdFx0Ly8gVXNlZCBzcGFyaW5nbHkgZm9yIGxpZ2h0IGJvcmRlcnMuXG4kZ3JheS0xMDA6ICNmMGYwZjA7XHRcdC8vIFVzZWQgZm9yIGxpZ2h0IGdyYXkgYmFja2dyb3VuZHMuXG4kd2hpdGU6ICNmZmY7XG5cbi8vIE9wYWNpdGllcyAmIGFkZGl0aW9uYWwgY29sb3JzLlxuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNjIpO1xuJG1lZGl1bS1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC41NSk7XG4kbGlnaHQtZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkd2hpdGUsIDAuNjUpO1xuXG4vLyBBbGVydCBjb2xvcnMuXG4kYWxlcnQteWVsbG93OiAjZjBiODQ5O1xuJGFsZXJ0LXJlZDogI2NjMTgxODtcbiRhbGVydC1ncmVlbjogIzRhYjg2NjtcblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGRhcmstdGhlbWUtZm9jdXM6ICR3aGl0ZTtcdC8vIEZvY3VzIGNvbG9yIHdoZW4gdGhlIHRoZW1lIGlzIGRhcmsuXG4iLCJAdXNlIFwiQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy92YXJpYWJsZXNcIjtcblxuLmJvb3QtZHJvcGRvd24taXRlbV9fY2hpbGRyZW4ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXG5cdC8vIEluIG9yZGVyIHRvIGF2b2lkIHRoZSBmb2N1cyByaW5nIG9mIGVhY2ggbGlzdCBpdGVtIGZyb20gYmVpbmcgY3V0IG9mZixcblx0Ly8gd2UgYWRkIHBhZGRpbmcgYXJvdW5kIHRoZSBtZW51IGl0ZW1zLlxuXHQvLyBBdCB0aGUgc2FtZSB0aW1lLCB3ZSB1c2UgdGhlIHNhbWUgdmFsdWUgdG8gdHdlYWsgbWFyZ2lucyBzbyB0aGF0XG5cdC8vIHRoZSBpdGVtcyBzdGlsbCByZXRhaW4gdGhlIHNhbWUgcG9zaXRpb24gYW5kIGZvb3RwcmludC5cblx0JHBhZGRpbmctdG8tYXZvaWQtY3V0dGluZy1mb2N1cy1yaW5nOiAycHg7XG5cdHBhZGRpbmc6ICRwYWRkaW5nLXRvLWF2b2lkLWN1dHRpbmctZm9jdXMtcmluZztcblx0bWFyZ2luLWJsb2NrLXN0YXJ0OiAtJHBhZGRpbmctdG8tYXZvaWQtY3V0dGluZy1mb2N1cy1yaW5nO1xuXHRtYXJnaW4tYmxvY2stZW5kOiAkcGFkZGluZy10by1hdm9pZC1jdXR0aW5nLWZvY3VzLXJpbmc7XG5cdG1hcmdpbi1pbmxpbmUtc3RhcnQ6XG5cdFx0dmFyaWFibGVzLiRncmlkLXVuaXQtNDAgLVxuXHRcdCRwYWRkaW5nLXRvLWF2b2lkLWN1dHRpbmctZm9jdXMtcmluZztcblx0b3ZlcmZsb3c6IGhpZGRlbjtcbn1cblxuLmJvb3QtZHJvcGRvd24taXRlbV9fY2hldnJvbi5pcy11cCB7XG5cdHRyYW5zZm9ybTogcm90YXRlKDE4MGRlZyk7XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css5 ) );
const ANIMATION_DURATION = 0.2;
/**
 *
 * @param root0
 * @param root0.className
 * @param root0.id
 * @param root0.icon
 * @param root0.children
 * @param root0.isExpanded
 * @param root0.onToggle
 */
function DropdownItem( { className, id, icon, children, isExpanded, onToggle } ) {
	const menuItems = ( 0, import_data4.useSelect )(
		select =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems(),
		[]
	);
	const items = menuItems.filter( item => item.parent === id );
	const disableMotion = ( 0, import_compose.useReducedMotion )();
	return /* @__PURE__ */ ( 0, import_jsx_runtime20.jsxs )( 'div', {
		className: 'boot-dropdown-item',
		children: [
			/* @__PURE__ */ ( 0, import_jsx_runtime20.jsx )( import_components7.__experimentalItem, {
				className: clsx_default( 'boot-navigation-item', className ),
				onClick: e => {
					e.preventDefault();
					e.stopPropagation();
					onToggle();
				},
				onMouseDown: e => e.preventDefault(),
				children: /* @__PURE__ */ ( 0, import_jsx_runtime20.jsxs )(
					import_components7.__experimentalHStack,
					{
						justify: 'flex-start',
						spacing: 2,
						style: { flexGrow: '1' },
						children: [
							wrapIcon( icon, false ),
							/* @__PURE__ */ ( 0, import_jsx_runtime20.jsx )( import_components7.FlexBlock, {
								children,
							} ),
							/* @__PURE__ */ ( 0, import_jsx_runtime20.jsx )( import_components7.Icon, {
								icon: chevron_down_small_default,
								className: clsx_default( 'boot-dropdown-item__chevron', {
									'is-up': isExpanded,
								} ),
							} ),
						],
					}
				),
			} ),
			/* @__PURE__ */ ( 0, import_jsx_runtime20.jsx )(
				import_components7.__unstableAnimatePresence,
				{
					initial: false,
					children:
						isExpanded &&
						/* @__PURE__ */ ( 0, import_jsx_runtime20.jsx )(
							import_components7.__unstableMotion.div,
							{
								initial: { height: 0 },
								animate: { height: 'auto' },
								exit: { height: 0 },
								transition: {
									type: 'tween',
									duration: disableMotion ? 0 : ANIMATION_DURATION,
									ease: 'easeOut',
								},
								className: 'boot-dropdown-item__children',
								children: items.map( ( item, index ) =>
									/* @__PURE__ */ ( 0, import_jsx_runtime20.jsx )(
										NavigationItem,
										{
											to: item.to,
											shouldShowPlaceholder: false,
											children: item.label,
										},
										index
									)
								),
							}
						),
				}
			),
		],
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/navigation-screen/index.js
const import_components8 = __toESM( require_components() );
const import_i18n4 = __toESM( require_i18n() );
const import_compose2 = __toESM( require_compose() );
const import_jsx_runtime21 = __toESM( require_jsx_runtime() );
const css6 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-navigation-screen {
  padding-block-end: 4px;
}

.boot-navigation-screen .components-text {
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
}

.boot-navigation-screen__title-icon {
  position: sticky;
  top: 0;
  padding: 12px 16px 8px 16px;
}

.boot-navigation-screen__title {
  flex-grow: 1;
  overflow-wrap: break-word;
}
.boot-navigation-screen__title.boot-navigation-screen__title, .boot-navigation-screen__title.boot-navigation-screen__title .boot-navigation-screen__title {
  line-height: 32px;
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
}

.boot-navigation-screen__actions {
  display: flex;
  flex-shrink: 0;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvbmF2aWdhdGlvbi9uYXZpZ2F0aW9uLXNjcmVlbiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX3ZhcmlhYmxlcy5zY3NzIiwiLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2NvbG9ycy5zY3NzIiwic3R5bGUuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBRFVBO0FBQUE7QUFBQTtBQU9BO0FBQUE7QUFBQTtBQTZCQTtBQUFBO0FBQUE7QUFBQTtBQWlCQTtBQUFBO0FBQUE7QUFXQTtBQUFBO0FBQUE7QUFnQkE7QUFBQTtBQUFBO0FBeUJBO0FBQUE7QUFBQTtBQUtBO0FBQUE7QUFBQTtBQWVBO0FBQUE7QUFBQTtBQW1CQTtBQUFBO0FBQUE7QUFTQTtBQUFBO0FBQUE7QUFBQTtBRWpLQTtFQUVDLG1CRmdEYzs7O0FFN0NmO0VBQ0M7OztBQUdEO0VBQ0M7RUFDQTtFQUNBLFNBQ0M7OztBQUlGO0VBQ0M7RUFDQTs7QUFFQTtFQUVDLGFGU3lCO0VFUnpCOzs7QUFJRjtFQUNDO0VBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNDU1MgVmFyaWFibGVzLlxuICpcbiAqIFBsZWFzZSB1c2UgdmFyaWFibGVzIGZyb20gdGhpcyBzaGVldCB0byBlbnN1cmUgY29uc2lzdGVuY3kgYWNyb3NzIHRoZSBVSS5cbiAqIERvbid0IGFkZCB0byB0aGlzIHNoZWV0IHVubGVzcyB5b3UncmUgcHJldHR5IHN1cmUgdGhlIHZhbHVlIHdpbGwgYmUgcmV1c2VkIGluIG1hbnkgcGxhY2VzLlxuICogRm9yIGV4YW1wbGUsIGRvbid0IGFkZCBydWxlcyB0byB0aGlzIHNoZWV0IHRoYXQgYWZmZWN0IGJsb2NrIHZpc3VhbHMuIEl0J3MgcHVyZWx5IGZvciBVSS5cbiAqL1xuXG5AdXNlIFwiLi9jb2xvcnNcIjtcblxuLyoqXG4gKiBGb250cyAmIGJhc2ljIHZhcmlhYmxlcy5cbiAqL1xuXG4kZGVmYXVsdC1mb250OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCxcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkZmFtaWx5IHZhcmlhYmxlc1xuJGRlZmF1bHQtbGluZS1oZWlnaHQ6IDEuNDsgLy8gVG9kbzogZGVwcmVjYXRlIGluIGZhdm9yIG9mICRsaW5lLWhlaWdodCB0b2tlbnNcblxuLyoqXG4gKiBUeXBvZ3JhcGh5XG4gKi9cblxuLy8gU2l6ZXNcbiRmb250LXNpemUteC1zbWFsbDogMTFweDtcbiRmb250LXNpemUtc21hbGw6IDEycHg7XG4kZm9udC1zaXplLW1lZGl1bTogMTNweDtcbiRmb250LXNpemUtbGFyZ2U6IDE1cHg7XG4kZm9udC1zaXplLXgtbGFyZ2U6IDIwcHg7XG4kZm9udC1zaXplLTJ4LWxhcmdlOiAzMnB4O1xuXG4vLyBMaW5lIGhlaWdodHNcbiRmb250LWxpbmUtaGVpZ2h0LXgtc21hbGw6IDE2cHg7XG4kZm9udC1saW5lLWhlaWdodC1zbWFsbDogMjBweDtcbiRmb250LWxpbmUtaGVpZ2h0LW1lZGl1bTogMjRweDtcbiRmb250LWxpbmUtaGVpZ2h0LWxhcmdlOiAyOHB4O1xuJGZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTogMzJweDtcbiRmb250LWxpbmUtaGVpZ2h0LTJ4LWxhcmdlOiA0MHB4O1xuXG4vLyBXZWlnaHRzXG4kZm9udC13ZWlnaHQtcmVndWxhcjogNDAwO1xuJGZvbnQtd2VpZ2h0LW1lZGl1bTogNDk5OyAvLyBlbnN1cmVzIGZhbGxiYWNrIHRvIDQwMCAoaW5zdGVhZCBvZiA2MDApXG5cbi8vIEZhbWlsaWVzXG4kZm9udC1mYW1pbHktaGVhZGluZ3M6IC1hcHBsZS1zeXN0ZW0sIFwic3lzdGVtLXVpXCIsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiRmb250LWZhbWlseS1ib2R5OiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktbW9ubzogTWVubG8sIENvbnNvbGFzLCBtb25hY28sIG1vbm9zcGFjZTtcblxuLyoqXG4gKiBHcmlkIFN5c3RlbS5cbiAqIGh0dHBzOi8vbWFrZS53b3JkcHJlc3Mub3JnL2Rlc2lnbi8yMDE5LzEwLzMxL3Byb3Bvc2FsLWEtY29uc2lzdGVudC1zcGFjaW5nLXN5c3RlbS1mb3Itd29yZHByZXNzL1xuICovXG5cbiRncmlkLXVuaXQ6IDhweDtcbiRncmlkLXVuaXQtMDU6IDAuNSAqICRncmlkLXVuaXQ7XHQvLyA0cHhcbiRncmlkLXVuaXQtMTA6IDEgKiAkZ3JpZC11bml0O1x0XHQvLyA4cHhcbiRncmlkLXVuaXQtMTU6IDEuNSAqICRncmlkLXVuaXQ7XHQvLyAxMnB4XG4kZ3JpZC11bml0LTIwOiAyICogJGdyaWQtdW5pdDtcdFx0Ly8gMTZweFxuJGdyaWQtdW5pdC0zMDogMyAqICRncmlkLXVuaXQ7XHRcdC8vIDI0cHhcbiRncmlkLXVuaXQtNDA6IDQgKiAkZ3JpZC11bml0O1x0XHQvLyAzMnB4XG4kZ3JpZC11bml0LTUwOiA1ICogJGdyaWQtdW5pdDtcdFx0Ly8gNDBweFxuJGdyaWQtdW5pdC02MDogNiAqICRncmlkLXVuaXQ7XHRcdC8vIDQ4cHhcbiRncmlkLXVuaXQtNzA6IDcgKiAkZ3JpZC11bml0O1x0XHQvLyA1NnB4XG4kZ3JpZC11bml0LTgwOiA4ICogJGdyaWQtdW5pdDtcdFx0Ly8gNjRweFxuXG4vKipcbiAqIFJhZGl1cyBzY2FsZS5cbiAqL1xuXG4kcmFkaXVzLXgtc21hbGw6IDFweDsgICAvLyBBcHBsaWVkIHRvIGVsZW1lbnRzIGxpa2UgYnV0dG9ucyBuZXN0ZWQgd2l0aGluIHByaW1pdGl2ZXMgbGlrZSBpbnB1dHMuXG4kcmFkaXVzLXNtYWxsOiAycHg7ICAgICAvLyBBcHBsaWVkIHRvIG1vc3QgcHJpbWl0aXZlcy5cbiRyYWRpdXMtbWVkaXVtOiA0cHg7ICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIHNtYWxsZXIgcGFkZGluZy5cbiRyYWRpdXMtbGFyZ2U6IDhweDsgICAgIC8vIEFwcGxpZWQgdG8gY29udGFpbmVycyB3aXRoIGxhcmdlciBwYWRkaW5nLlxuJHJhZGl1cy1mdWxsOiA5OTk5cHg7ICAgLy8gRm9yIHBpbGxzLlxuJHJhZGl1cy1yb3VuZDogNTAlOyAgICAgLy8gRm9yIGNpcmNsZXMgYW5kIG92YWxzLlxuXG4vKipcbiAqIEVsZXZhdGlvbiBzY2FsZS5cbiAqL1xuXG4vLyBGb3Igc2VjdGlvbnMgYW5kIGNvbnRhaW5lcnMgdGhhdCBncm91cCByZWxhdGVkIGNvbnRlbnQgYW5kIGNvbnRyb2xzLCB3aGljaCBtYXkgb3ZlcmxhcCBvdGhlciBjb250ZW50LiBFeGFtcGxlOiBQcmV2aWV3IEZyYW1lLlxuJGVsZXZhdGlvbi14LXNtYWxsOiAwIDFweCAxcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMiksIDAgM3B4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDRweCA0cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAxKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBwcm92aWRlIGNvbnRleHR1YWwgZmVlZGJhY2sgd2l0aG91dCBiZWluZyBpbnRydXNpdmUuIEdlbmVyYWxseSBub24taW50ZXJydXB0aXZlLiBFeGFtcGxlOiBUb29sdGlwcywgU25hY2tiYXIuXG4kZWxldmF0aW9uLXNtYWxsOiAwIDFweCAycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNnB4IDZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDhweCA4cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBvZmZlciBhZGRpdGlvbmFsIGFjdGlvbnMuIEV4YW1wbGU6IE1lbnVzLCBDb21tYW5kIFBhbGV0dGVcbiRlbGV2YXRpb24tbWVkaXVtOiAwIDJweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA1KSwgMCA0cHggNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgMTJweCAxMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMTZweCAxNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgY29uZmlybSBkZWNpc2lvbnMgb3IgaGFuZGxlIG5lY2Vzc2FyeSBpbnRlcnJ1cHRpb25zLiBFeGFtcGxlOiBNb2RhbHMuXG4kZWxldmF0aW9uLWxhcmdlOiAwIDVweCAxNXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wOCksIDAgMTVweCAyN3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNyksIDAgMzBweCAzNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNCksIDAgNTBweCA0M3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8qKlxuICogRGltZW5zaW9ucy5cbiAqL1xuXG4kaWNvbi1zaXplOiAyNHB4O1xuJGJ1dHRvbi1zaXplOiAzNnB4O1xuJGJ1dHRvbi1zaXplLW5leHQtZGVmYXVsdC00MHB4OiA0MHB4OyAvLyB0cmFuc2l0aW9uYXJ5IHZhcmlhYmxlIGZvciBuZXh0IGRlZmF1bHQgYnV0dG9uIHNpemVcbiRidXR0b24tc2l6ZS1zbWFsbDogMjRweDtcbiRidXR0b24tc2l6ZS1jb21wYWN0OiAzMnB4O1xuJGhlYWRlci1oZWlnaHQ6IDY0cHg7XG4kcGFuZWwtaGVhZGVyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRuYXYtc2lkZWJhci13aWR0aDogMzAwcHg7XG4kYWRtaW4tYmFyLWhlaWdodDogMzJweDtcbiRhZG1pbi1iYXItaGVpZ2h0LWJpZzogNDZweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoOiAxNjBweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoLWJpZzogMTkwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1jb2xsYXBzZWQ6IDM2cHg7XG4kbW9kYWwtbWluLXdpZHRoOiAzNTBweDtcbiRtb2RhbC13aWR0aC1zbWFsbDogMzg0cHg7XG4kbW9kYWwtd2lkdGgtbWVkaXVtOiA1MTJweDtcbiRtb2RhbC13aWR0aC1sYXJnZTogODQwcHg7XG4kc3Bpbm5lci1zaXplOiAxNnB4O1xuJGNhbnZhcy1wYWRkaW5nOiAkZ3JpZC11bml0LTIwO1xuJHBhbGV0dGUtbWF4LWhlaWdodDogMzY4cHg7XG5cbi8qKlxuICogTW9iaWxlIHNwZWNpZmljIHN0eWxlc1xuICovXG4kbW9iaWxlLXRleHQtbWluLWZvbnQtc2l6ZTogMTZweDsgLy8gQW55IGZvbnQgc2l6ZSBiZWxvdyAxNnB4IHdpbGwgY2F1c2UgTW9iaWxlIFNhZmFyaSB0byBcInpvb20gaW5cIi5cblxuLyoqXG4gKiBFZGl0b3Igc3R5bGVzLlxuICovXG5cbiRzaWRlYmFyLXdpZHRoOiAyODBweDtcbiRjb250ZW50LXdpZHRoOiA4NDBweDtcbiR3aWRlLWNvbnRlbnQtd2lkdGg6IDExMDBweDtcbiR3aWRnZXQtYXJlYS13aWR0aDogNzAwcHg7XG4kc2Vjb25kYXJ5LXNpZGViYXItd2lkdGg6IDM1MHB4O1xuJGVkaXRvci1mb250LXNpemU6IDE2cHg7XG4kZGVmYXVsdC1ibG9jay1tYXJnaW46IDI4cHg7IC8vIFRoaXMgdmFsdWUgcHJvdmlkZXMgYSBjb25zaXN0ZW50LCBjb250aWd1b3VzIHNwYWNpbmcgYmV0d2VlbiBibG9ja3MuXG4kdGV4dC1lZGl0b3ItZm9udC1zaXplOiAxNXB4O1xuJGVkaXRvci1saW5lLWhlaWdodDogMS44O1xuJGVkaXRvci1odG1sLWZvbnQ6ICRmb250LWZhbWlseS1tb25vO1xuXG4vKipcbiAqIEJsb2NrICYgRWRpdG9yIFVJLlxuICovXG5cbiRibG9jay10b29sYmFyLWhlaWdodDogJGdyaWQtdW5pdC02MDtcbiRib3JkZXItd2lkdGg6IDFweDtcbiRib3JkZXItd2lkdGgtZm9jdXMtZmFsbGJhY2s6IDJweDsgLy8gVGhpcyBleGlzdHMgYXMgYSBmYWxsYmFjaywgYW5kIGlzIGlkZWFsbHkgb3ZlcnJpZGRlbiBieSB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpIHVubGVzcyBpbiBzb21lIFNBU1MgbWF0aCBjYXNlcy5cbiRib3JkZXItd2lkdGgtdGFiOiAxLjVweDtcbiRoZWxwdGV4dC1mb250LXNpemU6IDEycHg7XG4kcmFkaW8taW5wdXQtc2l6ZTogMTZweDtcbiRyYWRpby1pbnB1dC1zaXplLXNtOiAyNHB4OyAvLyBXaWR0aCAmIGhlaWdodCBmb3Igc21hbGwgdmlld3BvcnRzLlxuXG4vLyBEZXByZWNhdGVkLCBwbGVhc2UgYXZvaWQgdXNpbmcgdGhlc2UuXG4kYmxvY2stcGFkZGluZzogMTRweDsgLy8gVXNlZCB0byBkZWZpbmUgc3BhY2UgYmV0d2VlbiBibG9jayBmb290cHJpbnQgYW5kIHN1cnJvdW5kaW5nIGJvcmRlcnMuXG4kcmFkaXVzLWJsb2NrLXVpOiAkcmFkaXVzLXNtYWxsO1xuJHNoYWRvdy1wb3BvdmVyOiAkZWxldmF0aW9uLXgtc21hbGw7XG4kc2hhZG93LW1vZGFsOiAkZWxldmF0aW9uLWxhcmdlO1xuJGRlZmF1bHQtZm9udC1zaXplOiAkZm9udC1zaXplLW1lZGl1bTtcblxuLyoqXG4gKiBCbG9jayBwYWRkaW5ncy5cbiAqL1xuXG4vLyBQYWRkaW5nIGZvciBibG9ja3Mgd2l0aCBhIGJhY2tncm91bmQgY29sb3IgKGUuZy4gcGFyYWdyYXBoIG9yIGdyb3VwKS5cbiRibG9jay1iZy1wYWRkaW5nLS12OiAxLjI1ZW07XG4kYmxvY2stYmctcGFkZGluZy0taDogMi4zNzVlbTtcblxuXG4vKipcbiAqIFJlYWN0IE5hdGl2ZSBzcGVjaWZpYy5cbiAqIFRoZXNlIHZhcmlhYmxlcyBkbyBub3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUgZWxzZS5cbiAqL1xuXG4vLyBEaW1lbnNpb25zLlxuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWhlYWRlci10b29sYmFyLWV4cGFuZGVkLWhlaWdodDogNTJweDtcbiRtb2JpbGUtZmxvYXRpbmctdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItbWFyZ2luOiA4cHg7XG4kbW9iaWxlLWNvbG9yLXN3YXRjaDogNDhweDtcblxuLy8gQmxvY2sgVUkuXG4kbW9iaWxlLWJsb2NrLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJGRpbW1lZC1vcGFjaXR5OiAxO1xuJGJsb2NrLWVkZ2UtdG8tY29udGVudDogMTZweDtcbiRzb2xpZC1ib3JkZXItc3BhY2U6IDEycHg7XG4kZGFzaGVkLWJvcmRlci1zcGFjZTogNnB4O1xuJGJsb2NrLXNlbGVjdGVkLW1hcmdpbjogM3B4O1xuJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDogMXB4O1xuJGJsb2NrLXNlbGVjdGVkLXBhZGRpbmc6IDA7XG4kYmxvY2stc2VsZWN0ZWQtY2hpbGQtbWFyZ2luOiA1cHg7XG4kYmxvY2stc2VsZWN0ZWQtdG8tY29udGVudDogJGJsb2NrLWVkZ2UtdG8tY29udGVudCAtICRibG9jay1zZWxlY3RlZC1tYXJnaW4gLSAkYmxvY2stc2VsZWN0ZWQtYm9yZGVyLXdpZHRoO1xuIiwiLyoqXG4gKiBDb2xvcnNcbiAqL1xuXG4vLyBXb3JkUHJlc3MgZ3JheXMuXG4kYmxhY2s6ICMwMDA7XHRcdFx0Ly8gVXNlIG9ubHkgd2hlbiB5b3UgdHJ1bHkgbmVlZCBwdXJlIGJsYWNrLiBGb3IgVUksIHVzZSAkZ3JheS05MDAuXG4kZ3JheS05MDA6ICMxZTFlMWU7XG4kZ3JheS04MDA6ICMyZjJmMmY7XG4kZ3JheS03MDA6ICM3NTc1NzU7XHRcdC8vIE1lZXRzIDQuNjoxICg0LjU6MSBpcyBtaW5pbXVtKSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS02MDA6ICM5NDk0OTQ7XHRcdC8vIE1lZXRzIDM6MSBVSSBvciBsYXJnZSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS00MDA6ICNjY2M7XG4kZ3JheS0zMDA6ICNkZGQ7XHRcdC8vIFVzZWQgZm9yIG1vc3QgYm9yZGVycy5cbiRncmF5LTIwMDogI2UwZTBlMDtcdFx0Ly8gVXNlZCBzcGFyaW5nbHkgZm9yIGxpZ2h0IGJvcmRlcnMuXG4kZ3JheS0xMDA6ICNmMGYwZjA7XHRcdC8vIFVzZWQgZm9yIGxpZ2h0IGdyYXkgYmFja2dyb3VuZHMuXG4kd2hpdGU6ICNmZmY7XG5cbi8vIE9wYWNpdGllcyAmIGFkZGl0aW9uYWwgY29sb3JzLlxuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNjIpO1xuJG1lZGl1bS1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC41NSk7XG4kbGlnaHQtZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkd2hpdGUsIDAuNjUpO1xuXG4vLyBBbGVydCBjb2xvcnMuXG4kYWxlcnQteWVsbG93OiAjZjBiODQ5O1xuJGFsZXJ0LXJlZDogI2NjMTgxODtcbiRhbGVydC1ncmVlbjogIzRhYjg2NjtcblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGRhcmstdGhlbWUtZm9jdXM6ICR3aGl0ZTtcdC8vIEZvY3VzIGNvbG9yIHdoZW4gdGhlIHRoZW1lIGlzIGRhcmsuXG4iLCJAdXNlIFwiQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy92YXJpYWJsZXNcIjtcblxuLmJvb3QtbmF2aWdhdGlvbi1zY3JlZW4ge1xuXHQvLyBBdm9pZCBjdXR0aW5nIG9mZiBmb2N1cyByaW5nIG9mIHRoZSBsYXN0IG1lbnUgaXRlbVxuXHRwYWRkaW5nLWJsb2NrLWVuZDogdmFyaWFibGVzLiRncmlkLXVuaXQtMDU7XG59XG5cbi5ib290LW5hdmlnYXRpb24tc2NyZWVuIC5jb21wb25lbnRzLXRleHQge1xuXHRjb2xvcjogdmFyKC0td3Bkcy1jb2xvci1mZy1jb250ZW50LW5ldXRyYWwsICMxZTFlMWUpO1xufVxuXG4uYm9vdC1uYXZpZ2F0aW9uLXNjcmVlbl9fdGl0bGUtaWNvbiB7XG5cdHBvc2l0aW9uOiBzdGlja3k7XG5cdHRvcDogMDtcblx0cGFkZGluZzpcblx0XHR2YXJpYWJsZXMuJGdyaWQtdW5pdC0xNSB2YXJpYWJsZXMuJGdyaWQtdW5pdC0yMFxuXHRcdHZhcmlhYmxlcy4kZ3JpZC11bml0LTEwIHZhcmlhYmxlcy4kZ3JpZC11bml0LTIwO1xufVxuXG4uYm9vdC1uYXZpZ2F0aW9uLXNjcmVlbl9fdGl0bGUge1xuXHRmbGV4LWdyb3c6IDE7XG5cdG92ZXJmbG93LXdyYXA6IGJyZWFrLXdvcmQ7XG5cblx0JiN7Jn0sXG5cdCYjeyZ9IC5ib290LW5hdmlnYXRpb24tc2NyZWVuX190aXRsZSB7XG5cdFx0bGluZS1oZWlnaHQ6IHZhcmlhYmxlcy4kZm9udC1saW5lLWhlaWdodC14LWxhcmdlO1xuXHRcdGNvbG9yOiB2YXIoLS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtbmV1dHJhbCwgIzFlMWUxZSk7XG5cdH1cbn1cblxuLmJvb3QtbmF2aWdhdGlvbi1zY3JlZW5fX2FjdGlvbnMge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LXNocmluazogMDtcbn1cbiJdfQ== */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css6 ) );
const ANIMATION_DURATION2 = 0.3;
const slideVariants = {
	initial: direction => ( {
		x: direction === 'forward' ? 100 : -100,
		opacity: 0,
	} ),
	animate: {
		x: 0,
		opacity: 1,
	},
	exit: direction => ( {
		x: direction === 'forward' ? 100 : -100,
		opacity: 0,
	} ),
};
/**
 *
 * @param root0
 * @param root0.isRoot
 * @param root0.title
 * @param root0.actions
 * @param root0.content
 * @param root0.description
 * @param root0.animationDirection
 * @param root0.backMenuItem
 * @param root0.backButtonRef
 * @param root0.navigationKey
 * @param root0.onNavigate
 */
function NavigationScreen( {
	isRoot,
	title,
	actions,
	content,
	description,
	animationDirection,
	backMenuItem,
	backButtonRef,
	navigationKey,
	onNavigate,
} ) {
	const icon = ( 0, import_i18n4.isRTL )() ? chevron_right_default : chevron_left_default;
	const disableMotion = ( 0, import_compose2.useReducedMotion )();
	const handleBackClick = e => {
		e.preventDefault();
		onNavigate( { id: backMenuItem, direction: 'backward' } );
	};
	return /* @__PURE__ */ ( 0, import_jsx_runtime21.jsx )( 'div', {
		className: 'boot-navigation-screen',
		style: {
			overflow: 'hidden',
			position: 'relative',
			display: 'grid',
			gridTemplateColumns: '1fr',
			gridTemplateRows: '1fr',
		},
		children: /* @__PURE__ */ ( 0, import_jsx_runtime21.jsx )(
			import_components8.__unstableAnimatePresence,
			{
				initial: false,
				children: /* @__PURE__ */ ( 0, import_jsx_runtime21.jsxs )(
					import_components8.__unstableMotion.div,
					{
						custom: animationDirection,
						variants: slideVariants,
						initial: 'initial',
						animate: 'animate',
						exit: 'exit',
						transition: {
							type: 'tween',
							duration: disableMotion ? 0 : ANIMATION_DURATION2,
							ease: [ 0.33, 0, 0, 1 ],
						},
						style: {
							width: '100%',
							gridColumn: '1',
							gridRow: '1',
						},
						children: [
							/* @__PURE__ */ ( 0, import_jsx_runtime21.jsxs )(
								import_components8.__experimentalHStack,
								{
									spacing: 2,
									className: 'boot-navigation-screen__title-icon',
									children: [
										! isRoot &&
											/* @__PURE__ */ ( 0, import_jsx_runtime21.jsx )( import_components8.Button, {
												ref: backButtonRef,
												icon,
												onClick: handleBackClick,
												label: ( 0, import_i18n4.__ )( 'Back' ),
												size: 'small',
												variant: 'tertiary',
											} ),
										/* @__PURE__ */ ( 0, import_jsx_runtime21.jsx )(
											import_components8.__experimentalHeading,
											{
												className: 'boot-navigation-screen__title',
												level: 1,
												size: '15px',
												children: title,
											}
										),
										actions &&
											/* @__PURE__ */ ( 0, import_jsx_runtime21.jsx )( 'div', {
												className: 'boot-navigation-screen__actions',
												children: actions,
											} ),
									],
								}
							),
							description &&
								/* @__PURE__ */ ( 0, import_jsx_runtime21.jsx )( 'div', {
									className: 'boot-navigation-screen__description',
									children: description,
								} ),
							content,
						],
					},
					navigationKey
				),
			}
		),
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/use-sidebar-parent.js
const import_element5 = __toESM( require_element() );
const import_data5 = __toESM( require_data() );
import { privateApis as routePrivateApis3 } from '@wordpress/route';

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/path-matching.js
const isValidParentPath = ( currentPath, menuPath ) => {
	if ( ! menuPath || menuPath === currentPath ) {
		return false;
	}
	const normalizePath = path => {
		const normalized = path.startsWith( '/' ) ? path : '/' + path;
		return normalized.endsWith( '/' ) && normalized.length > 1
			? normalized.slice( 0, -1 )
			: normalized;
	};
	const normalizedCurrent = normalizePath( currentPath );
	const normalizedMenu = normalizePath( menuPath );
	return (
		normalizedCurrent.startsWith( normalizedMenu ) &&
		( normalizedCurrent[ normalizedMenu.length ] === '/' || normalizedMenu === '/' )
	);
};
const findClosestMenuItem = ( currentPath, menuItems ) => {
	const exactMatch = menuItems.find( item => item.to === currentPath );
	if ( exactMatch ) {
		return exactMatch;
	}
	let bestMatch = null;
	let bestPathLength = 0;
	for ( const item of menuItems ) {
		if ( ! item.to ) {
			continue;
		}
		if ( isValidParentPath( currentPath, item.to ) ) {
			if ( item.to.length > bestPathLength ) {
				bestMatch = item;
				bestPathLength = item.to.length;
			}
		}
	}
	return bestMatch;
};
const findDrilldownParent = ( id, menuItems ) => {
	if ( ! id ) {
		return void 0;
	}
	const currentItem = menuItems.find( item => item.id === id );
	if ( ! currentItem ) {
		return void 0;
	}
	if ( currentItem.parent ) {
		const parentItem = menuItems.find( item => item.id === currentItem.parent );
		if ( parentItem?.parent_type === 'drilldown' ) {
			return parentItem.id;
		}
		if ( parentItem ) {
			return findDrilldownParent( parentItem.id, menuItems );
		}
	}
	return void 0;
};
const findDropdownParent = ( id, menuItems ) => {
	if ( ! id ) {
		return void 0;
	}
	const currentItem = menuItems.find( item => item.id === id );
	if ( ! currentItem ) {
		return void 0;
	}
	if ( currentItem.parent ) {
		const parentItem = menuItems.find( item => item.id === currentItem.parent );
		if ( parentItem?.parent_type === 'dropdown' ) {
			return parentItem.id;
		}
	}
	return void 0;
};

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/use-sidebar-parent.js
const { useRouter: useRouter2, useMatches } = unlock( routePrivateApis3 );
/**
 *
 */
function useSidebarParent() {
	const matches = useMatches();
	const router = useRouter2();
	const menuItems = ( 0, import_data5.useSelect )(
		select =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems(),
		[]
	);
	const currentPath = matches[ matches.length - 1 ].pathname.slice(
		router.options.basepath?.length ?? 0
	);
	const currentMenuItem = findClosestMenuItem( currentPath, menuItems );
	const [ parentId, setParentId ] = ( 0, import_element5.useState )(
		findDrilldownParent( currentMenuItem?.id, menuItems )
	);
	const [ parentDropdownId, setParentDropdownId ] = ( 0, import_element5.useState )(
		findDropdownParent( currentMenuItem?.id, menuItems )
	);
	( 0, import_element5.useEffect )( () => {
		const matchedMenuItem = findClosestMenuItem( currentPath, menuItems );
		const updatedParentId = findDrilldownParent( matchedMenuItem?.id, menuItems );
		const updatedDropdownParent = findDropdownParent( matchedMenuItem?.id, menuItems );
		setParentId( updatedParentId );
		setParentDropdownId( updatedDropdownParent );
	}, [ currentPath, menuItems ] );
	return [ parentId, setParentId, parentDropdownId, setParentDropdownId ];
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/navigation/index.js
const import_jsx_runtime22 = __toESM( require_jsx_runtime() );
/**
 *
 */
function Navigation() {
	const backButtonRef = ( 0, import_element6.useRef )( null );
	const [ animationDirection, setAnimationDirection ] = ( 0, import_element6.useState )( null );
	const [ parentId, setParentId, parentDropdownId, setParentDropdownId ] = useSidebarParent();
	const menuItems = ( 0, import_data6.useSelect )(
		select =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems(),
		[]
	);
	const parent = ( 0, import_element6.useMemo )(
		() => menuItems.find( item => item.id === parentId ),
		[ menuItems, parentId ]
	);
	const navigationKey = parent ? `drilldown-${ parent.id }` : 'root';
	const handleNavigate = ( { id, direction } ) => {
		setAnimationDirection( direction );
		setParentId( id );
	};
	const handleDropdownToggle = dropdownId => {
		setParentDropdownId( parentDropdownId === dropdownId ? void 0 : dropdownId );
	};
	const items = ( 0, import_element6.useMemo )(
		() => menuItems.filter( item => item.parent === parentId ),
		[ menuItems, parentId ]
	);
	const hasRealIcons = items.some( item => !! item.icon );
	return /* @__PURE__ */ ( 0, import_jsx_runtime22.jsx )( NavigationScreen, {
		isRoot: ! parent,
		title: parent ? parent.label : '',
		backMenuItem: parent?.parent,
		backButtonRef,
		animationDirection: animationDirection || void 0,
		navigationKey,
		onNavigate: handleNavigate,
		content: /* @__PURE__ */ ( 0, import_jsx_runtime22.jsx )( import_jsx_runtime22.Fragment, {
			children: items.map( item => {
				if ( item.parent_type === 'dropdown' ) {
					return /* @__PURE__ */ ( 0, import_jsx_runtime22.jsx )(
						DropdownItem,
						{
							id: item.id,
							className: 'boot-navigation-item',
							icon: item.icon,
							shouldShowPlaceholder: hasRealIcons,
							isExpanded: parentDropdownId === item.id,
							onToggle: () => handleDropdownToggle( item.id ),
							children: item.label,
						},
						item.id
					);
				}
				if ( item.parent_type === 'drilldown' ) {
					return /* @__PURE__ */ ( 0, import_jsx_runtime22.jsx )(
						DrilldownItem,
						{
							id: item.id,
							icon: item.icon,
							shouldShowPlaceholder: hasRealIcons,
							onNavigate: handleNavigate,
							children: item.label,
						},
						item.id
					);
				}
				return /* @__PURE__ */ ( 0, import_jsx_runtime22.jsx )(
					NavigationItem,
					{
						to: item.to,
						icon: item.icon,
						shouldShowPlaceholder: hasRealIcons,
						children: item.label,
					},
					item.id
				);
			} ),
		} ),
	} );
}
const navigation_default = Navigation;

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/save-button/index.js
const import_element8 = __toESM( require_element() );
const import_data8 = __toESM( require_data() );
const import_i18n6 = __toESM( require_i18n() );
const import_core_data4 = __toESM( require_core_data() );
const import_keycodes2 = __toESM( require_keycodes() );
const import_editor2 = __toESM( require_editor() );
const import_components9 = __toESM( require_components() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/save-panel/use-save-shortcut.js
const import_element7 = __toESM( require_element() );
const import_keyboard_shortcuts = __toESM( require_keyboard_shortcuts() );
const import_i18n5 = __toESM( require_i18n() );
const import_data7 = __toESM( require_data() );
const import_core_data3 = __toESM( require_core_data() );
const import_editor = __toESM( require_editor() );
const shortcutName = 'core/boot/save';
/**
 *
 * @param root0
 * @param root0.openSavePanel
 */
function useSaveShortcut( { openSavePanel } ) {
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } = ( 0,
	import_data7.useSelect )( import_core_data3.store );
	const { hasNonPostEntityChanges, isPostSavingLocked } = ( 0, import_data7.useSelect )(
		import_editor.store
	);
	const { savePost } = ( 0, import_data7.useDispatch )( import_editor.store );
	const { registerShortcut, unregisterShortcut } = ( 0, import_data7.useDispatch )(
		import_keyboard_shortcuts.store
	);
	( 0, import_element7.useEffect )( () => {
		registerShortcut( {
			name: shortcutName,
			category: 'global',
			description: ( 0, import_i18n5.__ )( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );
		return () => {
			unregisterShortcut( shortcutName );
		};
	}, [ registerShortcut, unregisterShortcut ] );
	( 0, import_keyboard_shortcuts.useShortcut )( shortcutName, event => {
		event.preventDefault();
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const hasDirtyEntities = !! dirtyEntityRecords.length;
		const isSaving = dirtyEntityRecords.some( record =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		);
		if ( ! hasDirtyEntities || isSaving ) {
			return;
		}
		if ( hasNonPostEntityChanges() ) {
			openSavePanel();
		} else if ( ! isPostSavingLocked() ) {
			savePost();
		}
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/save-button/index.js
const import_jsx_runtime23 = __toESM( require_jsx_runtime() );
const css7 = `.boot-save-button {
  width: 100%;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvc2F2ZS1idXR0b24iLCJzb3VyY2VzIjpbInN0eWxlLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDQyIsInNvdXJjZXNDb250ZW50IjpbIi5ib290LXNhdmUtYnV0dG9uIHtcblx0d2lkdGg6IDEwMCU7XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css7 ) );
/**
 *
 */
function SaveButton() {
	const [ isSaveViewOpen, setIsSaveViewOpened ] = ( 0, import_element8.useState )( false );
	const { isSaving, dirtyEntityRecordsCount } = ( 0, import_data8.useSelect )( select => {
		const { isSavingEntityRecord, __experimentalGetDirtyEntityRecords } = select(
			import_core_data4.store
		);
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return {
			isSaving: dirtyEntityRecords.some( record =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
			dirtyEntityRecordsCount: dirtyEntityRecords.length,
		};
	}, [] );
	const [ showSavedState, setShowSavedState ] = ( 0, import_element8.useState )( false );
	( 0, import_element8.useEffect )( () => {
		if ( isSaving ) {
			setShowSavedState( true );
		}
	}, [ isSaving ] );
	const hasChanges = dirtyEntityRecordsCount > 0;
	( 0, import_element8.useEffect )( () => {
		if ( ! isSaving && hasChanges ) {
			setShowSavedState( false );
		}
	}, [ isSaving, hasChanges ] );
	/**
	 *
	 */
	function hideSavedState() {
		if ( showSavedState ) {
			setShowSavedState( false );
		}
	}
	const shouldShowButton = hasChanges || showSavedState;
	useSaveShortcut( { openSavePanel: () => setIsSaveViewOpened( true ) } );
	if ( ! shouldShowButton ) {
		return null;
	}
	const isInSavedState = showSavedState && ! hasChanges;
	const disabled = isSaving || isInSavedState;
	const getLabel = () => {
		if ( isInSavedState ) {
			return ( 0, import_i18n6.__ )( 'Saved' );
		}
		return ( 0, import_i18n6.sprintf )(
			// translators: %d: number of unsaved changes (number).
			( 0, import_i18n6._n )(
				'Review %d change\u2026',
				'Review %d changes\u2026',
				dirtyEntityRecordsCount
			),
			dirtyEntityRecordsCount
		);
	};
	const label = getLabel();
	return /* @__PURE__ */ ( 0, import_jsx_runtime23.jsxs )( import_jsx_runtime23.Fragment, {
		children: [
			/* @__PURE__ */ ( 0, import_jsx_runtime23.jsx )( import_components9.Tooltip, {
				text: hasChanges ? label : void 0,
				shortcut: import_keycodes2.displayShortcut.primary( 's' ),
				children: /* @__PURE__ */ ( 0, import_jsx_runtime23.jsx )( import_components9.Button, {
					variant: 'primary',
					size: 'compact',
					onClick: () => setIsSaveViewOpened( true ),
					onBlur: hideSavedState,
					disabled,
					accessibleWhenDisabled: true,
					isBusy: isSaving,
					'aria-keyshortcuts': import_keycodes2.rawShortcut.primary( 's' ),
					className: 'boot-save-button',
					icon: isInSavedState ? check_default : void 0,
					children: label,
				} ),
			} ),
			isSaveViewOpen &&
				/* @__PURE__ */ ( 0, import_jsx_runtime23.jsx )( import_components9.Modal, {
					title: ( 0, import_i18n6.__ )( 'Review changes' ),
					onRequestClose: () => setIsSaveViewOpened( false ),
					size: 'small',
					children: /* @__PURE__ */ ( 0, import_jsx_runtime23.jsx )(
						import_editor2.EntitiesSavedStates,
						{
							close: () => setIsSaveViewOpened( false ),
							variant: 'inline',
						}
					),
				} ),
		],
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/sidebar/index.js
const import_jsx_runtime24 = __toESM( require_jsx_runtime() );
const css8 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-sidebar__scrollable {
  overflow: auto;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.boot-sidebar__content {
  flex-grow: 1;
  contain: content;
  position: relative;
}

.boot-sidebar__footer {
  padding: 16px 8px 8px 16px;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvc2lkZWJhciIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX3ZhcmlhYmxlcy5zY3NzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2NvbG9ycy5zY3NzIiwic3R5bGUuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBRFVBO0FBQUE7QUFBQTtBQU9BO0FBQUE7QUFBQTtBQTZCQTtBQUFBO0FBQUE7QUFBQTtBQWlCQTtBQUFBO0FBQUE7QUFXQTtBQUFBO0FBQUE7QUFnQkE7QUFBQTtBQUFBO0FBeUJBO0FBQUE7QUFBQTtBQUtBO0FBQUE7QUFBQTtBQWVBO0FBQUE7QUFBQTtBQW1CQTtBQUFBO0FBQUE7QUFTQTtBQUFBO0FBQUE7QUFBQTtBRWpLQTtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztBQUdEO0VBQ0M7RUFDQTtFQUNBOzs7QUFHRDtFQUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTQ1NTIFZhcmlhYmxlcy5cbiAqXG4gKiBQbGVhc2UgdXNlIHZhcmlhYmxlcyBmcm9tIHRoaXMgc2hlZXQgdG8gZW5zdXJlIGNvbnNpc3RlbmN5IGFjcm9zcyB0aGUgVUkuXG4gKiBEb24ndCBhZGQgdG8gdGhpcyBzaGVldCB1bmxlc3MgeW91J3JlIHByZXR0eSBzdXJlIHRoZSB2YWx1ZSB3aWxsIGJlIHJldXNlZCBpbiBtYW55IHBsYWNlcy5cbiAqIEZvciBleGFtcGxlLCBkb24ndCBhZGQgcnVsZXMgdG8gdGhpcyBzaGVldCB0aGF0IGFmZmVjdCBibG9jayB2aXN1YWxzLiBJdCdzIHB1cmVseSBmb3IgVUkuXG4gKi9cblxuQHVzZSBcIi4vY29sb3JzXCI7XG5cbi8qKlxuICogRm9udHMgJiBiYXNpYyB2YXJpYWJsZXMuXG4gKi9cblxuJGRlZmF1bHQtZm9udDogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmOyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGZhbWlseSB2YXJpYWJsZXNcbiRkZWZhdWx0LWxpbmUtaGVpZ2h0OiAxLjQ7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkbGluZS1oZWlnaHQgdG9rZW5zXG5cbi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbi8vIFNpemVzXG4kZm9udC1zaXplLXgtc21hbGw6IDExcHg7XG4kZm9udC1zaXplLXNtYWxsOiAxMnB4O1xuJGZvbnQtc2l6ZS1tZWRpdW06IDEzcHg7XG4kZm9udC1zaXplLWxhcmdlOiAxNXB4O1xuJGZvbnQtc2l6ZS14LWxhcmdlOiAyMHB4O1xuJGZvbnQtc2l6ZS0yeC1sYXJnZTogMzJweDtcblxuLy8gTGluZSBoZWlnaHRzXG4kZm9udC1saW5lLWhlaWdodC14LXNtYWxsOiAxNnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtc21hbGw6IDIwcHg7XG4kZm9udC1saW5lLWhlaWdodC1tZWRpdW06IDI0cHg7XG4kZm9udC1saW5lLWhlaWdodC1sYXJnZTogMjhweDtcbiRmb250LWxpbmUtaGVpZ2h0LXgtbGFyZ2U6IDMycHg7XG4kZm9udC1saW5lLWhlaWdodC0yeC1sYXJnZTogNDBweDtcblxuLy8gV2VpZ2h0c1xuJGZvbnQtd2VpZ2h0LXJlZ3VsYXI6IDQwMDtcbiRmb250LXdlaWdodC1tZWRpdW06IDQ5OTsgLy8gZW5zdXJlcyBmYWxsYmFjayB0byA0MDAgKGluc3RlYWQgb2YgNjAwKVxuXG4vLyBGYW1pbGllc1xuJGZvbnQtZmFtaWx5LWhlYWRpbmdzOiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktYm9keTogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LW1vbm86IE1lbmxvLCBDb25zb2xhcywgbW9uYWNvLCBtb25vc3BhY2U7XG5cbi8qKlxuICogR3JpZCBTeXN0ZW0uXG4gKiBodHRwczovL21ha2Uud29yZHByZXNzLm9yZy9kZXNpZ24vMjAxOS8xMC8zMS9wcm9wb3NhbC1hLWNvbnNpc3RlbnQtc3BhY2luZy1zeXN0ZW0tZm9yLXdvcmRwcmVzcy9cbiAqL1xuXG4kZ3JpZC11bml0OiA4cHg7XG4kZ3JpZC11bml0LTA1OiAwLjUgKiAkZ3JpZC11bml0O1x0Ly8gNHB4XG4kZ3JpZC11bml0LTEwOiAxICogJGdyaWQtdW5pdDtcdFx0Ly8gOHB4XG4kZ3JpZC11bml0LTE1OiAxLjUgKiAkZ3JpZC11bml0O1x0Ly8gMTJweFxuJGdyaWQtdW5pdC0yMDogMiAqICRncmlkLXVuaXQ7XHRcdC8vIDE2cHhcbiRncmlkLXVuaXQtMzA6IDMgKiAkZ3JpZC11bml0O1x0XHQvLyAyNHB4XG4kZ3JpZC11bml0LTQwOiA0ICogJGdyaWQtdW5pdDtcdFx0Ly8gMzJweFxuJGdyaWQtdW5pdC01MDogNSAqICRncmlkLXVuaXQ7XHRcdC8vIDQwcHhcbiRncmlkLXVuaXQtNjA6IDYgKiAkZ3JpZC11bml0O1x0XHQvLyA0OHB4XG4kZ3JpZC11bml0LTcwOiA3ICogJGdyaWQtdW5pdDtcdFx0Ly8gNTZweFxuJGdyaWQtdW5pdC04MDogOCAqICRncmlkLXVuaXQ7XHRcdC8vIDY0cHhcblxuLyoqXG4gKiBSYWRpdXMgc2NhbGUuXG4gKi9cblxuJHJhZGl1cy14LXNtYWxsOiAxcHg7ICAgLy8gQXBwbGllZCB0byBlbGVtZW50cyBsaWtlIGJ1dHRvbnMgbmVzdGVkIHdpdGhpbiBwcmltaXRpdmVzIGxpa2UgaW5wdXRzLlxuJHJhZGl1cy1zbWFsbDogMnB4OyAgICAgLy8gQXBwbGllZCB0byBtb3N0IHByaW1pdGl2ZXMuXG4kcmFkaXVzLW1lZGl1bTogNHB4OyAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBzbWFsbGVyIHBhZGRpbmcuXG4kcmFkaXVzLWxhcmdlOiA4cHg7ICAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBsYXJnZXIgcGFkZGluZy5cbiRyYWRpdXMtZnVsbDogOTk5OXB4OyAgIC8vIEZvciBwaWxscy5cbiRyYWRpdXMtcm91bmQ6IDUwJTsgICAgIC8vIEZvciBjaXJjbGVzIGFuZCBvdmFscy5cblxuLyoqXG4gKiBFbGV2YXRpb24gc2NhbGUuXG4gKi9cblxuLy8gRm9yIHNlY3Rpb25zIGFuZCBjb250YWluZXJzIHRoYXQgZ3JvdXAgcmVsYXRlZCBjb250ZW50IGFuZCBjb250cm9scywgd2hpY2ggbWF5IG92ZXJsYXAgb3RoZXIgY29udGVudC4gRXhhbXBsZTogUHJldmlldyBGcmFtZS5cbiRlbGV2YXRpb24teC1zbWFsbDogMCAxcHggMXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDNweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCA0cHggNHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMSk7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgcHJvdmlkZSBjb250ZXh0dWFsIGZlZWRiYWNrIHdpdGhvdXQgYmVpbmcgaW50cnVzaXZlLiBHZW5lcmFsbHkgbm9uLWludGVycnVwdGl2ZS4gRXhhbXBsZTogVG9vbHRpcHMsIFNuYWNrYmFyLlxuJGVsZXZhdGlvbi1zbWFsbDogMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDZweCA2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCA4cHggOHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgb2ZmZXIgYWRkaXRpb25hbCBhY3Rpb25zLiBFeGFtcGxlOiBNZW51cywgQ29tbWFuZCBQYWxldHRlXG4kZWxldmF0aW9uLW1lZGl1bTogMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgNHB4IDVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDEycHggMTJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDE2cHggMTZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IGNvbmZpcm0gZGVjaXNpb25zIG9yIGhhbmRsZSBuZWNlc3NhcnkgaW50ZXJydXB0aW9ucy4gRXhhbXBsZTogTW9kYWxzLlxuJGVsZXZhdGlvbi1sYXJnZTogMCA1cHggMTVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDgpLCAwIDE1cHggMjdweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDcpLCAwIDMwcHggMzZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDUwcHggNDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vKipcbiAqIERpbWVuc2lvbnMuXG4gKi9cblxuJGljb24tc2l6ZTogMjRweDtcbiRidXR0b24tc2l6ZTogMzZweDtcbiRidXR0b24tc2l6ZS1uZXh0LWRlZmF1bHQtNDBweDogNDBweDsgLy8gdHJhbnNpdGlvbmFyeSB2YXJpYWJsZSBmb3IgbmV4dCBkZWZhdWx0IGJ1dHRvbiBzaXplXG4kYnV0dG9uLXNpemUtc21hbGw6IDI0cHg7XG4kYnV0dG9uLXNpemUtY29tcGFjdDogMzJweDtcbiRoZWFkZXItaGVpZ2h0OiA2NHB4O1xuJHBhbmVsLWhlYWRlci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kbmF2LXNpZGViYXItd2lkdGg6IDMwMHB4O1xuJGFkbWluLWJhci1oZWlnaHQ6IDMycHg7XG4kYWRtaW4tYmFyLWhlaWdodC1iaWc6IDQ2cHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aDogMTYwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1iaWc6IDE5MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkOiAzNnB4O1xuJG1vZGFsLW1pbi13aWR0aDogMzUwcHg7XG4kbW9kYWwtd2lkdGgtc21hbGw6IDM4NHB4O1xuJG1vZGFsLXdpZHRoLW1lZGl1bTogNTEycHg7XG4kbW9kYWwtd2lkdGgtbGFyZ2U6IDg0MHB4O1xuJHNwaW5uZXItc2l6ZTogMTZweDtcbiRjYW52YXMtcGFkZGluZzogJGdyaWQtdW5pdC0yMDtcbiRwYWxldHRlLW1heC1oZWlnaHQ6IDM2OHB4O1xuXG4vKipcbiAqIE1vYmlsZSBzcGVjaWZpYyBzdHlsZXNcbiAqL1xuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemU6IDE2cHg7IC8vIEFueSBmb250IHNpemUgYmVsb3cgMTZweCB3aWxsIGNhdXNlIE1vYmlsZSBTYWZhcmkgdG8gXCJ6b29tIGluXCIuXG5cbi8qKlxuICogRWRpdG9yIHN0eWxlcy5cbiAqL1xuXG4kc2lkZWJhci13aWR0aDogMjgwcHg7XG4kY29udGVudC13aWR0aDogODQwcHg7XG4kd2lkZS1jb250ZW50LXdpZHRoOiAxMTAwcHg7XG4kd2lkZ2V0LWFyZWEtd2lkdGg6IDcwMHB4O1xuJHNlY29uZGFyeS1zaWRlYmFyLXdpZHRoOiAzNTBweDtcbiRlZGl0b3ItZm9udC1zaXplOiAxNnB4O1xuJGRlZmF1bHQtYmxvY2stbWFyZ2luOiAyOHB4OyAvLyBUaGlzIHZhbHVlIHByb3ZpZGVzIGEgY29uc2lzdGVudCwgY29udGlndW91cyBzcGFjaW5nIGJldHdlZW4gYmxvY2tzLlxuJHRleHQtZWRpdG9yLWZvbnQtc2l6ZTogMTVweDtcbiRlZGl0b3ItbGluZS1oZWlnaHQ6IDEuODtcbiRlZGl0b3ItaHRtbC1mb250OiAkZm9udC1mYW1pbHktbW9ubztcblxuLyoqXG4gKiBCbG9jayAmIEVkaXRvciBVSS5cbiAqL1xuXG4kYmxvY2stdG9vbGJhci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kYm9yZGVyLXdpZHRoOiAxcHg7XG4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrOiAycHg7IC8vIFRoaXMgZXhpc3RzIGFzIGEgZmFsbGJhY2ssIGFuZCBpcyBpZGVhbGx5IG92ZXJyaWRkZW4gYnkgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB1bmxlc3MgaW4gc29tZSBTQVNTIG1hdGggY2FzZXMuXG4kYm9yZGVyLXdpZHRoLXRhYjogMS41cHg7XG4kaGVscHRleHQtZm9udC1zaXplOiAxMnB4O1xuJHJhZGlvLWlucHV0LXNpemU6IDE2cHg7XG4kcmFkaW8taW5wdXQtc2l6ZS1zbTogMjRweDsgLy8gV2lkdGggJiBoZWlnaHQgZm9yIHNtYWxsIHZpZXdwb3J0cy5cblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGJsb2NrLXBhZGRpbmc6IDE0cHg7IC8vIFVzZWQgdG8gZGVmaW5lIHNwYWNlIGJldHdlZW4gYmxvY2sgZm9vdHByaW50IGFuZCBzdXJyb3VuZGluZyBib3JkZXJzLlxuJHJhZGl1cy1ibG9jay11aTogJHJhZGl1cy1zbWFsbDtcbiRzaGFkb3ctcG9wb3ZlcjogJGVsZXZhdGlvbi14LXNtYWxsO1xuJHNoYWRvdy1tb2RhbDogJGVsZXZhdGlvbi1sYXJnZTtcbiRkZWZhdWx0LWZvbnQtc2l6ZTogJGZvbnQtc2l6ZS1tZWRpdW07XG5cbi8qKlxuICogQmxvY2sgcGFkZGluZ3MuXG4gKi9cblxuLy8gUGFkZGluZyBmb3IgYmxvY2tzIHdpdGggYSBiYWNrZ3JvdW5kIGNvbG9yIChlLmcuIHBhcmFncmFwaCBvciBncm91cCkuXG4kYmxvY2stYmctcGFkZGluZy0tdjogMS4yNWVtO1xuJGJsb2NrLWJnLXBhZGRpbmctLWg6IDIuMzc1ZW07XG5cblxuLyoqXG4gKiBSZWFjdCBOYXRpdmUgc3BlY2lmaWMuXG4gKiBUaGVzZSB2YXJpYWJsZXMgZG8gbm90IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlIGVsc2UuXG4gKi9cblxuLy8gRGltZW5zaW9ucy5cbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1leHBhbmRlZC1oZWlnaHQ6IDUycHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLW1hcmdpbjogOHB4O1xuJG1vYmlsZS1jb2xvci1zd2F0Y2g6IDQ4cHg7XG5cbi8vIEJsb2NrIFVJLlxuJG1vYmlsZS1ibG9jay10b29sYmFyLWhlaWdodDogNDRweDtcbiRkaW1tZWQtb3BhY2l0eTogMTtcbiRibG9jay1lZGdlLXRvLWNvbnRlbnQ6IDE2cHg7XG4kc29saWQtYm9yZGVyLXNwYWNlOiAxMnB4O1xuJGRhc2hlZC1ib3JkZXItc3BhY2U6IDZweDtcbiRibG9jay1zZWxlY3RlZC1tYXJnaW46IDNweDtcbiRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg6IDFweDtcbiRibG9jay1zZWxlY3RlZC1wYWRkaW5nOiAwO1xuJGJsb2NrLXNlbGVjdGVkLWNoaWxkLW1hcmdpbjogNXB4O1xuJGJsb2NrLXNlbGVjdGVkLXRvLWNvbnRlbnQ6ICRibG9jay1lZGdlLXRvLWNvbnRlbnQgLSAkYmxvY2stc2VsZWN0ZWQtbWFyZ2luIC0gJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDtcbiIsIi8qKlxuICogQ29sb3JzXG4gKi9cblxuLy8gV29yZFByZXNzIGdyYXlzLlxuJGJsYWNrOiAjMDAwO1x0XHRcdC8vIFVzZSBvbmx5IHdoZW4geW91IHRydWx5IG5lZWQgcHVyZSBibGFjay4gRm9yIFVJLCB1c2UgJGdyYXktOTAwLlxuJGdyYXktOTAwOiAjMWUxZTFlO1xuJGdyYXktODAwOiAjMmYyZjJmO1xuJGdyYXktNzAwOiAjNzU3NTc1O1x0XHQvLyBNZWV0cyA0LjY6MSAoNC41OjEgaXMgbWluaW11bSkgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNjAwOiAjOTQ5NDk0O1x0XHQvLyBNZWV0cyAzOjEgVUkgb3IgbGFyZ2UgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNDAwOiAjY2NjO1xuJGdyYXktMzAwOiAjZGRkO1x0XHQvLyBVc2VkIGZvciBtb3N0IGJvcmRlcnMuXG4kZ3JheS0yMDA6ICNlMGUwZTA7XHRcdC8vIFVzZWQgc3BhcmluZ2x5IGZvciBsaWdodCBib3JkZXJzLlxuJGdyYXktMTAwOiAjZjBmMGYwO1x0XHQvLyBVc2VkIGZvciBsaWdodCBncmF5IGJhY2tncm91bmRzLlxuJHdoaXRlOiAjZmZmO1xuXG4vLyBPcGFjaXRpZXMgJiBhZGRpdGlvbmFsIGNvbG9ycy5cbiRkYXJrLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjYyKTtcbiRtZWRpdW0tZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNTUpO1xuJGxpZ2h0LWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJHdoaXRlLCAwLjY1KTtcblxuLy8gQWxlcnQgY29sb3JzLlxuJGFsZXJ0LXllbGxvdzogI2YwYjg0OTtcbiRhbGVydC1yZWQ6ICNjYzE4MTg7XG4kYWxlcnQtZ3JlZW46ICM0YWI4NjY7XG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRkYXJrLXRoZW1lLWZvY3VzOiAkd2hpdGU7XHQvLyBGb2N1cyBjb2xvciB3aGVuIHRoZSB0aGVtZSBpcyBkYXJrLlxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvdmFyaWFibGVzXCI7XG5cbi5ib290LXNpZGViYXJfX3Njcm9sbGFibGUge1xuXHRvdmVyZmxvdzogYXV0bztcblx0aGVpZ2h0OiAxMDAlO1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG59XG5cbi5ib290LXNpZGViYXJfX2NvbnRlbnQge1xuXHRmbGV4LWdyb3c6IDE7XG5cdGNvbnRhaW46IGNvbnRlbnQ7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmJvb3Qtc2lkZWJhcl9fZm9vdGVyIHtcblx0cGFkZGluZzogdmFyaWFibGVzLiRncmlkLXVuaXQtMjAgdmFyaWFibGVzLiRncmlkLXVuaXQtMTAgdmFyaWFibGVzLiRncmlkLXVuaXQtMTAgdmFyaWFibGVzLiRncmlkLXVuaXQtMjA7XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css8 ) );
/**
 *
 */
function Sidebar() {
	return /* @__PURE__ */ ( 0, import_jsx_runtime24.jsxs )( 'div', {
		className: 'boot-sidebar__scrollable',
		children: [
			/* @__PURE__ */ ( 0, import_jsx_runtime24.jsx )( site_hub_default, {} ),
			/* @__PURE__ */ ( 0, import_jsx_runtime24.jsx )( 'div', {
				className: 'boot-sidebar__content',
				children: /* @__PURE__ */ ( 0, import_jsx_runtime24.jsx )( navigation_default, {} ),
			} ),
			/* @__PURE__ */ ( 0, import_jsx_runtime24.jsx )( 'div', {
				className: 'boot-sidebar__footer',
				children: /* @__PURE__ */ ( 0, import_jsx_runtime24.jsx )( SaveButton, {} ),
			} ),
		],
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/save-panel/index.js
const import_element9 = __toESM( require_element() );
const import_components10 = __toESM( require_components() );
const import_editor3 = __toESM( require_editor() );
const import_i18n7 = __toESM( require_i18n() );
const import_jsx_runtime25 = __toESM( require_jsx_runtime() );
/**
 *
 */
function SavePanel() {
	const [ isOpen, setIsOpen ] = ( 0, import_element9.useState )( false );
	useSaveShortcut( {
		openSavePanel: () => setIsOpen( true ),
	} );
	if ( ! isOpen ) {
		return false;
	}
	return /* @__PURE__ */ ( 0, import_jsx_runtime25.jsx )( import_components10.Modal, {
		className: 'edit-site-save-panel__modal',
		onRequestClose: () => setIsOpen( false ),
		title: ( 0, import_i18n7.__ )( 'Review changes' ),
		size: 'small',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime25.jsx )( import_editor3.EntitiesSavedStates, {
			close: () => setIsOpen( false ),
			variant: 'inline',
		} ),
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/canvas-renderer/index.js
const import_element11 = __toESM( require_element() );

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/canvas/index.js
const import_element10 = __toESM( require_element() );
const import_components12 = __toESM( require_components() );
import { useNavigate } from '@wordpress/route';

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/canvas/back-button.js
const import_components11 = __toESM( require_components() );
const import_compose3 = __toESM( require_compose() );
const import_i18n8 = __toESM( require_i18n() );
const import_jsx_runtime26 = __toESM( require_jsx_runtime() );
const css9 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-canvas-back-button {
  position: absolute;
  top: 0;
  left: 0;
  height: 64px;
  width: 64px;
  z-index: 100;
}

.boot-canvas-back-button__container {
  position: relative;
  width: 100%;
  height: 100%;
}

.boot-canvas-back-button__link.components-button {
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--wpds-color-bg-surface-neutral-weak);
  text-decoration: none;
  padding: 0;
  border-radius: 0;
}
@media not (prefers-reduced-motion) {
  .boot-canvas-back-button__link.components-button {
    transition: outline 0.1s ease-out;
  }
}
.boot-canvas-back-button__link.components-button:focus:not(:active) {
  outline: var(--wpds-border-width-focus) solid var(--wpds-color-stroke-focus-brand);
  outline-offset: calc(-1 * var(--wpds-border-width-focus));
}

.boot-canvas-back-button__icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: hsl(0, 0%, 80%);
  pointer-events: none;
}
.boot-canvas-back-button__icon svg {
  fill: currentColor;
}
.boot-canvas-back-button__icon.has-site-icon {
  background-color: hsla(0, 0%, 100%, 0.6);
  -webkit-backdrop-filter: saturate(180%) blur(15px);
  backdrop-filter: saturate(180%) blur(15px);
}

.interface-interface-skeleton__header {
  margin-top: 0 !important;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvY2FudmFzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fdmFyaWFibGVzLnNjc3MiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fY29sb3JzLnNjc3MiLCJiYWNrLWJ1dHRvbi5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FDQUE7QUFBQTtBQUFBO0FEVUE7QUFBQTtBQUFBO0FBT0E7QUFBQTtBQUFBO0FBNkJBO0FBQUE7QUFBQTtBQUFBO0FBaUJBO0FBQUE7QUFBQTtBQVdBO0FBQUE7QUFBQTtBQWdCQTtBQUFBO0FBQUE7QUF5QkE7QUFBQTtBQUFBO0FBS0E7QUFBQTtBQUFBO0FBZUE7QUFBQTtBQUFBO0FBbUJBO0FBQUE7QUFBQTtBQVNBO0FBQUE7QUFBQTtBQUFBO0FFaktBO0VBQ0M7RUFDQTtFQUNBO0VBQ0EsUUY2RmU7RUU1RmYsT0Y0RmU7RUUzRmY7OztBQUdEO0VBQ0M7RUFDQTtFQUNBOzs7QUFHRDtFQUNDLE9GaUZlO0VFaEZmLFFGZ0ZlO0VFL0VmO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOztBQUVBO0VBWEQ7SUFZRTs7O0FBR0Q7RUFDQyxTQUNDO0VBRUQ7OztBQUlGO0VBQ0M7RUFDQTtFQUNBO0VBQ0EsT0Z1RGU7RUV0RGYsUUZzRGU7RUVyRGY7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7QUFFQTtFQUNDOztBQUdEO0VBQ0M7RUFDQTtFQUNBOzs7QUFLRjtFQUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTQ1NTIFZhcmlhYmxlcy5cbiAqXG4gKiBQbGVhc2UgdXNlIHZhcmlhYmxlcyBmcm9tIHRoaXMgc2hlZXQgdG8gZW5zdXJlIGNvbnNpc3RlbmN5IGFjcm9zcyB0aGUgVUkuXG4gKiBEb24ndCBhZGQgdG8gdGhpcyBzaGVldCB1bmxlc3MgeW91J3JlIHByZXR0eSBzdXJlIHRoZSB2YWx1ZSB3aWxsIGJlIHJldXNlZCBpbiBtYW55IHBsYWNlcy5cbiAqIEZvciBleGFtcGxlLCBkb24ndCBhZGQgcnVsZXMgdG8gdGhpcyBzaGVldCB0aGF0IGFmZmVjdCBibG9jayB2aXN1YWxzLiBJdCdzIHB1cmVseSBmb3IgVUkuXG4gKi9cblxuQHVzZSBcIi4vY29sb3JzXCI7XG5cbi8qKlxuICogRm9udHMgJiBiYXNpYyB2YXJpYWJsZXMuXG4gKi9cblxuJGRlZmF1bHQtZm9udDogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmOyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGZhbWlseSB2YXJpYWJsZXNcbiRkZWZhdWx0LWxpbmUtaGVpZ2h0OiAxLjQ7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkbGluZS1oZWlnaHQgdG9rZW5zXG5cbi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbi8vIFNpemVzXG4kZm9udC1zaXplLXgtc21hbGw6IDExcHg7XG4kZm9udC1zaXplLXNtYWxsOiAxMnB4O1xuJGZvbnQtc2l6ZS1tZWRpdW06IDEzcHg7XG4kZm9udC1zaXplLWxhcmdlOiAxNXB4O1xuJGZvbnQtc2l6ZS14LWxhcmdlOiAyMHB4O1xuJGZvbnQtc2l6ZS0yeC1sYXJnZTogMzJweDtcblxuLy8gTGluZSBoZWlnaHRzXG4kZm9udC1saW5lLWhlaWdodC14LXNtYWxsOiAxNnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtc21hbGw6IDIwcHg7XG4kZm9udC1saW5lLWhlaWdodC1tZWRpdW06IDI0cHg7XG4kZm9udC1saW5lLWhlaWdodC1sYXJnZTogMjhweDtcbiRmb250LWxpbmUtaGVpZ2h0LXgtbGFyZ2U6IDMycHg7XG4kZm9udC1saW5lLWhlaWdodC0yeC1sYXJnZTogNDBweDtcblxuLy8gV2VpZ2h0c1xuJGZvbnQtd2VpZ2h0LXJlZ3VsYXI6IDQwMDtcbiRmb250LXdlaWdodC1tZWRpdW06IDQ5OTsgLy8gZW5zdXJlcyBmYWxsYmFjayB0byA0MDAgKGluc3RlYWQgb2YgNjAwKVxuXG4vLyBGYW1pbGllc1xuJGZvbnQtZmFtaWx5LWhlYWRpbmdzOiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktYm9keTogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LW1vbm86IE1lbmxvLCBDb25zb2xhcywgbW9uYWNvLCBtb25vc3BhY2U7XG5cbi8qKlxuICogR3JpZCBTeXN0ZW0uXG4gKiBodHRwczovL21ha2Uud29yZHByZXNzLm9yZy9kZXNpZ24vMjAxOS8xMC8zMS9wcm9wb3NhbC1hLWNvbnNpc3RlbnQtc3BhY2luZy1zeXN0ZW0tZm9yLXdvcmRwcmVzcy9cbiAqL1xuXG4kZ3JpZC11bml0OiA4cHg7XG4kZ3JpZC11bml0LTA1OiAwLjUgKiAkZ3JpZC11bml0O1x0Ly8gNHB4XG4kZ3JpZC11bml0LTEwOiAxICogJGdyaWQtdW5pdDtcdFx0Ly8gOHB4XG4kZ3JpZC11bml0LTE1OiAxLjUgKiAkZ3JpZC11bml0O1x0Ly8gMTJweFxuJGdyaWQtdW5pdC0yMDogMiAqICRncmlkLXVuaXQ7XHRcdC8vIDE2cHhcbiRncmlkLXVuaXQtMzA6IDMgKiAkZ3JpZC11bml0O1x0XHQvLyAyNHB4XG4kZ3JpZC11bml0LTQwOiA0ICogJGdyaWQtdW5pdDtcdFx0Ly8gMzJweFxuJGdyaWQtdW5pdC01MDogNSAqICRncmlkLXVuaXQ7XHRcdC8vIDQwcHhcbiRncmlkLXVuaXQtNjA6IDYgKiAkZ3JpZC11bml0O1x0XHQvLyA0OHB4XG4kZ3JpZC11bml0LTcwOiA3ICogJGdyaWQtdW5pdDtcdFx0Ly8gNTZweFxuJGdyaWQtdW5pdC04MDogOCAqICRncmlkLXVuaXQ7XHRcdC8vIDY0cHhcblxuLyoqXG4gKiBSYWRpdXMgc2NhbGUuXG4gKi9cblxuJHJhZGl1cy14LXNtYWxsOiAxcHg7ICAgLy8gQXBwbGllZCB0byBlbGVtZW50cyBsaWtlIGJ1dHRvbnMgbmVzdGVkIHdpdGhpbiBwcmltaXRpdmVzIGxpa2UgaW5wdXRzLlxuJHJhZGl1cy1zbWFsbDogMnB4OyAgICAgLy8gQXBwbGllZCB0byBtb3N0IHByaW1pdGl2ZXMuXG4kcmFkaXVzLW1lZGl1bTogNHB4OyAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBzbWFsbGVyIHBhZGRpbmcuXG4kcmFkaXVzLWxhcmdlOiA4cHg7ICAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBsYXJnZXIgcGFkZGluZy5cbiRyYWRpdXMtZnVsbDogOTk5OXB4OyAgIC8vIEZvciBwaWxscy5cbiRyYWRpdXMtcm91bmQ6IDUwJTsgICAgIC8vIEZvciBjaXJjbGVzIGFuZCBvdmFscy5cblxuLyoqXG4gKiBFbGV2YXRpb24gc2NhbGUuXG4gKi9cblxuLy8gRm9yIHNlY3Rpb25zIGFuZCBjb250YWluZXJzIHRoYXQgZ3JvdXAgcmVsYXRlZCBjb250ZW50IGFuZCBjb250cm9scywgd2hpY2ggbWF5IG92ZXJsYXAgb3RoZXIgY29udGVudC4gRXhhbXBsZTogUHJldmlldyBGcmFtZS5cbiRlbGV2YXRpb24teC1zbWFsbDogMCAxcHggMXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDNweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCA0cHggNHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMSk7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgcHJvdmlkZSBjb250ZXh0dWFsIGZlZWRiYWNrIHdpdGhvdXQgYmVpbmcgaW50cnVzaXZlLiBHZW5lcmFsbHkgbm9uLWludGVycnVwdGl2ZS4gRXhhbXBsZTogVG9vbHRpcHMsIFNuYWNrYmFyLlxuJGVsZXZhdGlvbi1zbWFsbDogMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDZweCA2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCA4cHggOHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgb2ZmZXIgYWRkaXRpb25hbCBhY3Rpb25zLiBFeGFtcGxlOiBNZW51cywgQ29tbWFuZCBQYWxldHRlXG4kZWxldmF0aW9uLW1lZGl1bTogMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgNHB4IDVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDEycHggMTJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDE2cHggMTZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IGNvbmZpcm0gZGVjaXNpb25zIG9yIGhhbmRsZSBuZWNlc3NhcnkgaW50ZXJydXB0aW9ucy4gRXhhbXBsZTogTW9kYWxzLlxuJGVsZXZhdGlvbi1sYXJnZTogMCA1cHggMTVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDgpLCAwIDE1cHggMjdweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDcpLCAwIDMwcHggMzZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDUwcHggNDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vKipcbiAqIERpbWVuc2lvbnMuXG4gKi9cblxuJGljb24tc2l6ZTogMjRweDtcbiRidXR0b24tc2l6ZTogMzZweDtcbiRidXR0b24tc2l6ZS1uZXh0LWRlZmF1bHQtNDBweDogNDBweDsgLy8gdHJhbnNpdGlvbmFyeSB2YXJpYWJsZSBmb3IgbmV4dCBkZWZhdWx0IGJ1dHRvbiBzaXplXG4kYnV0dG9uLXNpemUtc21hbGw6IDI0cHg7XG4kYnV0dG9uLXNpemUtY29tcGFjdDogMzJweDtcbiRoZWFkZXItaGVpZ2h0OiA2NHB4O1xuJHBhbmVsLWhlYWRlci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kbmF2LXNpZGViYXItd2lkdGg6IDMwMHB4O1xuJGFkbWluLWJhci1oZWlnaHQ6IDMycHg7XG4kYWRtaW4tYmFyLWhlaWdodC1iaWc6IDQ2cHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aDogMTYwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1iaWc6IDE5MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkOiAzNnB4O1xuJG1vZGFsLW1pbi13aWR0aDogMzUwcHg7XG4kbW9kYWwtd2lkdGgtc21hbGw6IDM4NHB4O1xuJG1vZGFsLXdpZHRoLW1lZGl1bTogNTEycHg7XG4kbW9kYWwtd2lkdGgtbGFyZ2U6IDg0MHB4O1xuJHNwaW5uZXItc2l6ZTogMTZweDtcbiRjYW52YXMtcGFkZGluZzogJGdyaWQtdW5pdC0yMDtcbiRwYWxldHRlLW1heC1oZWlnaHQ6IDM2OHB4O1xuXG4vKipcbiAqIE1vYmlsZSBzcGVjaWZpYyBzdHlsZXNcbiAqL1xuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemU6IDE2cHg7IC8vIEFueSBmb250IHNpemUgYmVsb3cgMTZweCB3aWxsIGNhdXNlIE1vYmlsZSBTYWZhcmkgdG8gXCJ6b29tIGluXCIuXG5cbi8qKlxuICogRWRpdG9yIHN0eWxlcy5cbiAqL1xuXG4kc2lkZWJhci13aWR0aDogMjgwcHg7XG4kY29udGVudC13aWR0aDogODQwcHg7XG4kd2lkZS1jb250ZW50LXdpZHRoOiAxMTAwcHg7XG4kd2lkZ2V0LWFyZWEtd2lkdGg6IDcwMHB4O1xuJHNlY29uZGFyeS1zaWRlYmFyLXdpZHRoOiAzNTBweDtcbiRlZGl0b3ItZm9udC1zaXplOiAxNnB4O1xuJGRlZmF1bHQtYmxvY2stbWFyZ2luOiAyOHB4OyAvLyBUaGlzIHZhbHVlIHByb3ZpZGVzIGEgY29uc2lzdGVudCwgY29udGlndW91cyBzcGFjaW5nIGJldHdlZW4gYmxvY2tzLlxuJHRleHQtZWRpdG9yLWZvbnQtc2l6ZTogMTVweDtcbiRlZGl0b3ItbGluZS1oZWlnaHQ6IDEuODtcbiRlZGl0b3ItaHRtbC1mb250OiAkZm9udC1mYW1pbHktbW9ubztcblxuLyoqXG4gKiBCbG9jayAmIEVkaXRvciBVSS5cbiAqL1xuXG4kYmxvY2stdG9vbGJhci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kYm9yZGVyLXdpZHRoOiAxcHg7XG4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrOiAycHg7IC8vIFRoaXMgZXhpc3RzIGFzIGEgZmFsbGJhY2ssIGFuZCBpcyBpZGVhbGx5IG92ZXJyaWRkZW4gYnkgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB1bmxlc3MgaW4gc29tZSBTQVNTIG1hdGggY2FzZXMuXG4kYm9yZGVyLXdpZHRoLXRhYjogMS41cHg7XG4kaGVscHRleHQtZm9udC1zaXplOiAxMnB4O1xuJHJhZGlvLWlucHV0LXNpemU6IDE2cHg7XG4kcmFkaW8taW5wdXQtc2l6ZS1zbTogMjRweDsgLy8gV2lkdGggJiBoZWlnaHQgZm9yIHNtYWxsIHZpZXdwb3J0cy5cblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGJsb2NrLXBhZGRpbmc6IDE0cHg7IC8vIFVzZWQgdG8gZGVmaW5lIHNwYWNlIGJldHdlZW4gYmxvY2sgZm9vdHByaW50IGFuZCBzdXJyb3VuZGluZyBib3JkZXJzLlxuJHJhZGl1cy1ibG9jay11aTogJHJhZGl1cy1zbWFsbDtcbiRzaGFkb3ctcG9wb3ZlcjogJGVsZXZhdGlvbi14LXNtYWxsO1xuJHNoYWRvdy1tb2RhbDogJGVsZXZhdGlvbi1sYXJnZTtcbiRkZWZhdWx0LWZvbnQtc2l6ZTogJGZvbnQtc2l6ZS1tZWRpdW07XG5cbi8qKlxuICogQmxvY2sgcGFkZGluZ3MuXG4gKi9cblxuLy8gUGFkZGluZyBmb3IgYmxvY2tzIHdpdGggYSBiYWNrZ3JvdW5kIGNvbG9yIChlLmcuIHBhcmFncmFwaCBvciBncm91cCkuXG4kYmxvY2stYmctcGFkZGluZy0tdjogMS4yNWVtO1xuJGJsb2NrLWJnLXBhZGRpbmctLWg6IDIuMzc1ZW07XG5cblxuLyoqXG4gKiBSZWFjdCBOYXRpdmUgc3BlY2lmaWMuXG4gKiBUaGVzZSB2YXJpYWJsZXMgZG8gbm90IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlIGVsc2UuXG4gKi9cblxuLy8gRGltZW5zaW9ucy5cbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1leHBhbmRlZC1oZWlnaHQ6IDUycHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLW1hcmdpbjogOHB4O1xuJG1vYmlsZS1jb2xvci1zd2F0Y2g6IDQ4cHg7XG5cbi8vIEJsb2NrIFVJLlxuJG1vYmlsZS1ibG9jay10b29sYmFyLWhlaWdodDogNDRweDtcbiRkaW1tZWQtb3BhY2l0eTogMTtcbiRibG9jay1lZGdlLXRvLWNvbnRlbnQ6IDE2cHg7XG4kc29saWQtYm9yZGVyLXNwYWNlOiAxMnB4O1xuJGRhc2hlZC1ib3JkZXItc3BhY2U6IDZweDtcbiRibG9jay1zZWxlY3RlZC1tYXJnaW46IDNweDtcbiRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg6IDFweDtcbiRibG9jay1zZWxlY3RlZC1wYWRkaW5nOiAwO1xuJGJsb2NrLXNlbGVjdGVkLWNoaWxkLW1hcmdpbjogNXB4O1xuJGJsb2NrLXNlbGVjdGVkLXRvLWNvbnRlbnQ6ICRibG9jay1lZGdlLXRvLWNvbnRlbnQgLSAkYmxvY2stc2VsZWN0ZWQtbWFyZ2luIC0gJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDtcbiIsIi8qKlxuICogQ29sb3JzXG4gKi9cblxuLy8gV29yZFByZXNzIGdyYXlzLlxuJGJsYWNrOiAjMDAwO1x0XHRcdC8vIFVzZSBvbmx5IHdoZW4geW91IHRydWx5IG5lZWQgcHVyZSBibGFjay4gRm9yIFVJLCB1c2UgJGdyYXktOTAwLlxuJGdyYXktOTAwOiAjMWUxZTFlO1xuJGdyYXktODAwOiAjMmYyZjJmO1xuJGdyYXktNzAwOiAjNzU3NTc1O1x0XHQvLyBNZWV0cyA0LjY6MSAoNC41OjEgaXMgbWluaW11bSkgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNjAwOiAjOTQ5NDk0O1x0XHQvLyBNZWV0cyAzOjEgVUkgb3IgbGFyZ2UgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNDAwOiAjY2NjO1xuJGdyYXktMzAwOiAjZGRkO1x0XHQvLyBVc2VkIGZvciBtb3N0IGJvcmRlcnMuXG4kZ3JheS0yMDA6ICNlMGUwZTA7XHRcdC8vIFVzZWQgc3BhcmluZ2x5IGZvciBsaWdodCBib3JkZXJzLlxuJGdyYXktMTAwOiAjZjBmMGYwO1x0XHQvLyBVc2VkIGZvciBsaWdodCBncmF5IGJhY2tncm91bmRzLlxuJHdoaXRlOiAjZmZmO1xuXG4vLyBPcGFjaXRpZXMgJiBhZGRpdGlvbmFsIGNvbG9ycy5cbiRkYXJrLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjYyKTtcbiRtZWRpdW0tZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNTUpO1xuJGxpZ2h0LWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJHdoaXRlLCAwLjY1KTtcblxuLy8gQWxlcnQgY29sb3JzLlxuJGFsZXJ0LXllbGxvdzogI2YwYjg0OTtcbiRhbGVydC1yZWQ6ICNjYzE4MTg7XG4kYWxlcnQtZ3JlZW46ICM0YWI4NjY7XG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRkYXJrLXRoZW1lLWZvY3VzOiAkd2hpdGU7XHQvLyBGb2N1cyBjb2xvciB3aGVuIHRoZSB0aGVtZSBpcyBkYXJrLlxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvdmFyaWFibGVzXCI7XG5cbi5ib290LWNhbnZhcy1iYWNrLWJ1dHRvbiB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiAwO1xuXHRsZWZ0OiAwO1xuXHRoZWlnaHQ6IHZhcmlhYmxlcy4kaGVhZGVyLWhlaWdodDtcblx0d2lkdGg6IHZhcmlhYmxlcy4kaGVhZGVyLWhlaWdodDtcblx0ei1pbmRleDogMTAwO1xufVxuXG4uYm9vdC1jYW52YXMtYmFjay1idXR0b25fX2NvbnRhaW5lciB7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcblx0d2lkdGg6IDEwMCU7XG5cdGhlaWdodDogMTAwJTtcbn1cblxuLmJvb3QtY2FudmFzLWJhY2stYnV0dG9uX19saW5rLmNvbXBvbmVudHMtYnV0dG9uIHtcblx0d2lkdGg6IHZhcmlhYmxlcy4kaGVhZGVyLWhlaWdodDtcblx0aGVpZ2h0OiB2YXJpYWJsZXMuJGhlYWRlci1oZWlnaHQ7XG5cdGRpc3BsYXk6IGlubGluZS1mbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0YmFja2dyb3VuZDogdmFyKC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLW5ldXRyYWwtd2Vhayk7XG5cdHRleHQtZGVjb3JhdGlvbjogbm9uZTtcblx0cGFkZGluZzogMDtcblx0Ym9yZGVyLXJhZGl1czogMDtcblxuXHRAbWVkaWEgbm90IChwcmVmZXJzLXJlZHVjZWQtbW90aW9uKSB7XG5cdFx0dHJhbnNpdGlvbjogb3V0bGluZSAwLjFzIGVhc2Utb3V0O1xuXHR9XG5cblx0Jjpmb2N1czpub3QoOmFjdGl2ZSkge1xuXHRcdG91dGxpbmU6XG5cdFx0XHR2YXIoLS13cGRzLWJvcmRlci13aWR0aC1mb2N1cykgc29saWRcblx0XHRcdHZhcigtLXdwZHMtY29sb3Itc3Ryb2tlLWZvY3VzLWJyYW5kKTtcblx0XHRvdXRsaW5lLW9mZnNldDogY2FsYygtMSAqIHZhcigtLXdwZHMtYm9yZGVyLXdpZHRoLWZvY3VzKSk7XG5cdH1cbn1cblxuLmJvb3QtY2FudmFzLWJhY2stYnV0dG9uX19pY29uIHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDA7XG5cdGxlZnQ6IDA7XG5cdHdpZHRoOiB2YXJpYWJsZXMuJGhlYWRlci1oZWlnaHQ7XG5cdGhlaWdodDogdmFyaWFibGVzLiRoZWFkZXItaGVpZ2h0O1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0YmFja2dyb3VuZC1jb2xvcjogaHNsYSgwLCAwJSwgODAlKTtcblx0cG9pbnRlci1ldmVudHM6IG5vbmU7XG5cblx0c3ZnIHtcblx0XHRmaWxsOiBjdXJyZW50Q29sb3I7XG5cdH1cblxuXHQmLmhhcy1zaXRlLWljb24ge1xuXHRcdGJhY2tncm91bmQtY29sb3I6IGhzbGEoMCwgMCUsIDEwMCUsIDAuNik7XG5cdFx0LXdlYmtpdC1iYWNrZHJvcC1maWx0ZXI6IHNhdHVyYXRlKDE4MCUpIGJsdXIoMTVweCk7XG5cdFx0YmFja2Ryb3AtZmlsdGVyOiBzYXR1cmF0ZSgxODAlKSBibHVyKDE1cHgpO1xuXHR9XG59XG5cbi8vIFJlbW92ZSB0aGUgaGVhZGVyIHNsaWRlLWluIGFuaW1hdGlvbiBzbyB0aGUgYmFjayBsb2dvIGRvZXMgbm90IG1vdmUuXG4uaW50ZXJmYWNlLWludGVyZmFjZS1za2VsZXRvbl9faGVhZGVyIHtcblx0bWFyZ2luLXRvcDogMCAhaW1wb3J0YW50O1xufVxuIl19 */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css9 ) );
const toggleHomeIconVariants = {
	edit: {
		opacity: 0,
		scale: 0.2,
	},
	hover: {
		opacity: 1,
		scale: 1,
		clipPath: 'inset( 22% round 2px )',
	},
};
/**
 *
 * @param root0
 * @param root0.length
 */
function BootBackButton( { length } ) {
	const disableMotion = ( 0, import_compose3.useReducedMotion )();
	const handleBack = () => {
		window.history.back();
	};
	if ( length > 1 ) {
		return null;
	}
	const transition = {
		duration: disableMotion ? 0 : 0.3,
	};
	return /* @__PURE__ */ ( 0, import_jsx_runtime26.jsxs )(
		import_components11.__unstableMotion.div,
		{
			className: 'boot-canvas-back-button',
			animate: 'edit',
			initial: 'edit',
			whileHover: 'hover',
			whileTap: 'tap',
			transition,
			children: [
				/* @__PURE__ */ ( 0, import_jsx_runtime26.jsx )( import_components11.Button, {
					className: 'boot-canvas-back-button__link',
					onClick: handleBack,
					'aria-label': ( 0, import_i18n8.__ )( 'Go back' ),
					__next40pxDefaultSize: true,
					children: /* @__PURE__ */ ( 0, import_jsx_runtime26.jsx )( site_icon_default, {} ),
				} ),
				/* @__PURE__ */ ( 0, import_jsx_runtime26.jsx )( import_components11.__unstableMotion.div, {
					className: 'boot-canvas-back-button__icon',
					variants: toggleHomeIconVariants,
					children: /* @__PURE__ */ ( 0, import_jsx_runtime26.jsx )( import_components11.Icon, {
						icon: arrow_up_left_default,
					} ),
				} ),
			],
		}
	);
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/canvas/index.js
const import_jsx_runtime27 = __toESM( require_jsx_runtime() );
/**
 *
 * @param root0
 * @param root0.canvas
 */
function Canvas( { canvas } ) {
	const [ Editor, setEditor ] = ( 0, import_element10.useState )( null );
	const navigate = useNavigate();
	( 0, import_element10.useEffect )( () => {
		import( '@wordpress/lazy-editor' )
			.then( module => {
				setEditor( () => module.Editor );
			} )
			.catch( error => {
				console.error( 'Failed to load lazy editor:', error );
			} );
	}, [] );
	if ( ! Editor ) {
		return /* @__PURE__ */ ( 0, import_jsx_runtime27.jsx )( 'div', {
			style: {
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
				padding: '2rem',
			},
			children: /* @__PURE__ */ ( 0, import_jsx_runtime27.jsx )( import_components12.Spinner, {} ),
		} );
	}
	const backButton = ! canvas.isPreview
		? ( { length } ) =>
				/* @__PURE__ */ ( 0, import_jsx_runtime27.jsx )( BootBackButton, { length } )
		: void 0;
	return /* @__PURE__ */ ( 0, import_jsx_runtime27.jsxs )( 'div', {
		style: { height: '100%', position: 'relative' },
		children: [
			/* @__PURE__ */ ( 0, import_jsx_runtime27.jsx )( 'div', {
				style: { height: '100%' },
				inert: canvas.isPreview ? 'true' : void 0,
				children: /* @__PURE__ */ ( 0, import_jsx_runtime27.jsx )( Editor, {
					postType: canvas.postType,
					postId: canvas.postId,
					settings: { isPreviewMode: canvas.isPreview },
					backButton,
				} ),
			} ),
			canvas.isPreview &&
				canvas.editLink &&
				/* @__PURE__ */ ( 0, import_jsx_runtime27.jsx )( 'div', {
					onClick: () => navigate( { to: canvas.editLink } ),
					onKeyDown: e => {
						if ( e.key === 'Enter' || e.key === ' ' ) {
							e.preventDefault();
							navigate( { to: canvas.editLink } );
						}
					},
					style: {
						position: 'absolute',
						inset: 0,
						cursor: 'pointer',
						zIndex: 1,
					},
					role: 'button',
					tabIndex: 0,
					'aria-label': 'Click to edit',
				} ),
		],
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/canvas-renderer/index.js
const import_jsx_runtime28 = __toESM( require_jsx_runtime() );
/**
 *
 * @param root0
 * @param root0.canvas
 * @param root0.routeContentModule
 */
function CanvasRenderer( { canvas, routeContentModule } ) {
	const [ CustomCanvas, setCustomCanvas ] = ( 0, import_element11.useState )( null );
	( 0, import_element11.useEffect )( () => {
		if ( canvas === null && routeContentModule ) {
			import( routeContentModule )
				.then( module => {
					setCustomCanvas( () => module.canvas );
				} )
				.catch( error => {
					console.error( 'Failed to load custom canvas:', error );
				} );
		} else {
			setCustomCanvas( null );
		}
	}, [ canvas, routeContentModule ] );
	if ( canvas === void 0 ) {
		return null;
	}
	if ( canvas === null ) {
		if ( ! CustomCanvas ) {
			return null;
		}
		return /* @__PURE__ */ ( 0, import_jsx_runtime28.jsx )( CustomCanvas, {} );
	}
	return /* @__PURE__ */ ( 0, import_jsx_runtime28.jsx )( Canvas, { canvas } );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/root/index.js
const import_jsx_runtime29 = __toESM( require_jsx_runtime() );
const css10 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
  isolation: isolate;
  background: var(--wpds-color-bg-surface-neutral-weak, #f0f0f0);
}

.boot-layout__sidebar {
  height: 100%;
  flex-shrink: 0;
  width: 240px;
  position: relative;
  overflow: hidden;
}

.boot-layout__surfaces {
  display: flex;
  flex-grow: 1;
  margin: 8px;
  gap: 8px;
}

.boot-layout__stage,
.boot-layout__inspector,
.boot-layout__canvas {
  flex: 1;
  overflow-y: auto;
  background: var(--wpds-color-bg-surface-neutral, #fff);
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--wpds-color-stroke-surface-neutral-weak, #ddd);
  position: relative;
}

.boot-layout.has-canvas .boot-layout__stage,
.boot-layout__inspector {
  max-width: 400px;
}

.boot-layout__canvas .interface-interface-skeleton {
  position: relative;
  height: 100%;
  top: 0 !important;
  left: 0 !important;
}

.boot-layout.has-full-canvas .boot-layout__surfaces {
  margin: 0;
  gap: 0;
}

.boot-layout.has-full-canvas .boot-layout__stage,
.boot-layout.has-full-canvas .boot-layout__inspector {
  display: none;
}

.boot-layout.has-full-canvas .boot-layout__canvas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
  overflow: hidden;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvcm9vdCIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX3ZhcmlhYmxlcy5zY3NzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2NvbG9ycy5zY3NzIiwic3R5bGUuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBRFVBO0FBQUE7QUFBQTtBQU9BO0FBQUE7QUFBQTtBQTZCQTtBQUFBO0FBQUE7QUFBQTtBQWlCQTtBQUFBO0FBQUE7QUFXQTtBQUFBO0FBQUE7QUFnQkE7QUFBQTtBQUFBO0FBeUJBO0FBQUE7QUFBQTtBQUtBO0FBQUE7QUFBQTtBQWVBO0FBQUE7QUFBQTtBQW1CQTtBQUFBO0FBQUE7QUFTQTtBQUFBO0FBQUE7QUFBQTtBRWpLQTtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFHRDtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztBQUdEO0VBQ0M7RUFDQTtFQUNBLFFGOEJjO0VFN0JkLEtGNkJjOzs7QUUxQmY7QUFBQTtBQUFBO0VBR0M7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7O0FBR0Q7QUFBQTtFQUVDOzs7QUFHRDtFQUNDO0VBQ0E7RUFDQTtFQUNBOzs7QUFJRDtFQUNDO0VBQ0E7OztBQUdEO0FBQUE7RUFFQzs7O0FBR0Q7RUFDQztFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTQ1NTIFZhcmlhYmxlcy5cbiAqXG4gKiBQbGVhc2UgdXNlIHZhcmlhYmxlcyBmcm9tIHRoaXMgc2hlZXQgdG8gZW5zdXJlIGNvbnNpc3RlbmN5IGFjcm9zcyB0aGUgVUkuXG4gKiBEb24ndCBhZGQgdG8gdGhpcyBzaGVldCB1bmxlc3MgeW91J3JlIHByZXR0eSBzdXJlIHRoZSB2YWx1ZSB3aWxsIGJlIHJldXNlZCBpbiBtYW55IHBsYWNlcy5cbiAqIEZvciBleGFtcGxlLCBkb24ndCBhZGQgcnVsZXMgdG8gdGhpcyBzaGVldCB0aGF0IGFmZmVjdCBibG9jayB2aXN1YWxzLiBJdCdzIHB1cmVseSBmb3IgVUkuXG4gKi9cblxuQHVzZSBcIi4vY29sb3JzXCI7XG5cbi8qKlxuICogRm9udHMgJiBiYXNpYyB2YXJpYWJsZXMuXG4gKi9cblxuJGRlZmF1bHQtZm9udDogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmOyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGZhbWlseSB2YXJpYWJsZXNcbiRkZWZhdWx0LWxpbmUtaGVpZ2h0OiAxLjQ7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkbGluZS1oZWlnaHQgdG9rZW5zXG5cbi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbi8vIFNpemVzXG4kZm9udC1zaXplLXgtc21hbGw6IDExcHg7XG4kZm9udC1zaXplLXNtYWxsOiAxMnB4O1xuJGZvbnQtc2l6ZS1tZWRpdW06IDEzcHg7XG4kZm9udC1zaXplLWxhcmdlOiAxNXB4O1xuJGZvbnQtc2l6ZS14LWxhcmdlOiAyMHB4O1xuJGZvbnQtc2l6ZS0yeC1sYXJnZTogMzJweDtcblxuLy8gTGluZSBoZWlnaHRzXG4kZm9udC1saW5lLWhlaWdodC14LXNtYWxsOiAxNnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtc21hbGw6IDIwcHg7XG4kZm9udC1saW5lLWhlaWdodC1tZWRpdW06IDI0cHg7XG4kZm9udC1saW5lLWhlaWdodC1sYXJnZTogMjhweDtcbiRmb250LWxpbmUtaGVpZ2h0LXgtbGFyZ2U6IDMycHg7XG4kZm9udC1saW5lLWhlaWdodC0yeC1sYXJnZTogNDBweDtcblxuLy8gV2VpZ2h0c1xuJGZvbnQtd2VpZ2h0LXJlZ3VsYXI6IDQwMDtcbiRmb250LXdlaWdodC1tZWRpdW06IDQ5OTsgLy8gZW5zdXJlcyBmYWxsYmFjayB0byA0MDAgKGluc3RlYWQgb2YgNjAwKVxuXG4vLyBGYW1pbGllc1xuJGZvbnQtZmFtaWx5LWhlYWRpbmdzOiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktYm9keTogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LW1vbm86IE1lbmxvLCBDb25zb2xhcywgbW9uYWNvLCBtb25vc3BhY2U7XG5cbi8qKlxuICogR3JpZCBTeXN0ZW0uXG4gKiBodHRwczovL21ha2Uud29yZHByZXNzLm9yZy9kZXNpZ24vMjAxOS8xMC8zMS9wcm9wb3NhbC1hLWNvbnNpc3RlbnQtc3BhY2luZy1zeXN0ZW0tZm9yLXdvcmRwcmVzcy9cbiAqL1xuXG4kZ3JpZC11bml0OiA4cHg7XG4kZ3JpZC11bml0LTA1OiAwLjUgKiAkZ3JpZC11bml0O1x0Ly8gNHB4XG4kZ3JpZC11bml0LTEwOiAxICogJGdyaWQtdW5pdDtcdFx0Ly8gOHB4XG4kZ3JpZC11bml0LTE1OiAxLjUgKiAkZ3JpZC11bml0O1x0Ly8gMTJweFxuJGdyaWQtdW5pdC0yMDogMiAqICRncmlkLXVuaXQ7XHRcdC8vIDE2cHhcbiRncmlkLXVuaXQtMzA6IDMgKiAkZ3JpZC11bml0O1x0XHQvLyAyNHB4XG4kZ3JpZC11bml0LTQwOiA0ICogJGdyaWQtdW5pdDtcdFx0Ly8gMzJweFxuJGdyaWQtdW5pdC01MDogNSAqICRncmlkLXVuaXQ7XHRcdC8vIDQwcHhcbiRncmlkLXVuaXQtNjA6IDYgKiAkZ3JpZC11bml0O1x0XHQvLyA0OHB4XG4kZ3JpZC11bml0LTcwOiA3ICogJGdyaWQtdW5pdDtcdFx0Ly8gNTZweFxuJGdyaWQtdW5pdC04MDogOCAqICRncmlkLXVuaXQ7XHRcdC8vIDY0cHhcblxuLyoqXG4gKiBSYWRpdXMgc2NhbGUuXG4gKi9cblxuJHJhZGl1cy14LXNtYWxsOiAxcHg7ICAgLy8gQXBwbGllZCB0byBlbGVtZW50cyBsaWtlIGJ1dHRvbnMgbmVzdGVkIHdpdGhpbiBwcmltaXRpdmVzIGxpa2UgaW5wdXRzLlxuJHJhZGl1cy1zbWFsbDogMnB4OyAgICAgLy8gQXBwbGllZCB0byBtb3N0IHByaW1pdGl2ZXMuXG4kcmFkaXVzLW1lZGl1bTogNHB4OyAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBzbWFsbGVyIHBhZGRpbmcuXG4kcmFkaXVzLWxhcmdlOiA4cHg7ICAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBsYXJnZXIgcGFkZGluZy5cbiRyYWRpdXMtZnVsbDogOTk5OXB4OyAgIC8vIEZvciBwaWxscy5cbiRyYWRpdXMtcm91bmQ6IDUwJTsgICAgIC8vIEZvciBjaXJjbGVzIGFuZCBvdmFscy5cblxuLyoqXG4gKiBFbGV2YXRpb24gc2NhbGUuXG4gKi9cblxuLy8gRm9yIHNlY3Rpb25zIGFuZCBjb250YWluZXJzIHRoYXQgZ3JvdXAgcmVsYXRlZCBjb250ZW50IGFuZCBjb250cm9scywgd2hpY2ggbWF5IG92ZXJsYXAgb3RoZXIgY29udGVudC4gRXhhbXBsZTogUHJldmlldyBGcmFtZS5cbiRlbGV2YXRpb24teC1zbWFsbDogMCAxcHggMXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDNweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCA0cHggNHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMSk7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgcHJvdmlkZSBjb250ZXh0dWFsIGZlZWRiYWNrIHdpdGhvdXQgYmVpbmcgaW50cnVzaXZlLiBHZW5lcmFsbHkgbm9uLWludGVycnVwdGl2ZS4gRXhhbXBsZTogVG9vbHRpcHMsIFNuYWNrYmFyLlxuJGVsZXZhdGlvbi1zbWFsbDogMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDZweCA2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCA4cHggOHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgb2ZmZXIgYWRkaXRpb25hbCBhY3Rpb25zLiBFeGFtcGxlOiBNZW51cywgQ29tbWFuZCBQYWxldHRlXG4kZWxldmF0aW9uLW1lZGl1bTogMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgNHB4IDVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDEycHggMTJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDE2cHggMTZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IGNvbmZpcm0gZGVjaXNpb25zIG9yIGhhbmRsZSBuZWNlc3NhcnkgaW50ZXJydXB0aW9ucy4gRXhhbXBsZTogTW9kYWxzLlxuJGVsZXZhdGlvbi1sYXJnZTogMCA1cHggMTVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDgpLCAwIDE1cHggMjdweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDcpLCAwIDMwcHggMzZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDUwcHggNDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vKipcbiAqIERpbWVuc2lvbnMuXG4gKi9cblxuJGljb24tc2l6ZTogMjRweDtcbiRidXR0b24tc2l6ZTogMzZweDtcbiRidXR0b24tc2l6ZS1uZXh0LWRlZmF1bHQtNDBweDogNDBweDsgLy8gdHJhbnNpdGlvbmFyeSB2YXJpYWJsZSBmb3IgbmV4dCBkZWZhdWx0IGJ1dHRvbiBzaXplXG4kYnV0dG9uLXNpemUtc21hbGw6IDI0cHg7XG4kYnV0dG9uLXNpemUtY29tcGFjdDogMzJweDtcbiRoZWFkZXItaGVpZ2h0OiA2NHB4O1xuJHBhbmVsLWhlYWRlci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kbmF2LXNpZGViYXItd2lkdGg6IDMwMHB4O1xuJGFkbWluLWJhci1oZWlnaHQ6IDMycHg7XG4kYWRtaW4tYmFyLWhlaWdodC1iaWc6IDQ2cHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aDogMTYwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1iaWc6IDE5MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkOiAzNnB4O1xuJG1vZGFsLW1pbi13aWR0aDogMzUwcHg7XG4kbW9kYWwtd2lkdGgtc21hbGw6IDM4NHB4O1xuJG1vZGFsLXdpZHRoLW1lZGl1bTogNTEycHg7XG4kbW9kYWwtd2lkdGgtbGFyZ2U6IDg0MHB4O1xuJHNwaW5uZXItc2l6ZTogMTZweDtcbiRjYW52YXMtcGFkZGluZzogJGdyaWQtdW5pdC0yMDtcbiRwYWxldHRlLW1heC1oZWlnaHQ6IDM2OHB4O1xuXG4vKipcbiAqIE1vYmlsZSBzcGVjaWZpYyBzdHlsZXNcbiAqL1xuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemU6IDE2cHg7IC8vIEFueSBmb250IHNpemUgYmVsb3cgMTZweCB3aWxsIGNhdXNlIE1vYmlsZSBTYWZhcmkgdG8gXCJ6b29tIGluXCIuXG5cbi8qKlxuICogRWRpdG9yIHN0eWxlcy5cbiAqL1xuXG4kc2lkZWJhci13aWR0aDogMjgwcHg7XG4kY29udGVudC13aWR0aDogODQwcHg7XG4kd2lkZS1jb250ZW50LXdpZHRoOiAxMTAwcHg7XG4kd2lkZ2V0LWFyZWEtd2lkdGg6IDcwMHB4O1xuJHNlY29uZGFyeS1zaWRlYmFyLXdpZHRoOiAzNTBweDtcbiRlZGl0b3ItZm9udC1zaXplOiAxNnB4O1xuJGRlZmF1bHQtYmxvY2stbWFyZ2luOiAyOHB4OyAvLyBUaGlzIHZhbHVlIHByb3ZpZGVzIGEgY29uc2lzdGVudCwgY29udGlndW91cyBzcGFjaW5nIGJldHdlZW4gYmxvY2tzLlxuJHRleHQtZWRpdG9yLWZvbnQtc2l6ZTogMTVweDtcbiRlZGl0b3ItbGluZS1oZWlnaHQ6IDEuODtcbiRlZGl0b3ItaHRtbC1mb250OiAkZm9udC1mYW1pbHktbW9ubztcblxuLyoqXG4gKiBCbG9jayAmIEVkaXRvciBVSS5cbiAqL1xuXG4kYmxvY2stdG9vbGJhci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kYm9yZGVyLXdpZHRoOiAxcHg7XG4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrOiAycHg7IC8vIFRoaXMgZXhpc3RzIGFzIGEgZmFsbGJhY2ssIGFuZCBpcyBpZGVhbGx5IG92ZXJyaWRkZW4gYnkgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB1bmxlc3MgaW4gc29tZSBTQVNTIG1hdGggY2FzZXMuXG4kYm9yZGVyLXdpZHRoLXRhYjogMS41cHg7XG4kaGVscHRleHQtZm9udC1zaXplOiAxMnB4O1xuJHJhZGlvLWlucHV0LXNpemU6IDE2cHg7XG4kcmFkaW8taW5wdXQtc2l6ZS1zbTogMjRweDsgLy8gV2lkdGggJiBoZWlnaHQgZm9yIHNtYWxsIHZpZXdwb3J0cy5cblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGJsb2NrLXBhZGRpbmc6IDE0cHg7IC8vIFVzZWQgdG8gZGVmaW5lIHNwYWNlIGJldHdlZW4gYmxvY2sgZm9vdHByaW50IGFuZCBzdXJyb3VuZGluZyBib3JkZXJzLlxuJHJhZGl1cy1ibG9jay11aTogJHJhZGl1cy1zbWFsbDtcbiRzaGFkb3ctcG9wb3ZlcjogJGVsZXZhdGlvbi14LXNtYWxsO1xuJHNoYWRvdy1tb2RhbDogJGVsZXZhdGlvbi1sYXJnZTtcbiRkZWZhdWx0LWZvbnQtc2l6ZTogJGZvbnQtc2l6ZS1tZWRpdW07XG5cbi8qKlxuICogQmxvY2sgcGFkZGluZ3MuXG4gKi9cblxuLy8gUGFkZGluZyBmb3IgYmxvY2tzIHdpdGggYSBiYWNrZ3JvdW5kIGNvbG9yIChlLmcuIHBhcmFncmFwaCBvciBncm91cCkuXG4kYmxvY2stYmctcGFkZGluZy0tdjogMS4yNWVtO1xuJGJsb2NrLWJnLXBhZGRpbmctLWg6IDIuMzc1ZW07XG5cblxuLyoqXG4gKiBSZWFjdCBOYXRpdmUgc3BlY2lmaWMuXG4gKiBUaGVzZSB2YXJpYWJsZXMgZG8gbm90IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlIGVsc2UuXG4gKi9cblxuLy8gRGltZW5zaW9ucy5cbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1leHBhbmRlZC1oZWlnaHQ6IDUycHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLW1hcmdpbjogOHB4O1xuJG1vYmlsZS1jb2xvci1zd2F0Y2g6IDQ4cHg7XG5cbi8vIEJsb2NrIFVJLlxuJG1vYmlsZS1ibG9jay10b29sYmFyLWhlaWdodDogNDRweDtcbiRkaW1tZWQtb3BhY2l0eTogMTtcbiRibG9jay1lZGdlLXRvLWNvbnRlbnQ6IDE2cHg7XG4kc29saWQtYm9yZGVyLXNwYWNlOiAxMnB4O1xuJGRhc2hlZC1ib3JkZXItc3BhY2U6IDZweDtcbiRibG9jay1zZWxlY3RlZC1tYXJnaW46IDNweDtcbiRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg6IDFweDtcbiRibG9jay1zZWxlY3RlZC1wYWRkaW5nOiAwO1xuJGJsb2NrLXNlbGVjdGVkLWNoaWxkLW1hcmdpbjogNXB4O1xuJGJsb2NrLXNlbGVjdGVkLXRvLWNvbnRlbnQ6ICRibG9jay1lZGdlLXRvLWNvbnRlbnQgLSAkYmxvY2stc2VsZWN0ZWQtbWFyZ2luIC0gJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDtcbiIsIi8qKlxuICogQ29sb3JzXG4gKi9cblxuLy8gV29yZFByZXNzIGdyYXlzLlxuJGJsYWNrOiAjMDAwO1x0XHRcdC8vIFVzZSBvbmx5IHdoZW4geW91IHRydWx5IG5lZWQgcHVyZSBibGFjay4gRm9yIFVJLCB1c2UgJGdyYXktOTAwLlxuJGdyYXktOTAwOiAjMWUxZTFlO1xuJGdyYXktODAwOiAjMmYyZjJmO1xuJGdyYXktNzAwOiAjNzU3NTc1O1x0XHQvLyBNZWV0cyA0LjY6MSAoNC41OjEgaXMgbWluaW11bSkgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNjAwOiAjOTQ5NDk0O1x0XHQvLyBNZWV0cyAzOjEgVUkgb3IgbGFyZ2UgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNDAwOiAjY2NjO1xuJGdyYXktMzAwOiAjZGRkO1x0XHQvLyBVc2VkIGZvciBtb3N0IGJvcmRlcnMuXG4kZ3JheS0yMDA6ICNlMGUwZTA7XHRcdC8vIFVzZWQgc3BhcmluZ2x5IGZvciBsaWdodCBib3JkZXJzLlxuJGdyYXktMTAwOiAjZjBmMGYwO1x0XHQvLyBVc2VkIGZvciBsaWdodCBncmF5IGJhY2tncm91bmRzLlxuJHdoaXRlOiAjZmZmO1xuXG4vLyBPcGFjaXRpZXMgJiBhZGRpdGlvbmFsIGNvbG9ycy5cbiRkYXJrLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjYyKTtcbiRtZWRpdW0tZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNTUpO1xuJGxpZ2h0LWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJHdoaXRlLCAwLjY1KTtcblxuLy8gQWxlcnQgY29sb3JzLlxuJGFsZXJ0LXllbGxvdzogI2YwYjg0OTtcbiRhbGVydC1yZWQ6ICNjYzE4MTg7XG4kYWxlcnQtZ3JlZW46ICM0YWI4NjY7XG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRkYXJrLXRoZW1lLWZvY3VzOiAkd2hpdGU7XHQvLyBGb2N1cyBjb2xvciB3aGVuIHRoZSB0aGVtZSBpcyBkYXJrLlxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvdmFyaWFibGVzXCI7XG5cbi5ib290LWxheW91dCB7XG5cdGhlaWdodDogMTAwJTtcblx0d2lkdGg6IDEwMCU7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiByb3c7XG5cdGNvbG9yOiB2YXIoLS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtbmV1dHJhbCwgIzFlMWUxZSk7XG5cdGlzb2xhdGlvbjogaXNvbGF0ZTtcblx0YmFja2dyb3VuZDogdmFyKC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLW5ldXRyYWwtd2VhaywgI2YwZjBmMCk7XG59XG5cbi5ib290LWxheW91dF9fc2lkZWJhciB7XG5cdGhlaWdodDogMTAwJTtcblx0ZmxleC1zaHJpbms6IDA7XG5cdHdpZHRoOiAyNDBweDtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuXG4uYm9vdC1sYXlvdXRfX3N1cmZhY2VzIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1ncm93OiAxO1xuXHRtYXJnaW46IHZhcmlhYmxlcy4kZ3JpZC11bml0LTEwO1xuXHRnYXA6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTEwO1xufVxuXG4uYm9vdC1sYXlvdXRfX3N0YWdlLFxuLmJvb3QtbGF5b3V0X19pbnNwZWN0b3IsXG4uYm9vdC1sYXlvdXRfX2NhbnZhcyB7XG5cdGZsZXg6IDE7XG5cdG92ZXJmbG93LXk6IGF1dG87XG5cdGJhY2tncm91bmQ6IHZhcigtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1uZXV0cmFsLCAjZmZmKTtcblx0Y29sb3I6IHZhcigtLXdwZHMtY29sb3ItZmctY29udGVudC1uZXV0cmFsLCAjMWUxZTFlKTtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHRib3gtc2hhZG93OiAwIDFweCAzcHggcmdiYSgwLCAwLCAwLCAwLjEpO1xuXHRib3JkZXI6IDFweCBzb2xpZCB2YXIoLS13cGRzLWNvbG9yLXN0cm9rZS1zdXJmYWNlLW5ldXRyYWwtd2VhaywgI2RkZCk7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmJvb3QtbGF5b3V0Lmhhcy1jYW52YXMgLmJvb3QtbGF5b3V0X19zdGFnZSxcbi5ib290LWxheW91dF9faW5zcGVjdG9yIHtcblx0bWF4LXdpZHRoOiA0MDBweDtcbn1cblxuLmJvb3QtbGF5b3V0X19jYW52YXMgLmludGVyZmFjZS1pbnRlcmZhY2Utc2tlbGV0b24ge1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cdGhlaWdodDogMTAwJTtcblx0dG9wOiAwICFpbXBvcnRhbnQ7XG5cdGxlZnQ6IDAgIWltcG9ydGFudDtcbn1cblxuLy8gRnVsbC1zY3JlZW4gY2FudmFzIG1vZGVcbi5ib290LWxheW91dC5oYXMtZnVsbC1jYW52YXMgLmJvb3QtbGF5b3V0X19zdXJmYWNlcyB7XG5cdG1hcmdpbjogMDtcblx0Z2FwOiAwO1xufVxuXG4uYm9vdC1sYXlvdXQuaGFzLWZ1bGwtY2FudmFzIC5ib290LWxheW91dF9fc3RhZ2UsXG4uYm9vdC1sYXlvdXQuaGFzLWZ1bGwtY2FudmFzIC5ib290LWxheW91dF9faW5zcGVjdG9yIHtcblx0ZGlzcGxheTogbm9uZTtcbn1cblxuLmJvb3QtbGF5b3V0Lmhhcy1mdWxsLWNhbnZhcyAuYm9vdC1sYXlvdXRfX2NhbnZhcyB7XG5cdHBvc2l0aW9uOiBmaXhlZDtcblx0dG9wOiAwO1xuXHRsZWZ0OiAwO1xuXHRyaWdodDogMDtcblx0Ym90dG9tOiAwO1xuXHRtYXgtd2lkdGg6IG5vbmU7XG5cdG1hcmdpbjogMDtcblx0Ym9yZGVyLXJhZGl1czogMDtcblx0Ym9yZGVyOiBub25lO1xuXHRib3gtc2hhZG93OiBub25lO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuIl19 */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css10 ) );
const { ThemeProvider } = unlock( import_theme.privateApis );
const { useMatches: useMatches2, Outlet } = unlock( routePrivateApis4 );
/**
 *
 */
function Root() {
	const matches = useMatches2();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = currentMatch?.loaderData?.canvas;
	const routeContentModule = currentMatch?.loaderData?.routeContentModule;
	const isFullScreen = canvas && ! canvas.isPreview;
	return /* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( ThemeProvider, {
		isRoot: true,
		color: { bg: '#f8f8f8', primary: '#3858e9' },
		children: /* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( ThemeProvider, {
			color: { bg: '#1d2327', primary: '#3858e9' },
			children: /* @__PURE__ */ ( 0, import_jsx_runtime29.jsxs )( 'div', {
				className: clsx_default( 'boot-layout', {
					'has-canvas': !! canvas || canvas === null,
					'has-full-canvas': isFullScreen,
				} ),
				children: [
					/* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( import_commands2.CommandMenu, {} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( SavePanel, {} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( import_editor4.EditorSnackbars, {} ),
					! isFullScreen &&
						/* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( 'div', {
							className: 'boot-layout__sidebar',
							children: /* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( Sidebar, {} ),
						} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime29.jsxs )( 'div', {
						className: 'boot-layout__surfaces',
						children: [
							/* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( ThemeProvider, {
								color: { bg: '#ffffff', primary: '#3858e9' },
								children: /* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( Outlet, {} ),
							} ),
							( canvas || canvas === null ) &&
								/* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( 'div', {
									className: 'boot-layout__canvas',
									children: /* @__PURE__ */ ( 0, import_jsx_runtime29.jsx )( CanvasRenderer, {
										canvas,
										routeContentModule,
									} ),
								} ),
						],
					} ),
				],
			} ),
		} ),
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/app/router.js
const import_jsx_runtime30 = __toESM( require_jsx_runtime() );
const {
	createLazyRoute,
	createRouter,
	createRootRoute,
	createRoute,
	RouterProvider,
	createBrowserHistory,
	parseHref,
} = unlock( routePrivateApis5 );
/**
 *
 */
function NotFoundComponent() {
	return /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( 'div', {
		className: 'boot-layout__stage',
		children: /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( page_default, {
			title: ( 0, import_i18n9.__ )( 'Route not found' ),
			hasPadding: true,
			children: ( 0, import_i18n9.__ )( "The page you're looking for does not exist" ),
		} ),
	} );
}
/**
 *
 * @param root0
 * @param root0.stage
 * @param root0.inspector
 */
function RouteComponent( { stage: Stage, inspector: Inspector } ) {
	return /* @__PURE__ */ ( 0, import_jsx_runtime30.jsxs )( import_jsx_runtime30.Fragment, {
		children: [
			Stage &&
				/* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( 'div', {
					className: 'boot-layout__stage',
					children: /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( Stage, {} ),
				} ),
			Inspector &&
				/* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( 'div', {
					className: 'boot-layout__inspector',
					children: /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( Inspector, {} ),
				} ),
		],
	} );
}
/**
 *
 * @param route
 * @param parentRoute
 */
async function createRouteFromDefinition( route, parentRoute ) {
	let routeConfig = {};
	if ( route.route_module ) {
		const module = await import( route.route_module );
		routeConfig = module.route || {};
	}
	let tanstackRoute = createRoute( {
		getParentRoute: () => parentRoute,
		path: route.path,
		beforeLoad: routeConfig.beforeLoad
			? opts =>
					routeConfig.beforeLoad( {
						params: opts.params || {},
						search: opts.search || {},
					} )
			: void 0,
		loader: async opts => {
			const context = {
				params: opts.params || {},
				search: opts.deps || {},
			};
			const [ loaderData, canvasData ] = await Promise.all( [
				routeConfig.loader ? routeConfig.loader( context ) : Promise.resolve( void 0 ),
				routeConfig.canvas ? routeConfig.canvas( context ) : Promise.resolve( void 0 ),
			] );
			return {
				...loaderData,
				canvas: canvasData,
				// Include content module path so Root can load custom canvas
				routeContentModule: route.content_module,
			};
		},
		loaderDeps: opts => opts.search,
	} );
	tanstackRoute = tanstackRoute.lazy( async () => {
		const module = route.content_module ? await import( route.content_module ) : {};
		return createLazyRoute( route.path )( {
			component: function Component() {
				return /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( RouteComponent, {
					stage: module.stage,
					inspector: module.inspector,
				} );
			},
		} );
	} );
	return tanstackRoute;
}
/**
 *
 * @param routes
 * @param rootComponent
 */
async function createRouteTree( routes, rootComponent = Root ) {
	const rootRoute = createRootRoute( {
		component: rootComponent,
		context: () => ( {} ),
	} );
	const dynamicRoutes = await Promise.all(
		routes.map( route => createRouteFromDefinition( route, rootRoute ) )
	);
	return rootRoute.addChildren( dynamicRoutes );
}
/**
 *
 */
function createPathHistory() {
	return createBrowserHistory( {
		parseLocation: () => {
			const url = new URL( window.location.href );
			const path = url.searchParams.get( 'p' ) || '/';
			const pathHref = `${ path }${ url.hash }`;
			return parseHref( pathHref, window.history.state );
		},
		createHref: href => {
			const searchParams = new URLSearchParams( window.location.search );
			searchParams.set( 'p', href );
			return `${ window.location.pathname }?${ searchParams }`;
		},
	} );
}
/**
 *
 * @param root0
 * @param root0.routes
 * @param root0.rootComponent
 */
function Router( { routes, rootComponent = Root } ) {
	const [ router, setRouter ] = ( 0, import_element12.useState )( null );
	( 0, import_element12.useEffect )( () => {
		let cancelled = false;
		/**
		 *
		 */
		async function initializeRouter() {
			const history = createPathHistory();
			const routeTree = await createRouteTree( routes, rootComponent );
			if ( ! cancelled ) {
				const newRouter = createRouter( {
					history,
					routeTree,
					defaultPreload: 'intent',
					defaultNotFoundComponent: NotFoundComponent,
					defaultViewTransition: true,
				} );
				setRouter( newRouter );
			}
		}
		initializeRouter();
		return () => {
			cancelled = true;
		};
	}, [ routes, rootComponent ] );
	if ( ! router ) {
		return /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( 'div', {
			children: 'Loading routes...',
		} );
	}
	return /* @__PURE__ */ ( 0, import_jsx_runtime30.jsx )( RouterProvider, { router } );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/root/single-page.js
const import_commands3 = __toESM( require_commands() );
const import_theme2 = __toESM( require_theme() );
const import_editor5 = __toESM( require_editor() );
import { privateApis as routePrivateApis6 } from '@wordpress/route';
const import_jsx_runtime31 = __toESM( require_jsx_runtime() );
const css11 = `/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
.boot-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
  isolation: isolate;
  background: var(--wpds-color-bg-surface-neutral-weak, #f0f0f0);
}

.boot-layout__sidebar {
  height: 100%;
  flex-shrink: 0;
  width: 240px;
  position: relative;
  overflow: hidden;
}

.boot-layout__surfaces {
  display: flex;
  flex-grow: 1;
  margin: 8px;
  gap: 8px;
}

.boot-layout__stage,
.boot-layout__inspector,
.boot-layout__canvas {
  flex: 1;
  overflow-y: auto;
  background: var(--wpds-color-bg-surface-neutral, #fff);
  color: var(--wpds-color-fg-content-neutral, #1e1e1e);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--wpds-color-stroke-surface-neutral-weak, #ddd);
  position: relative;
}

.boot-layout.has-canvas .boot-layout__stage,
.boot-layout__inspector {
  max-width: 400px;
}

.boot-layout__canvas .interface-interface-skeleton {
  position: relative;
  height: 100%;
  top: 0 !important;
  left: 0 !important;
}

.boot-layout.has-full-canvas .boot-layout__surfaces {
  margin: 0;
  gap: 0;
}

.boot-layout.has-full-canvas .boot-layout__stage,
.boot-layout.has-full-canvas .boot-layout__inspector {
  display: none;
}

.boot-layout.has-full-canvas .boot-layout__canvas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
  overflow: hidden;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjL2NvbXBvbmVudHMvcm9vdCIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX3ZhcmlhYmxlcy5zY3NzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2NvbG9ycy5zY3NzIiwic3R5bGUuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBRFVBO0FBQUE7QUFBQTtBQU9BO0FBQUE7QUFBQTtBQTZCQTtBQUFBO0FBQUE7QUFBQTtBQWlCQTtBQUFBO0FBQUE7QUFXQTtBQUFBO0FBQUE7QUFnQkE7QUFBQTtBQUFBO0FBeUJBO0FBQUE7QUFBQTtBQUtBO0FBQUE7QUFBQTtBQWVBO0FBQUE7QUFBQTtBQW1CQTtBQUFBO0FBQUE7QUFTQTtBQUFBO0FBQUE7QUFBQTtBRWpLQTtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFHRDtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztBQUdEO0VBQ0M7RUFDQTtFQUNBLFFGOEJjO0VFN0JkLEtGNkJjOzs7QUUxQmY7QUFBQTtBQUFBO0VBR0M7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7O0FBR0Q7QUFBQTtFQUVDOzs7QUFHRDtFQUNDO0VBQ0E7RUFDQTtFQUNBOzs7QUFJRDtFQUNDO0VBQ0E7OztBQUdEO0FBQUE7RUFFQzs7O0FBR0Q7RUFDQztFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTQ1NTIFZhcmlhYmxlcy5cbiAqXG4gKiBQbGVhc2UgdXNlIHZhcmlhYmxlcyBmcm9tIHRoaXMgc2hlZXQgdG8gZW5zdXJlIGNvbnNpc3RlbmN5IGFjcm9zcyB0aGUgVUkuXG4gKiBEb24ndCBhZGQgdG8gdGhpcyBzaGVldCB1bmxlc3MgeW91J3JlIHByZXR0eSBzdXJlIHRoZSB2YWx1ZSB3aWxsIGJlIHJldXNlZCBpbiBtYW55IHBsYWNlcy5cbiAqIEZvciBleGFtcGxlLCBkb24ndCBhZGQgcnVsZXMgdG8gdGhpcyBzaGVldCB0aGF0IGFmZmVjdCBibG9jayB2aXN1YWxzLiBJdCdzIHB1cmVseSBmb3IgVUkuXG4gKi9cblxuQHVzZSBcIi4vY29sb3JzXCI7XG5cbi8qKlxuICogRm9udHMgJiBiYXNpYyB2YXJpYWJsZXMuXG4gKi9cblxuJGRlZmF1bHQtZm9udDogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmOyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGZhbWlseSB2YXJpYWJsZXNcbiRkZWZhdWx0LWxpbmUtaGVpZ2h0OiAxLjQ7IC8vIFRvZG86IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiAkbGluZS1oZWlnaHQgdG9rZW5zXG5cbi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbi8vIFNpemVzXG4kZm9udC1zaXplLXgtc21hbGw6IDExcHg7XG4kZm9udC1zaXplLXNtYWxsOiAxMnB4O1xuJGZvbnQtc2l6ZS1tZWRpdW06IDEzcHg7XG4kZm9udC1zaXplLWxhcmdlOiAxNXB4O1xuJGZvbnQtc2l6ZS14LWxhcmdlOiAyMHB4O1xuJGZvbnQtc2l6ZS0yeC1sYXJnZTogMzJweDtcblxuLy8gTGluZSBoZWlnaHRzXG4kZm9udC1saW5lLWhlaWdodC14LXNtYWxsOiAxNnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtc21hbGw6IDIwcHg7XG4kZm9udC1saW5lLWhlaWdodC1tZWRpdW06IDI0cHg7XG4kZm9udC1saW5lLWhlaWdodC1sYXJnZTogMjhweDtcbiRmb250LWxpbmUtaGVpZ2h0LXgtbGFyZ2U6IDMycHg7XG4kZm9udC1saW5lLWhlaWdodC0yeC1sYXJnZTogNDBweDtcblxuLy8gV2VpZ2h0c1xuJGZvbnQtd2VpZ2h0LXJlZ3VsYXI6IDQwMDtcbiRmb250LXdlaWdodC1tZWRpdW06IDQ5OTsgLy8gZW5zdXJlcyBmYWxsYmFjayB0byA0MDAgKGluc3RlYWQgb2YgNjAwKVxuXG4vLyBGYW1pbGllc1xuJGZvbnQtZmFtaWx5LWhlYWRpbmdzOiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4kZm9udC1mYW1pbHktYm9keTogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LW1vbm86IE1lbmxvLCBDb25zb2xhcywgbW9uYWNvLCBtb25vc3BhY2U7XG5cbi8qKlxuICogR3JpZCBTeXN0ZW0uXG4gKiBodHRwczovL21ha2Uud29yZHByZXNzLm9yZy9kZXNpZ24vMjAxOS8xMC8zMS9wcm9wb3NhbC1hLWNvbnNpc3RlbnQtc3BhY2luZy1zeXN0ZW0tZm9yLXdvcmRwcmVzcy9cbiAqL1xuXG4kZ3JpZC11bml0OiA4cHg7XG4kZ3JpZC11bml0LTA1OiAwLjUgKiAkZ3JpZC11bml0O1x0Ly8gNHB4XG4kZ3JpZC11bml0LTEwOiAxICogJGdyaWQtdW5pdDtcdFx0Ly8gOHB4XG4kZ3JpZC11bml0LTE1OiAxLjUgKiAkZ3JpZC11bml0O1x0Ly8gMTJweFxuJGdyaWQtdW5pdC0yMDogMiAqICRncmlkLXVuaXQ7XHRcdC8vIDE2cHhcbiRncmlkLXVuaXQtMzA6IDMgKiAkZ3JpZC11bml0O1x0XHQvLyAyNHB4XG4kZ3JpZC11bml0LTQwOiA0ICogJGdyaWQtdW5pdDtcdFx0Ly8gMzJweFxuJGdyaWQtdW5pdC01MDogNSAqICRncmlkLXVuaXQ7XHRcdC8vIDQwcHhcbiRncmlkLXVuaXQtNjA6IDYgKiAkZ3JpZC11bml0O1x0XHQvLyA0OHB4XG4kZ3JpZC11bml0LTcwOiA3ICogJGdyaWQtdW5pdDtcdFx0Ly8gNTZweFxuJGdyaWQtdW5pdC04MDogOCAqICRncmlkLXVuaXQ7XHRcdC8vIDY0cHhcblxuLyoqXG4gKiBSYWRpdXMgc2NhbGUuXG4gKi9cblxuJHJhZGl1cy14LXNtYWxsOiAxcHg7ICAgLy8gQXBwbGllZCB0byBlbGVtZW50cyBsaWtlIGJ1dHRvbnMgbmVzdGVkIHdpdGhpbiBwcmltaXRpdmVzIGxpa2UgaW5wdXRzLlxuJHJhZGl1cy1zbWFsbDogMnB4OyAgICAgLy8gQXBwbGllZCB0byBtb3N0IHByaW1pdGl2ZXMuXG4kcmFkaXVzLW1lZGl1bTogNHB4OyAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBzbWFsbGVyIHBhZGRpbmcuXG4kcmFkaXVzLWxhcmdlOiA4cHg7ICAgICAvLyBBcHBsaWVkIHRvIGNvbnRhaW5lcnMgd2l0aCBsYXJnZXIgcGFkZGluZy5cbiRyYWRpdXMtZnVsbDogOTk5OXB4OyAgIC8vIEZvciBwaWxscy5cbiRyYWRpdXMtcm91bmQ6IDUwJTsgICAgIC8vIEZvciBjaXJjbGVzIGFuZCBvdmFscy5cblxuLyoqXG4gKiBFbGV2YXRpb24gc2NhbGUuXG4gKi9cblxuLy8gRm9yIHNlY3Rpb25zIGFuZCBjb250YWluZXJzIHRoYXQgZ3JvdXAgcmVsYXRlZCBjb250ZW50IGFuZCBjb250cm9scywgd2hpY2ggbWF5IG92ZXJsYXAgb3RoZXIgY29udGVudC4gRXhhbXBsZTogUHJldmlldyBGcmFtZS5cbiRlbGV2YXRpb24teC1zbWFsbDogMCAxcHggMXB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpLCAwIDNweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCA0cHggNHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMSk7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgcHJvdmlkZSBjb250ZXh0dWFsIGZlZWRiYWNrIHdpdGhvdXQgYmVpbmcgaW50cnVzaXZlLiBHZW5lcmFsbHkgbm9uLWludGVycnVwdGl2ZS4gRXhhbXBsZTogVG9vbHRpcHMsIFNuYWNrYmFyLlxuJGVsZXZhdGlvbi1zbWFsbDogMCAxcHggMnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDZweCA2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCA4cHggOHB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMik7XG5cbi8vIEZvciBjb21wb25lbnRzIHRoYXQgb2ZmZXIgYWRkaXRpb25hbCBhY3Rpb25zLiBFeGFtcGxlOiBNZW51cywgQ29tbWFuZCBQYWxldHRlXG4kZWxldmF0aW9uLW1lZGl1bTogMCAycHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wNSksIDAgNHB4IDVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDEycHggMTJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDE2cHggMTZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IGNvbmZpcm0gZGVjaXNpb25zIG9yIGhhbmRsZSBuZWNlc3NhcnkgaW50ZXJydXB0aW9ucy4gRXhhbXBsZTogTW9kYWxzLlxuJGVsZXZhdGlvbi1sYXJnZTogMCA1cHggMTVweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDgpLCAwIDE1cHggMjdweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDcpLCAwIDMwcHggMzZweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDQpLCAwIDUwcHggNDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vKipcbiAqIERpbWVuc2lvbnMuXG4gKi9cblxuJGljb24tc2l6ZTogMjRweDtcbiRidXR0b24tc2l6ZTogMzZweDtcbiRidXR0b24tc2l6ZS1uZXh0LWRlZmF1bHQtNDBweDogNDBweDsgLy8gdHJhbnNpdGlvbmFyeSB2YXJpYWJsZSBmb3IgbmV4dCBkZWZhdWx0IGJ1dHRvbiBzaXplXG4kYnV0dG9uLXNpemUtc21hbGw6IDI0cHg7XG4kYnV0dG9uLXNpemUtY29tcGFjdDogMzJweDtcbiRoZWFkZXItaGVpZ2h0OiA2NHB4O1xuJHBhbmVsLWhlYWRlci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kbmF2LXNpZGViYXItd2lkdGg6IDMwMHB4O1xuJGFkbWluLWJhci1oZWlnaHQ6IDMycHg7XG4kYWRtaW4tYmFyLWhlaWdodC1iaWc6IDQ2cHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aDogMTYwcHg7XG4kYWRtaW4tc2lkZWJhci13aWR0aC1iaWc6IDE5MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkOiAzNnB4O1xuJG1vZGFsLW1pbi13aWR0aDogMzUwcHg7XG4kbW9kYWwtd2lkdGgtc21hbGw6IDM4NHB4O1xuJG1vZGFsLXdpZHRoLW1lZGl1bTogNTEycHg7XG4kbW9kYWwtd2lkdGgtbGFyZ2U6IDg0MHB4O1xuJHNwaW5uZXItc2l6ZTogMTZweDtcbiRjYW52YXMtcGFkZGluZzogJGdyaWQtdW5pdC0yMDtcbiRwYWxldHRlLW1heC1oZWlnaHQ6IDM2OHB4O1xuXG4vKipcbiAqIE1vYmlsZSBzcGVjaWZpYyBzdHlsZXNcbiAqL1xuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemU6IDE2cHg7IC8vIEFueSBmb250IHNpemUgYmVsb3cgMTZweCB3aWxsIGNhdXNlIE1vYmlsZSBTYWZhcmkgdG8gXCJ6b29tIGluXCIuXG5cbi8qKlxuICogRWRpdG9yIHN0eWxlcy5cbiAqL1xuXG4kc2lkZWJhci13aWR0aDogMjgwcHg7XG4kY29udGVudC13aWR0aDogODQwcHg7XG4kd2lkZS1jb250ZW50LXdpZHRoOiAxMTAwcHg7XG4kd2lkZ2V0LWFyZWEtd2lkdGg6IDcwMHB4O1xuJHNlY29uZGFyeS1zaWRlYmFyLXdpZHRoOiAzNTBweDtcbiRlZGl0b3ItZm9udC1zaXplOiAxNnB4O1xuJGRlZmF1bHQtYmxvY2stbWFyZ2luOiAyOHB4OyAvLyBUaGlzIHZhbHVlIHByb3ZpZGVzIGEgY29uc2lzdGVudCwgY29udGlndW91cyBzcGFjaW5nIGJldHdlZW4gYmxvY2tzLlxuJHRleHQtZWRpdG9yLWZvbnQtc2l6ZTogMTVweDtcbiRlZGl0b3ItbGluZS1oZWlnaHQ6IDEuODtcbiRlZGl0b3ItaHRtbC1mb250OiAkZm9udC1mYW1pbHktbW9ubztcblxuLyoqXG4gKiBCbG9jayAmIEVkaXRvciBVSS5cbiAqL1xuXG4kYmxvY2stdG9vbGJhci1oZWlnaHQ6ICRncmlkLXVuaXQtNjA7XG4kYm9yZGVyLXdpZHRoOiAxcHg7XG4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrOiAycHg7IC8vIFRoaXMgZXhpc3RzIGFzIGEgZmFsbGJhY2ssIGFuZCBpcyBpZGVhbGx5IG92ZXJyaWRkZW4gYnkgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB1bmxlc3MgaW4gc29tZSBTQVNTIG1hdGggY2FzZXMuXG4kYm9yZGVyLXdpZHRoLXRhYjogMS41cHg7XG4kaGVscHRleHQtZm9udC1zaXplOiAxMnB4O1xuJHJhZGlvLWlucHV0LXNpemU6IDE2cHg7XG4kcmFkaW8taW5wdXQtc2l6ZS1zbTogMjRweDsgLy8gV2lkdGggJiBoZWlnaHQgZm9yIHNtYWxsIHZpZXdwb3J0cy5cblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGJsb2NrLXBhZGRpbmc6IDE0cHg7IC8vIFVzZWQgdG8gZGVmaW5lIHNwYWNlIGJldHdlZW4gYmxvY2sgZm9vdHByaW50IGFuZCBzdXJyb3VuZGluZyBib3JkZXJzLlxuJHJhZGl1cy1ibG9jay11aTogJHJhZGl1cy1zbWFsbDtcbiRzaGFkb3ctcG9wb3ZlcjogJGVsZXZhdGlvbi14LXNtYWxsO1xuJHNoYWRvdy1tb2RhbDogJGVsZXZhdGlvbi1sYXJnZTtcbiRkZWZhdWx0LWZvbnQtc2l6ZTogJGZvbnQtc2l6ZS1tZWRpdW07XG5cbi8qKlxuICogQmxvY2sgcGFkZGluZ3MuXG4gKi9cblxuLy8gUGFkZGluZyBmb3IgYmxvY2tzIHdpdGggYSBiYWNrZ3JvdW5kIGNvbG9yIChlLmcuIHBhcmFncmFwaCBvciBncm91cCkuXG4kYmxvY2stYmctcGFkZGluZy0tdjogMS4yNWVtO1xuJGJsb2NrLWJnLXBhZGRpbmctLWg6IDIuMzc1ZW07XG5cblxuLyoqXG4gKiBSZWFjdCBOYXRpdmUgc3BlY2lmaWMuXG4gKiBUaGVzZSB2YXJpYWJsZXMgZG8gbm90IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlIGVsc2UuXG4gKi9cblxuLy8gRGltZW5zaW9ucy5cbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1oZWFkZXItdG9vbGJhci1leHBhbmRlZC1oZWlnaHQ6IDUycHg7XG4kbW9iaWxlLWZsb2F0aW5nLXRvb2xiYXItaGVpZ2h0OiA0NHB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLW1hcmdpbjogOHB4O1xuJG1vYmlsZS1jb2xvci1zd2F0Y2g6IDQ4cHg7XG5cbi8vIEJsb2NrIFVJLlxuJG1vYmlsZS1ibG9jay10b29sYmFyLWhlaWdodDogNDRweDtcbiRkaW1tZWQtb3BhY2l0eTogMTtcbiRibG9jay1lZGdlLXRvLWNvbnRlbnQ6IDE2cHg7XG4kc29saWQtYm9yZGVyLXNwYWNlOiAxMnB4O1xuJGRhc2hlZC1ib3JkZXItc3BhY2U6IDZweDtcbiRibG9jay1zZWxlY3RlZC1tYXJnaW46IDNweDtcbiRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg6IDFweDtcbiRibG9jay1zZWxlY3RlZC1wYWRkaW5nOiAwO1xuJGJsb2NrLXNlbGVjdGVkLWNoaWxkLW1hcmdpbjogNXB4O1xuJGJsb2NrLXNlbGVjdGVkLXRvLWNvbnRlbnQ6ICRibG9jay1lZGdlLXRvLWNvbnRlbnQgLSAkYmxvY2stc2VsZWN0ZWQtbWFyZ2luIC0gJGJsb2NrLXNlbGVjdGVkLWJvcmRlci13aWR0aDtcbiIsIi8qKlxuICogQ29sb3JzXG4gKi9cblxuLy8gV29yZFByZXNzIGdyYXlzLlxuJGJsYWNrOiAjMDAwO1x0XHRcdC8vIFVzZSBvbmx5IHdoZW4geW91IHRydWx5IG5lZWQgcHVyZSBibGFjay4gRm9yIFVJLCB1c2UgJGdyYXktOTAwLlxuJGdyYXktOTAwOiAjMWUxZTFlO1xuJGdyYXktODAwOiAjMmYyZjJmO1xuJGdyYXktNzAwOiAjNzU3NTc1O1x0XHQvLyBNZWV0cyA0LjY6MSAoNC41OjEgaXMgbWluaW11bSkgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNjAwOiAjOTQ5NDk0O1x0XHQvLyBNZWV0cyAzOjEgVUkgb3IgbGFyZ2UgdGV4dCBjb250cmFzdCBhZ2FpbnN0IHdoaXRlLlxuJGdyYXktNDAwOiAjY2NjO1xuJGdyYXktMzAwOiAjZGRkO1x0XHQvLyBVc2VkIGZvciBtb3N0IGJvcmRlcnMuXG4kZ3JheS0yMDA6ICNlMGUwZTA7XHRcdC8vIFVzZWQgc3BhcmluZ2x5IGZvciBsaWdodCBib3JkZXJzLlxuJGdyYXktMTAwOiAjZjBmMGYwO1x0XHQvLyBVc2VkIGZvciBsaWdodCBncmF5IGJhY2tncm91bmRzLlxuJHdoaXRlOiAjZmZmO1xuXG4vLyBPcGFjaXRpZXMgJiBhZGRpdGlvbmFsIGNvbG9ycy5cbiRkYXJrLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjYyKTtcbiRtZWRpdW0tZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNTUpO1xuJGxpZ2h0LWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJHdoaXRlLCAwLjY1KTtcblxuLy8gQWxlcnQgY29sb3JzLlxuJGFsZXJ0LXllbGxvdzogI2YwYjg0OTtcbiRhbGVydC1yZWQ6ICNjYzE4MTg7XG4kYWxlcnQtZ3JlZW46ICM0YWI4NjY7XG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRkYXJrLXRoZW1lLWZvY3VzOiAkd2hpdGU7XHQvLyBGb2N1cyBjb2xvciB3aGVuIHRoZSB0aGVtZSBpcyBkYXJrLlxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvdmFyaWFibGVzXCI7XG5cbi5ib290LWxheW91dCB7XG5cdGhlaWdodDogMTAwJTtcblx0d2lkdGg6IDEwMCU7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiByb3c7XG5cdGNvbG9yOiB2YXIoLS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtbmV1dHJhbCwgIzFlMWUxZSk7XG5cdGlzb2xhdGlvbjogaXNvbGF0ZTtcblx0YmFja2dyb3VuZDogdmFyKC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLW5ldXRyYWwtd2VhaywgI2YwZjBmMCk7XG59XG5cbi5ib290LWxheW91dF9fc2lkZWJhciB7XG5cdGhlaWdodDogMTAwJTtcblx0ZmxleC1zaHJpbms6IDA7XG5cdHdpZHRoOiAyNDBweDtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuXG4uYm9vdC1sYXlvdXRfX3N1cmZhY2VzIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1ncm93OiAxO1xuXHRtYXJnaW46IHZhcmlhYmxlcy4kZ3JpZC11bml0LTEwO1xuXHRnYXA6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTEwO1xufVxuXG4uYm9vdC1sYXlvdXRfX3N0YWdlLFxuLmJvb3QtbGF5b3V0X19pbnNwZWN0b3IsXG4uYm9vdC1sYXlvdXRfX2NhbnZhcyB7XG5cdGZsZXg6IDE7XG5cdG92ZXJmbG93LXk6IGF1dG87XG5cdGJhY2tncm91bmQ6IHZhcigtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1uZXV0cmFsLCAjZmZmKTtcblx0Y29sb3I6IHZhcigtLXdwZHMtY29sb3ItZmctY29udGVudC1uZXV0cmFsLCAjMWUxZTFlKTtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHRib3gtc2hhZG93OiAwIDFweCAzcHggcmdiYSgwLCAwLCAwLCAwLjEpO1xuXHRib3JkZXI6IDFweCBzb2xpZCB2YXIoLS13cGRzLWNvbG9yLXN0cm9rZS1zdXJmYWNlLW5ldXRyYWwtd2VhaywgI2RkZCk7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmJvb3QtbGF5b3V0Lmhhcy1jYW52YXMgLmJvb3QtbGF5b3V0X19zdGFnZSxcbi5ib290LWxheW91dF9faW5zcGVjdG9yIHtcblx0bWF4LXdpZHRoOiA0MDBweDtcbn1cblxuLmJvb3QtbGF5b3V0X19jYW52YXMgLmludGVyZmFjZS1pbnRlcmZhY2Utc2tlbGV0b24ge1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cdGhlaWdodDogMTAwJTtcblx0dG9wOiAwICFpbXBvcnRhbnQ7XG5cdGxlZnQ6IDAgIWltcG9ydGFudDtcbn1cblxuLy8gRnVsbC1zY3JlZW4gY2FudmFzIG1vZGVcbi5ib290LWxheW91dC5oYXMtZnVsbC1jYW52YXMgLmJvb3QtbGF5b3V0X19zdXJmYWNlcyB7XG5cdG1hcmdpbjogMDtcblx0Z2FwOiAwO1xufVxuXG4uYm9vdC1sYXlvdXQuaGFzLWZ1bGwtY2FudmFzIC5ib290LWxheW91dF9fc3RhZ2UsXG4uYm9vdC1sYXlvdXQuaGFzLWZ1bGwtY2FudmFzIC5ib290LWxheW91dF9faW5zcGVjdG9yIHtcblx0ZGlzcGxheTogbm9uZTtcbn1cblxuLmJvb3QtbGF5b3V0Lmhhcy1mdWxsLWNhbnZhcyAuYm9vdC1sYXlvdXRfX2NhbnZhcyB7XG5cdHBvc2l0aW9uOiBmaXhlZDtcblx0dG9wOiAwO1xuXHRsZWZ0OiAwO1xuXHRyaWdodDogMDtcblx0Ym90dG9tOiAwO1xuXHRtYXgtd2lkdGg6IG5vbmU7XG5cdG1hcmdpbjogMDtcblx0Ym9yZGVyLXJhZGl1czogMDtcblx0Ym9yZGVyOiBub25lO1xuXHRib3gtc2hhZG93OiBub25lO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuIl19 */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css11 ) );
const { useMatches: useMatches3, Outlet: Outlet2 } = unlock( routePrivateApis6 );
const { ThemeProvider: ThemeProvider2 } = unlock( import_theme2.privateApis );
/**
 *
 */
function RootSinglePage() {
	const matches = useMatches3();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = currentMatch?.loaderData?.canvas;
	const routeContentModule = currentMatch?.loaderData?.routeContentModule;
	const isFullScreen = canvas && ! canvas.isPreview;
	return /* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( ThemeProvider2, {
		isRoot: true,
		color: { bg: '#f8f8f8', primary: '#3858e9' },
		children: /* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( ThemeProvider2, {
			color: { bg: '#1d2327', primary: '#3858e9' },
			children: /* @__PURE__ */ ( 0, import_jsx_runtime31.jsxs )( 'div', {
				className: clsx_default( 'boot-layout boot-layout--single-page', {
					'has-canvas': !! canvas || canvas === null,
					'has-full-canvas': isFullScreen,
				} ),
				children: [
					/* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( import_commands3.CommandMenu, {} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( SavePanel, {} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( import_editor5.EditorSnackbars, {} ),
					/* @__PURE__ */ ( 0, import_jsx_runtime31.jsxs )( 'div', {
						className: 'boot-layout__surfaces',
						children: [
							/* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( ThemeProvider2, {
								color: { bg: '#ffffff', primary: '#3858e9' },
								children: /* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( Outlet2, {} ),
							} ),
							( canvas || canvas === null ) &&
								/* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( 'div', {
									className: 'boot-layout__canvas',
									children: /* @__PURE__ */ ( 0, import_jsx_runtime31.jsx )( CanvasRenderer, {
										canvas,
										routeContentModule,
									} ),
								} ),
						],
					} ),
				],
			} ),
		} ),
	} );
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/components/app/index.js
const import_jsx_runtime32 = __toESM( require_jsx_runtime() );
/**
 *
 * @param root0
 * @param root0.rootComponent
 */
function App( { rootComponent } ) {
	const routes = ( 0, import_data9.useSelect )( select => select( store ).getRoutes(), [] );
	return /* @__PURE__ */ ( 0, import_jsx_runtime32.jsx )( Router, { routes, rootComponent } );
}
/**
 *
 * @param root0
 * @param root0.mountId
 * @param root0.menuItems
 * @param root0.routes
 * @param root0.initModules
 */
async function init( { mountId, menuItems, routes, initModules } ) {
	( menuItems ?? [] ).forEach( menuItem => {
		( 0, import_data9.dispatch )( store ).registerMenuItem( menuItem.id, menuItem );
	} );
	( routes ?? [] ).forEach( route => {
		( 0, import_data9.dispatch )( store ).registerRoute( route );
	} );
	for ( const moduleId of initModules ?? [] ) {
		const module = await import( moduleId );
		await module.init();
	}
	const rootElement = document.getElementById( mountId );
	if ( rootElement ) {
		const root = ( 0, import_element13.createRoot )( rootElement );
		root.render(
			/* @__PURE__ */ ( 0, import_jsx_runtime32.jsx )( import_element13.StrictMode, {
				children: /* @__PURE__ */ ( 0, import_jsx_runtime32.jsx )( App, {} ),
			} )
		);
	}
}
/**
 *
 * @param root0
 * @param root0.mountId
 * @param root0.routes
 */
async function initSinglePage( { mountId, routes } ) {
	( routes ?? [] ).forEach( route => {
		( 0, import_data9.dispatch )( store ).registerRoute( route );
	} );
	const rootElement = document.getElementById( mountId );
	if ( rootElement ) {
		const root = ( 0, import_element13.createRoot )( rootElement );
		root.render(
			/* @__PURE__ */ ( 0, import_jsx_runtime32.jsx )( import_element13.StrictMode, {
				children: /* @__PURE__ */ ( 0, import_jsx_runtime32.jsx )( App, {
					rootComponent: RootSinglePage,
				} ),
			} )
		);
	}
}

// ../../../node_modules/.pnpm/@wordpress+boot@0.3.1-next.8b30e05b0.0_@types+react-dom@18.3.7_@types+react@18.3.26__@t_0a6a079aa231211584d06e8a66dae4ea/node_modules/@wordpress/boot/build-module/index.js
const css12 = `@charset "UTF-8";
/* -------------------------------------------
 *  Autogenerated by \u26CB Terrazzo. DO NOT EDIT!
 * ------------------------------------------- */
:root {
  --wpds-border-radius-large: 8px; /* Large radius */
  --wpds-border-radius-medium: 4px; /* Medium radius */
  --wpds-border-radius-small: 2px; /* Small radius */
  --wpds-border-radius-x-small: 1px; /* Extra small radius */
  --wpds-border-width-focus: 2px; /* Border width for focus ring */
  --wpds-color-bg-interactive-brand: #00000000; /* Background color for interactive elements with brand tone and normal emphasis. */
  --wpds-color-bg-interactive-brand-active: #f6f8fc; /* Background color for interactive elements with brand tone and normal emphasis that are hovered, focused, or active. */
  --wpds-color-bg-interactive-brand-disabled: #e2e2e2; /* Background color for interactive elements with brand tone and normal emphasis, in their disabled state. */
  --wpds-color-bg-interactive-brand-strong: #3858e9; /* Background color for interactive elements with brand tone and strong emphasis. */
  --wpds-color-bg-interactive-brand-strong-active: #2e49d9; /* Background color for interactive elements with brand tone and strong emphasis that are hovered, focused, or active. */
  --wpds-color-bg-interactive-brand-strong-disabled: #d2d2d2; /* Background color for interactive elements with brand tone and strong emphasis, in their disabled state. */
  --wpds-color-bg-interactive-brand-weak: #00000000; /* Background color for interactive elements with brand tone and weak emphasis. */
  --wpds-color-bg-interactive-brand-weak-active: #e4eaf7; /* Background color for interactive elements with brand tone and weak emphasis that are hovered, focused, or active. */
  --wpds-color-bg-interactive-brand-weak-disabled: #e2e2e2; /* Background color for interactive elements with brand tone and weak emphasis, in their disabled state. */
  --wpds-color-bg-interactive-neutral: #00000000; /* Background color for interactive elements with neutral tone and normal emphasis. */
  --wpds-color-bg-interactive-neutral-active: #eaeaea; /* Background color for interactive elements with neutral tone and normal emphasis that are hovered, focused, or active. */
  --wpds-color-bg-interactive-neutral-disabled: #e2e2e2; /* Background color for interactive elements with neutral tone and normal emphasis, in their disabled state. */
  --wpds-color-bg-interactive-neutral-strong: #2d2d2d; /* Background color for interactive elements with neutral tone and strong emphasis. */
  --wpds-color-bg-interactive-neutral-strong-active: #1e1e1e; /* Background color for interactive elements with neutral tone and strong emphasis that are hovered, focused, or active. */
  --wpds-color-bg-interactive-neutral-strong-disabled: #d2d2d2; /* Background color for interactive elements with neutral tone and strong emphasis, in their disabled state. */
  --wpds-color-bg-interactive-neutral-weak: #00000000; /* Background color for interactive elements with neutral tone and weak emphasis. */
  --wpds-color-bg-interactive-neutral-weak-active: #eaeaea; /* Background color for interactive elements with neutral tone and weak emphasis that are hovered, focused, or active. */
  --wpds-color-bg-interactive-neutral-weak-disabled: #e2e2e2; /* Background color for interactive elements with neutral tone and weak emphasis, in their disabled state. */
  --wpds-color-bg-surface-brand: #ecf0f9; /* Background color for surfaces with brand tone and normal emphasis. */
  --wpds-color-bg-surface-caution: #f7eab3; /* Background color for surfaces with caution tone and normal emphasis. */
  --wpds-color-bg-surface-caution-weak: #fdf9e7; /* Background color for surfaces with caution tone and weak emphasis. */
  --wpds-color-bg-surface-error: #fae4e1; /* Background color for surfaces with error tone and normal emphasis. */
  --wpds-color-bg-surface-error-weak: #fdf6f5; /* Background color for surfaces with error tone and weak emphasis. */
  --wpds-color-bg-surface-info: #dfebf8; /* Background color for surfaces with info tone and normal emphasis. */
  --wpds-color-bg-surface-info-weak: #f5f9fd; /* Background color for surfaces with info tone and weak emphasis. */
  --wpds-color-bg-surface-neutral: #f8f8f8; /* Background color for surfaces with normal emphasis. */
  --wpds-color-bg-surface-neutral-strong: #ffffff; /* Background color for surfaces with strong emphasis. */
  --wpds-color-bg-surface-neutral-weak: #f0f0f0; /* Background color for surfaces with weak emphasis. */
  --wpds-color-bg-surface-success: #cbf5d1; /* Background color for surfaces with success tone and normal emphasis. */
  --wpds-color-bg-surface-success-weak: #f0fcf2; /* Background color for surfaces with success tone and weak emphasis. */
  --wpds-color-bg-surface-warning: #f8e8cc; /* Background color for surfaces with warning tone and normal emphasis. */
  --wpds-color-bg-surface-warning-weak: #fdf7ee; /* Background color for surfaces with warning tone and weak emphasis. */
  --wpds-color-bg-thumb-brand: #3858e9; /* Background color for thumbs with a brand tone and normal emphasis (eg. slider thumb and filled track). */
  --wpds-color-bg-thumb-brand-active: #3858e9; /* Background color for thumbs with a brand tone and normal emphasis (eg. slider thumb and filled track) that are hovered, focused, or active. */
  --wpds-color-bg-thumb-brand-disabled: #d8d8d8; /* Background color for thumbs with a brand tone and normal emphasis (eg. slider thumb and filled track), in their disabled state. */
  --wpds-color-bg-thumb-neutral-weak: #8a8a8a; /* Background color for thumbs with a neutral tone and weak emphasis (eg. scrollbar thumb). */
  --wpds-color-bg-thumb-neutral-weak-active: #6c6c6c; /* Background color for thumbs with a neutral tone and weak emphasis (eg. scrollbar thumb) that are hovered, focused, or active. */
  --wpds-color-bg-track-neutral: #d8d8d8; /* Background color for tracks with a neutral tone and normal emphasis (eg. slider or progressbar track). */
  --wpds-color-bg-track-neutral-weak: #e0e0e0; /* Background color for tracks with a neutral tone and weak emphasis (eg. scrollbar track). */
  --wpds-color-fg-content-caution: #281d00; /* Foreground color for content like text with caution tone and normal emphasis. */
  --wpds-color-fg-content-caution-weak: #836b00; /* Foreground color for content like text with caution tone and weak emphasis. */
  --wpds-color-fg-content-error: #470000; /* Foreground color for content like text with error tone and normal emphasis. */
  --wpds-color-fg-content-error-weak: #cc1818; /* Foreground color for content like text with error tone and weak emphasis. */
  --wpds-color-fg-content-info: #001b4f; /* Foreground color for content like text with info tone and normal emphasis. */
  --wpds-color-fg-content-info-weak: #006bd7; /* Foreground color for content like text with info tone and weak emphasis. */
  --wpds-color-fg-content-neutral: #1e1e1e; /* Foreground color for content like text with normal emphasis. */
  --wpds-color-fg-content-neutral-weak: #6d6d6d; /* Foreground color for content like text with weak emphasis. */
  --wpds-color-fg-content-success: #002900; /* Foreground color for content like text with success tone and normal emphasis. */
  --wpds-color-fg-content-success-weak: #007f30; /* Foreground color for content like text with success tone and weak emphasis. */
  --wpds-color-fg-content-warning: #2e1900; /* Foreground color for content like text with warning tone and normal emphasis. */
  --wpds-color-fg-content-warning-weak: #936400; /* Foreground color for content like text with warning tone and weak emphasis. */
  --wpds-color-fg-interactive-brand: #3858e9; /* Foreground color for interactive elements with brand tone and normal emphasis. */
  --wpds-color-fg-interactive-brand-active: #3858e9; /* Foreground color for interactive elements with brand tone and normal emphasis that are hovered, focused, or active. */
  --wpds-color-fg-interactive-brand-disabled: #8a8a8a; /* Foreground color for interactive elements with brand tone and normal emphasis, in their disabled state. */
  --wpds-color-fg-interactive-brand-strong: #eff0f2; /* Foreground color for interactive elements with brand tone and strong emphasis. */
  --wpds-color-fg-interactive-brand-strong-active: #eff0f2; /* Foreground color for interactive elements with brand tone and strong emphasis that are hovered, focused, or active. */
  --wpds-color-fg-interactive-brand-strong-disabled: #6d6d6d; /* Foreground color for interactive elements with brand tone and strong emphasis, in their disabled state. */
  --wpds-color-fg-interactive-neutral: #1e1e1e; /* Foreground color for interactive elements with neutral tone and normal emphasis. */
  --wpds-color-fg-interactive-neutral-active: #1e1e1e; /* Foreground color for interactive elements with neutral tone and normal emphasis that are hovered, focused, or active. */
  --wpds-color-fg-interactive-neutral-disabled: #8a8a8a; /* Foreground color for interactive elements with neutral tone and normal emphasis, in their disabled state. */
  --wpds-color-fg-interactive-neutral-strong: #f0f0f0; /* Foreground color for interactive elements with neutral tone and strong emphasis. */
  --wpds-color-fg-interactive-neutral-strong-active: #f0f0f0; /* Foreground color for interactive elements with neutral tone and strong emphasis that are hovered, focused, or active. */
  --wpds-color-fg-interactive-neutral-strong-disabled: #6d6d6d; /* Foreground color for interactive elements with neutral tone and strong emphasis, in their disabled state. */
  --wpds-color-fg-interactive-neutral-weak: #6d6d6d; /* Foreground color for interactive elements with neutral tone and weak emphasis. */
  --wpds-color-fg-interactive-neutral-weak-disabled: #8a8a8a; /* Foreground color for interactive elements with neutral tone and weak emphasis, in their disabled state. */
  --wpds-color-stroke-focus-brand: #3858e9; /* Accessible stroke color applied to focus rings. */
  --wpds-color-stroke-interactive-brand: #3858e9; /* Accessible stroke color used for interactive brand-toned elements with normal emphasis. */
  --wpds-color-stroke-interactive-brand-active: #2337c8; /* Accessible stroke color used for interactive brand-toned elements with normal emphasis that are hovered, focused, or active. */
  --wpds-color-stroke-interactive-brand-disabled: #d8d8d8; /* Accessible stroke color used for interactive brand-toned elements with normal emphasis, in their disabled state. */
  --wpds-color-stroke-interactive-error-strong: #cc1818; /* Accessible stroke color used for interactive error-toned elements with strong emphasis. */
  --wpds-color-stroke-interactive-neutral: #8a8a8a; /* Accessible stroke color used for interactive neutrally-toned elements with normal emphasis. */
  --wpds-color-stroke-interactive-neutral-active: #6c6c6c; /* Accessible stroke color used for interactive neutrally-toned elements with normal emphasis that are hovered, focused, or active. */
  --wpds-color-stroke-interactive-neutral-disabled: #d8d8d8; /* Accessible stroke color used for interactive neutrally-toned elements with normal emphasis, in their disabled state. */
  --wpds-color-stroke-interactive-neutral-strong: #6c6c6c; /* Accessible stroke color used for interactive neutrally-toned elements with strong emphasis. */
  --wpds-color-stroke-surface-brand: #a2b1d6; /* Decorative stroke color used to define brand-toned surface boundaries with normal emphasis. */
  --wpds-color-stroke-surface-brand-strong: #3858e9; /* Decorative stroke color used to define neutrally-toned surface boundaries with strong emphasis. */
  --wpds-color-stroke-surface-error: #e1a198; /* Decorative stroke color used to define error-toned surface boundaries with normal emphasis. */
  --wpds-color-stroke-surface-error-strong: #cc1818; /* Decorative stroke color used to define error-toned surface boundaries with strong emphasis. */
  --wpds-color-stroke-surface-info: #9fbcdd; /* Decorative stroke color used to define info-toned surface boundaries with normal emphasis. */
  --wpds-color-stroke-surface-info-strong: #006bd7; /* Decorative stroke color used to define info-toned surface boundaries with strong emphasis. */
  --wpds-color-stroke-surface-neutral: #d8d8d8; /* Decorative stroke color used to define neutrally-toned surface boundaries with normal emphasis. */
  --wpds-color-stroke-surface-neutral-strong: #8a8a8a; /* Decorative stroke color used to define neutrally-toned surface boundaries with strong emphasis. */
  --wpds-color-stroke-surface-neutral-weak: #e0e0e0; /* Decorative stroke color used to define neutrally-toned surface boundaries with weak emphasis. */
  --wpds-color-stroke-surface-success: #82c98f; /* Decorative stroke color used to define success-toned surface boundaries with normal emphasis. */
  --wpds-color-stroke-surface-success-strong: #007f30; /* Decorative stroke color used to define success-toned surface boundaries with strong emphasis. */
  --wpds-color-stroke-surface-warning: #d2b581; /* Decorative stroke color used to define warning-toned surface boundaries with normal emphasis. */
  --wpds-color-stroke-surface-warning-strong: #936400; /* Decorative stroke color used to define warning-toned surface boundaries with strong emphasis. */
  --wpds-dimension-base: 4px; /* Base dimension unit */
  --wpds-dimension-padding-surface-2xs: 4px; /* 2x extra small spacing for surfaces */
  --wpds-dimension-padding-surface-lg: 32px; /* Large spacing for surfaces */
  --wpds-dimension-padding-surface-md: 24px; /* Medium spacing for surfaces */
  --wpds-dimension-padding-surface-sm: 16px; /* Small spacing for surfaces */
  --wpds-dimension-padding-surface-xs: 8px; /* Extra small spacing for surfaces */
  --wpds-elevation-large: 0 5px 15px 0 #00000014, 0 15px 27px 0 #00000012,
  	0 30px 36px 0 #0000000a, 0 50px 43px 0 #00000005; /* For components that confirm decisions or handle necessary interruptions. Example: Modals. */
  --wpds-elevation-medium: 0 2px 3px 0 #0000000d, 0 4px 5px 0 #0000000a,
  	0 12px 12px 0 #00000008, 0 16px 16px 0 #00000005; /* For components that offer additional actions. Example: Menus, Command Palette */
  --wpds-elevation-small: 0 1px 2px 0 #0000000d, 0 2px 3px 0 #0000000a,
  	0 6px 6px 0 #00000008, 0 8px 8px 0 #00000005; /* For components that provide contextual feedback without being intrusive. Generally non-interruptive. Example: Tooltips, Snackbar. */
  --wpds-elevation-x-small: 0 1px 1px 0 #00000008, 0 1px 2px 0 #00000005,
  	0 3px 3px 0 #00000005, 0 4px 4px 0 #00000003; /* For sections and containers that group related content and controls, which may overlap other content. Example: Preview Frame. */
  --wpds-font-family-body: -apple-system, system-ui, "Segoe UI", "Roboto",
  	"Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif; /* Body font family */
  --wpds-font-family-heading: -apple-system, system-ui, "Segoe UI", "Roboto",
  	"Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif; /* Headings font family */
  --wpds-font-family-mono: "Menlo", "Consolas", monaco, monospace; /* Monospace font family */
  --wpds-font-line-height-2x-large: 40px; /* 2X large line height */
  --wpds-font-line-height-large: 28px; /* Large line height */
  --wpds-font-line-height-medium: 24px; /* Medium line height */
  --wpds-font-line-height-small: 20px; /* Small line height */
  --wpds-font-line-height-x-large: 32px; /* Extra large line height */
  --wpds-font-line-height-x-small: 16px; /* Extra small line height */
  --wpds-font-size-2x-large: 32px; /* 2X large font size */
  --wpds-font-size-large: 15px; /* Large font size */
  --wpds-font-size-medium: 13px; /* Medium font size */
  --wpds-font-size-small: 12px; /* Small font size */
  --wpds-font-size-x-large: 20px; /* Extra large font size */
  --wpds-font-size-x-small: 11px; /* Extra small font size */
}

[data-wpds-theme-provider-id][data-wpds-density=default] {
  --wpds-dimension-base: 4px; /* Base dimension unit */
  --wpds-dimension-padding-surface-2xs: 4px; /* 2x extra small spacing for surfaces */
  --wpds-dimension-padding-surface-lg: 32px; /* Large spacing for surfaces */
  --wpds-dimension-padding-surface-md: 24px; /* Medium spacing for surfaces */
  --wpds-dimension-padding-surface-sm: 16px; /* Small spacing for surfaces */
  --wpds-dimension-padding-surface-xs: 8px; /* Extra small spacing for surfaces */
}

[data-wpds-theme-provider-id][data-wpds-density=compact] {
  --wpds-dimension-padding-surface-2xs: 4px; /* 2x extra small spacing for surfaces */
  --wpds-dimension-padding-surface-lg: 24px; /* Large spacing for surfaces */
  --wpds-dimension-padding-surface-md: 20px; /* Medium spacing for surfaces */
  --wpds-dimension-padding-surface-sm: 12px; /* Small spacing for surfaces */
  --wpds-dimension-padding-surface-xs: 4px; /* Extra small spacing for surfaces */
}

[data-wpds-theme-provider-id][data-wpds-density=comfortable] {
  --wpds-dimension-padding-surface-2xs: 8px; /* 2x extra small spacing for surfaces */
  --wpds-dimension-padding-surface-lg: 40px; /* Large spacing for surfaces */
  --wpds-dimension-padding-surface-md: 32px; /* Medium spacing for surfaces */
  --wpds-dimension-padding-surface-sm: 20px; /* Small spacing for surfaces */
  --wpds-dimension-padding-surface-xs: 12px; /* Extra small spacing for surfaces */
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  :root {
    --wpds-border-width-focus: 1.5px; /* Border width for focus ring */
  }
}
/**
 * Colors
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Typography
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
.admin-ui-page {
  display: flex;
  height: 100%;
  background-color: #fff;
  color: #2f2f2f;
  position: relative;
  z-index: 1;
  flex-flow: column;
  container: admin-ui-page/inline-size;
}

@media not (prefers-reduced-motion) {
  .admin-ui-page {
    transition: width ease-out 0.2s;
  }
}
.admin-ui-page__header {
  padding: 16px 48px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  position: sticky;
  top: 0;
}

@container (max-width: 430px) {
  .admin-ui-page__header {
    padding: 16px 24px;
  }
}
.admin-ui-page__header-subtitle {
  padding-block-end: 8px;
  color: #757575;
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-weight: 400;
  font-size: 13px;
  line-height: 20px;
  margin: 0;
}

.admin-ui-page__content {
  flex-grow: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.admin-ui-page__content.has-padding {
  padding: 16px 20px;
}

@container (max-width: 430px) {
  .admin-ui-page__content.has-padding {
    padding: 16px 24px;
  }
}
.show-icon-labels .admin-ui-page__header-actions .components-button.has-icon {
  width: auto;
  padding: 0 8px;
}

.show-icon-labels .admin-ui-page__header-actions .components-button.has-icon svg {
  display: none;
}

.show-icon-labels .admin-ui-page__header-actions .components-button.has-icon::after {
  content: attr(aria-label);
  font-size: 12px;
}

.admin-ui-breadcrumbs__list {
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 0;
  font-size: 15px;
  min-height: 32px;
  font-weight: 500;
}

.admin-ui-breadcrumbs__list li:not(:last-child)::after {
  content: "/";
  margin: 0 8px;
}

.admin-ui-breadcrumbs__list h1 {
  font-size: inherit;
  line-height: inherit;
}

/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
.boot-layout-container .boot-layout {
  height: calc(100vh - 32px);
}

body:has(.boot-layout-container) {
  background: #1d2327;
  overflow: hidden;
}

#wpcontent {
  padding-left: 0;
}

#wpbody-content {
  padding-bottom: 0;
}

#wpfooter {
  display: none;
}

@media (min-width: 782px) {
  body:has(.boot-layout.has-full-canvas) {
    margin-top: -32px;
    height: calc(100% + 32px);
  }
  body:has(.boot-layout.has-full-canvas) #adminmenumain,
  body:has(.boot-layout.has-full-canvas) #wpadminbar {
    display: none;
  }
  body:has(.boot-layout.has-full-canvas) #wpcontent,
  body:has(.boot-layout.has-full-canvas) #wpfooter {
    margin-left: 0;
  }
}

.boot-layout .components-editor-notices__snackbar {
  position: fixed;
  right: 0;
  bottom: 16px;
  padding-left: 16px;
  padding-right: 16px;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy90aGVtZS9zcmMvcHJlYnVpbHQvY3NzL2Rlc2lnbi10b2tlbnMuY3NzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYWRtaW4tdWkvYnVpbGQtc3R5bGUvc3R5bGUuY3NzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX21peGlucy5zY3NzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX3ZhcmlhYmxlcy5zY3NzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2NvbG9ycy5zY3NzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3b3JkcHJlc3MvYmFzZS1zdHlsZXMvX2JyZWFrcG9pbnRzLnNjc3MiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fZnVuY3Rpb25zLnNjc3MiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fbG9uZy1jb250ZW50LWZhZGUuc2NzcyIsInN0eWxlLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQUE7QUFBQTtBQUlBO0VBQ0M7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0FBQUEscURBQ21EO0VBQ25EO0FBQUEscURBQ21EO0VBQ25EO0FBQUEsaURBQytDO0VBQy9DO0FBQUEsaURBQytDO0VBQy9DO0FBQUEsdUVBQ3FFO0VBQ3JFO0FBQUEsdUVBQ3FFO0VBQ3JFO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFHRDtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7O0FBR0Q7RUFDQztFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFHRDtFQUNDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztBQUdEO0VBQ0M7SUFDQzs7O0FDN0pGO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBT0E7QUFBQTtBQUFBO0FBR0E7QUFBQTtBQUFBO0FBR0E7QUFBQTtBQUFBO0FBQUE7QUFJQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFHQTtBQUFBO0FBQUE7QUFBQTtBQUlBO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQU1BO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQU1BO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUdBO0FBQUE7QUFBQTtBQUFBO0FBSUE7QUFBQTtBQUFBO0FBR0E7RUFDRTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFFRjtFQUNFO0lBQ0U7OztBQUlKO0VBQ0U7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7O0FBRUY7RUFDRTtJQUNFOzs7QUFJSjtFQUNFO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFHRjtFQUNFO0VBQ0E7RUFDQTtFQUNBOzs7QUFFRjtFQUNFOzs7QUFFRjtFQUNFO0lBQ0U7OztBQUlKO0VBQ0U7RUFDQTs7O0FBRUY7RUFDRTs7O0FBRUY7RUFDRTtFQUNBOzs7QUFHRjtFQUNFO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFFRjtFQUNFO0VBQ0E7OztBQUVGO0VBQ0U7RUFDQTs7O0FDdEtGO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FDQUE7QUFBQTtBQUFBO0FEVUE7QUFBQTtBQUFBO0FBT0E7QUFBQTtBQUFBO0FBNkJBO0FBQUE7QUFBQTtBQUFBO0FBaUJBO0FBQUE7QUFBQTtBQVdBO0FBQUE7QUFBQTtBQWdCQTtBQUFBO0FBQUE7QUF5QkE7QUFBQTtBQUFBO0FBS0E7QUFBQTtBQUFBO0FBZUE7QUFBQTtBQUFBO0FBbUJBO0FBQUE7QUFBQTtBQVNBO0FBQUE7QUFBQTtBQUFBO0FFbktBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQ0FBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBTDRFQTtBQUFBO0FBQUE7QUEwREE7QUFBQTtBQUFBO0FBZ0RBO0FBQUE7QUFBQTtBQXFDQTtBQUFBO0FBQUE7QUFvQkE7QUFBQTtBQUFBO0FBd0xBO0FBQUE7QUFBQTtBQUFBO0FBZ0RBO0FBQUE7QUFBQTtBTWpkQTtFQUNDOzs7QUFHRDtFQUNDO0VBQ0E7OztBQUdEO0VBQ0M7OztBQUdEO0VBQ0M7OztBQUdEO0VBQ0M7OztBTnVGQTtFTXBGRDtJQUlFO0lBQ0E7O0VBRUE7QUFBQTtJQUVDOztFQUdEO0FBQUE7SUFFQzs7OztBQUtIO0VBQ0M7RUFDQTtFQUNBO0VBQ0E7RUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBBdXRvZ2VuZXJhdGVkIGJ5IOKbiyBUZXJyYXp6by4gRE8gTk9UIEVESVQhXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbjpyb290IHtcblx0LS13cGRzLWJvcmRlci1yYWRpdXMtbGFyZ2U6IDhweDsgLyogTGFyZ2UgcmFkaXVzICovXG5cdC0td3Bkcy1ib3JkZXItcmFkaXVzLW1lZGl1bTogNHB4OyAvKiBNZWRpdW0gcmFkaXVzICovXG5cdC0td3Bkcy1ib3JkZXItcmFkaXVzLXNtYWxsOiAycHg7IC8qIFNtYWxsIHJhZGl1cyAqL1xuXHQtLXdwZHMtYm9yZGVyLXJhZGl1cy14LXNtYWxsOiAxcHg7IC8qIEV4dHJhIHNtYWxsIHJhZGl1cyAqL1xuXHQtLXdwZHMtYm9yZGVyLXdpZHRoLWZvY3VzOiAycHg7IC8qIEJvcmRlciB3aWR0aCBmb3IgZm9jdXMgcmluZyAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtYnJhbmQ6ICMwMDAwMDAwMDsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBicmFuZCB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1iZy1pbnRlcmFjdGl2ZS1icmFuZC1hY3RpdmU6ICNmNmY4ZmM7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggYnJhbmQgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzIHRoYXQgYXJlIGhvdmVyZWQsIGZvY3VzZWQsIG9yIGFjdGl2ZS4gKi9cblx0LS13cGRzLWNvbG9yLWJnLWludGVyYWN0aXZlLWJyYW5kLWRpc2FibGVkOiAjZTJlMmUyOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIGJyYW5kIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcywgaW4gdGhlaXIgZGlzYWJsZWQgc3RhdGUuICovXG5cdC0td3Bkcy1jb2xvci1iZy1pbnRlcmFjdGl2ZS1icmFuZC1zdHJvbmc6ICMzODU4ZTk7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggYnJhbmQgdG9uZSBhbmQgc3Ryb25nIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtYnJhbmQtc3Ryb25nLWFjdGl2ZTogIzJlNDlkOTsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBicmFuZCB0b25lIGFuZCBzdHJvbmcgZW1waGFzaXMgdGhhdCBhcmUgaG92ZXJlZCwgZm9jdXNlZCwgb3IgYWN0aXZlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtYnJhbmQtc3Ryb25nLWRpc2FibGVkOiAjZDJkMmQyOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIGJyYW5kIHRvbmUgYW5kIHN0cm9uZyBlbXBoYXNpcywgaW4gdGhlaXIgZGlzYWJsZWQgc3RhdGUuICovXG5cdC0td3Bkcy1jb2xvci1iZy1pbnRlcmFjdGl2ZS1icmFuZC13ZWFrOiAjMDAwMDAwMDA7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggYnJhbmQgdG9uZSBhbmQgd2VhayBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWJnLWludGVyYWN0aXZlLWJyYW5kLXdlYWstYWN0aXZlOiAjZTRlYWY3OyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIGJyYW5kIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMgdGhhdCBhcmUgaG92ZXJlZCwgZm9jdXNlZCwgb3IgYWN0aXZlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtYnJhbmQtd2Vhay1kaXNhYmxlZDogI2UyZTJlMjsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBicmFuZCB0b25lIGFuZCB3ZWFrIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLWJnLWludGVyYWN0aXZlLW5ldXRyYWw6ICMwMDAwMDAwMDsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBuZXV0cmFsIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWJnLWludGVyYWN0aXZlLW5ldXRyYWwtYWN0aXZlOiAjZWFlYWVhOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIG5ldXRyYWwgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzIHRoYXQgYXJlIGhvdmVyZWQsIGZvY3VzZWQsIG9yIGFjdGl2ZS4gKi9cblx0LS13cGRzLWNvbG9yLWJnLWludGVyYWN0aXZlLW5ldXRyYWwtZGlzYWJsZWQ6ICNlMmUyZTI7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMsIGluIHRoZWlyIGRpc2FibGVkIHN0YXRlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtbmV1dHJhbC1zdHJvbmc6ICMyZDJkMmQ7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1iZy1pbnRlcmFjdGl2ZS1uZXV0cmFsLXN0cm9uZy1hY3RpdmU6ICMxZTFlMWU7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCBzdHJvbmcgZW1waGFzaXMgdGhhdCBhcmUgaG92ZXJlZCwgZm9jdXNlZCwgb3IgYWN0aXZlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtbmV1dHJhbC1zdHJvbmctZGlzYWJsZWQ6ICNkMmQyZDI7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCBzdHJvbmcgZW1waGFzaXMsIGluIHRoZWlyIGRpc2FibGVkIHN0YXRlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtbmV1dHJhbC13ZWFrOiAjMDAwMDAwMDA7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCB3ZWFrIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtbmV1dHJhbC13ZWFrLWFjdGl2ZTogI2VhZWFlYTsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBuZXV0cmFsIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMgdGhhdCBhcmUgaG92ZXJlZCwgZm9jdXNlZCwgb3IgYWN0aXZlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctaW50ZXJhY3RpdmUtbmV1dHJhbC13ZWFrLWRpc2FibGVkOiAjZTJlMmUyOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIG5ldXRyYWwgdG9uZSBhbmQgd2VhayBlbXBoYXNpcywgaW4gdGhlaXIgZGlzYWJsZWQgc3RhdGUuICovXG5cdC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLWJyYW5kOiAjZWNmMGY5OyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBzdXJmYWNlcyB3aXRoIGJyYW5kIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWJnLXN1cmZhY2UtY2F1dGlvbjogI2Y3ZWFiMzsgLyogQmFja2dyb3VuZCBjb2xvciBmb3Igc3VyZmFjZXMgd2l0aCBjYXV0aW9uIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWJnLXN1cmZhY2UtY2F1dGlvbi13ZWFrOiAjZmRmOWU3OyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBzdXJmYWNlcyB3aXRoIGNhdXRpb24gdG9uZSBhbmQgd2VhayBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWJnLXN1cmZhY2UtZXJyb3I6ICNmYWU0ZTE7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHN1cmZhY2VzIHdpdGggZXJyb3IgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1lcnJvci13ZWFrOiAjZmRmNmY1OyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBzdXJmYWNlcyB3aXRoIGVycm9yIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLWluZm86ICNkZmViZjg7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHN1cmZhY2VzIHdpdGggaW5mbyB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLWluZm8td2VhazogI2Y1ZjlmZDsgLyogQmFja2dyb3VuZCBjb2xvciBmb3Igc3VyZmFjZXMgd2l0aCBpbmZvIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLW5ldXRyYWw6ICNmOGY4Zjg7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHN1cmZhY2VzIHdpdGggbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1uZXV0cmFsLXN0cm9uZzogI2ZmZmZmZjsgLyogQmFja2dyb3VuZCBjb2xvciBmb3Igc3VyZmFjZXMgd2l0aCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1iZy1zdXJmYWNlLW5ldXRyYWwtd2VhazogI2YwZjBmMDsgLyogQmFja2dyb3VuZCBjb2xvciBmb3Igc3VyZmFjZXMgd2l0aCB3ZWFrIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1zdWNjZXNzOiAjY2JmNWQxOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBzdXJmYWNlcyB3aXRoIHN1Y2Nlc3MgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctc3VyZmFjZS1zdWNjZXNzLXdlYWs6ICNmMGZjZjI7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHN1cmZhY2VzIHdpdGggc3VjY2VzcyB0b25lIGFuZCB3ZWFrIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctc3VyZmFjZS13YXJuaW5nOiAjZjhlOGNjOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciBzdXJmYWNlcyB3aXRoIHdhcm5pbmcgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctc3VyZmFjZS13YXJuaW5nLXdlYWs6ICNmZGY3ZWU7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHN1cmZhY2VzIHdpdGggd2FybmluZyB0b25lIGFuZCB3ZWFrIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctdGh1bWItYnJhbmQ6ICMzODU4ZTk7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHRodW1icyB3aXRoIGEgYnJhbmQgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzIChlZy4gc2xpZGVyIHRodW1iIGFuZCBmaWxsZWQgdHJhY2spLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctdGh1bWItYnJhbmQtYWN0aXZlOiAjMzg1OGU5OyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciB0aHVtYnMgd2l0aCBhIGJyYW5kIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcyAoZWcuIHNsaWRlciB0aHVtYiBhbmQgZmlsbGVkIHRyYWNrKSB0aGF0IGFyZSBob3ZlcmVkLCBmb2N1c2VkLCBvciBhY3RpdmUuICovXG5cdC0td3Bkcy1jb2xvci1iZy10aHVtYi1icmFuZC1kaXNhYmxlZDogI2Q4ZDhkODsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgdGh1bWJzIHdpdGggYSBicmFuZCB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMgKGVnLiBzbGlkZXIgdGh1bWIgYW5kIGZpbGxlZCB0cmFjayksIGluIHRoZWlyIGRpc2FibGVkIHN0YXRlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctdGh1bWItbmV1dHJhbC13ZWFrOiAjOGE4YThhOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciB0aHVtYnMgd2l0aCBhIG5ldXRyYWwgdG9uZSBhbmQgd2VhayBlbXBoYXNpcyAoZWcuIHNjcm9sbGJhciB0aHVtYikuICovXG5cdC0td3Bkcy1jb2xvci1iZy10aHVtYi1uZXV0cmFsLXdlYWstYWN0aXZlOiAjNmM2YzZjOyAvKiBCYWNrZ3JvdW5kIGNvbG9yIGZvciB0aHVtYnMgd2l0aCBhIG5ldXRyYWwgdG9uZSBhbmQgd2VhayBlbXBoYXNpcyAoZWcuIHNjcm9sbGJhciB0aHVtYikgdGhhdCBhcmUgaG92ZXJlZCwgZm9jdXNlZCwgb3IgYWN0aXZlLiAqL1xuXHQtLXdwZHMtY29sb3ItYmctdHJhY2stbmV1dHJhbDogI2Q4ZDhkODsgLyogQmFja2dyb3VuZCBjb2xvciBmb3IgdHJhY2tzIHdpdGggYSBuZXV0cmFsIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcyAoZWcuIHNsaWRlciBvciBwcm9ncmVzc2JhciB0cmFjaykuICovXG5cdC0td3Bkcy1jb2xvci1iZy10cmFjay1uZXV0cmFsLXdlYWs6ICNlMGUwZTA7IC8qIEJhY2tncm91bmQgY29sb3IgZm9yIHRyYWNrcyB3aXRoIGEgbmV1dHJhbCB0b25lIGFuZCB3ZWFrIGVtcGhhc2lzIChlZy4gc2Nyb2xsYmFyIHRyYWNrKS4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtY2F1dGlvbjogIzI4MWQwMDsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgY29udGVudCBsaWtlIHRleHQgd2l0aCBjYXV0aW9uIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtY2F1dGlvbi13ZWFrOiAjODM2YjAwOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBjb250ZW50IGxpa2UgdGV4dCB3aXRoIGNhdXRpb24gdG9uZSBhbmQgd2VhayBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtZXJyb3I6ICM0NzAwMDA7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGNvbnRlbnQgbGlrZSB0ZXh0IHdpdGggZXJyb3IgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItZmctY29udGVudC1lcnJvci13ZWFrOiAjY2MxODE4OyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBjb250ZW50IGxpa2UgdGV4dCB3aXRoIGVycm9yIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1mZy1jb250ZW50LWluZm86ICMwMDFiNGY7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGNvbnRlbnQgbGlrZSB0ZXh0IHdpdGggaW5mbyB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1mZy1jb250ZW50LWluZm8td2VhazogIzAwNmJkNzsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgY29udGVudCBsaWtlIHRleHQgd2l0aCBpbmZvIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1mZy1jb250ZW50LW5ldXRyYWw6ICMxZTFlMWU7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGNvbnRlbnQgbGlrZSB0ZXh0IHdpdGggbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItZmctY29udGVudC1uZXV0cmFsLXdlYWs6ICM2ZDZkNmQ7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGNvbnRlbnQgbGlrZSB0ZXh0IHdpdGggd2VhayBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtc3VjY2VzczogIzAwMjkwMDsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgY29udGVudCBsaWtlIHRleHQgd2l0aCBzdWNjZXNzIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtc3VjY2Vzcy13ZWFrOiAjMDA3ZjMwOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBjb250ZW50IGxpa2UgdGV4dCB3aXRoIHN1Y2Nlc3MgdG9uZSBhbmQgd2VhayBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtd2FybmluZzogIzJlMTkwMDsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgY29udGVudCBsaWtlIHRleHQgd2l0aCB3YXJuaW5nIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWNvbnRlbnQtd2FybmluZy13ZWFrOiAjOTM2NDAwOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBjb250ZW50IGxpa2UgdGV4dCB3aXRoIHdhcm5pbmcgdG9uZSBhbmQgd2VhayBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLWJyYW5kOiAjMzg1OGU5OyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIGJyYW5kIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLWJyYW5kLWFjdGl2ZTogIzM4NThlOTsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBicmFuZCB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMgdGhhdCBhcmUgaG92ZXJlZCwgZm9jdXNlZCwgb3IgYWN0aXZlLiAqL1xuXHQtLXdwZHMtY29sb3ItZmctaW50ZXJhY3RpdmUtYnJhbmQtZGlzYWJsZWQ6ICM4YThhOGE7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggYnJhbmQgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLWJyYW5kLXN0cm9uZzogI2VmZjBmMjsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBicmFuZCB0b25lIGFuZCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1mZy1pbnRlcmFjdGl2ZS1icmFuZC1zdHJvbmctYWN0aXZlOiAjZWZmMGYyOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIGJyYW5kIHRvbmUgYW5kIHN0cm9uZyBlbXBoYXNpcyB0aGF0IGFyZSBob3ZlcmVkLCBmb2N1c2VkLCBvciBhY3RpdmUuICovXG5cdC0td3Bkcy1jb2xvci1mZy1pbnRlcmFjdGl2ZS1icmFuZC1zdHJvbmctZGlzYWJsZWQ6ICM2ZDZkNmQ7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggYnJhbmQgdG9uZSBhbmQgc3Ryb25nIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLW5ldXRyYWw6ICMxZTFlMWU7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1mZy1pbnRlcmFjdGl2ZS1uZXV0cmFsLWFjdGl2ZTogIzFlMWUxZTsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBuZXV0cmFsIHRvbmUgYW5kIG5vcm1hbCBlbXBoYXNpcyB0aGF0IGFyZSBob3ZlcmVkLCBmb2N1c2VkLCBvciBhY3RpdmUuICovXG5cdC0td3Bkcy1jb2xvci1mZy1pbnRlcmFjdGl2ZS1uZXV0cmFsLWRpc2FibGVkOiAjOGE4YThhOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIG5ldXRyYWwgdG9uZSBhbmQgbm9ybWFsIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLW5ldXRyYWwtc3Ryb25nOiAjZjBmMGYwOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIG5ldXRyYWwgdG9uZSBhbmQgc3Ryb25nIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3ItZmctaW50ZXJhY3RpdmUtbmV1dHJhbC1zdHJvbmctYWN0aXZlOiAjZjBmMGYwOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIG5ldXRyYWwgdG9uZSBhbmQgc3Ryb25nIGVtcGhhc2lzIHRoYXQgYXJlIGhvdmVyZWQsIGZvY3VzZWQsIG9yIGFjdGl2ZS4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLW5ldXRyYWwtc3Ryb25nLWRpc2FibGVkOiAjNmQ2ZDZkOyAvKiBGb3JlZ3JvdW5kIGNvbG9yIGZvciBpbnRlcmFjdGl2ZSBlbGVtZW50cyB3aXRoIG5ldXRyYWwgdG9uZSBhbmQgc3Ryb25nIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLWZnLWludGVyYWN0aXZlLW5ldXRyYWwtd2VhazogIzZkNmQ2ZDsgLyogRm9yZWdyb3VuZCBjb2xvciBmb3IgaW50ZXJhY3RpdmUgZWxlbWVudHMgd2l0aCBuZXV0cmFsIHRvbmUgYW5kIHdlYWsgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1mZy1pbnRlcmFjdGl2ZS1uZXV0cmFsLXdlYWstZGlzYWJsZWQ6ICM4YThhOGE7IC8qIEZvcmVncm91bmQgY29sb3IgZm9yIGludGVyYWN0aXZlIGVsZW1lbnRzIHdpdGggbmV1dHJhbCB0b25lIGFuZCB3ZWFrIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1mb2N1cy1icmFuZDogIzM4NThlOTsgLyogQWNjZXNzaWJsZSBzdHJva2UgY29sb3IgYXBwbGllZCB0byBmb2N1cyByaW5ncy4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1pbnRlcmFjdGl2ZS1icmFuZDogIzM4NThlOTsgLyogQWNjZXNzaWJsZSBzdHJva2UgY29sb3IgdXNlZCBmb3IgaW50ZXJhY3RpdmUgYnJhbmQtdG9uZWQgZWxlbWVudHMgd2l0aCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2UtaW50ZXJhY3RpdmUtYnJhbmQtYWN0aXZlOiAjMjMzN2M4OyAvKiBBY2Nlc3NpYmxlIHN0cm9rZSBjb2xvciB1c2VkIGZvciBpbnRlcmFjdGl2ZSBicmFuZC10b25lZCBlbGVtZW50cyB3aXRoIG5vcm1hbCBlbXBoYXNpcyB0aGF0IGFyZSBob3ZlcmVkLCBmb2N1c2VkLCBvciBhY3RpdmUuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2UtaW50ZXJhY3RpdmUtYnJhbmQtZGlzYWJsZWQ6ICNkOGQ4ZDg7IC8qIEFjY2Vzc2libGUgc3Ryb2tlIGNvbG9yIHVzZWQgZm9yIGludGVyYWN0aXZlIGJyYW5kLXRvbmVkIGVsZW1lbnRzIHdpdGggbm9ybWFsIGVtcGhhc2lzLCBpbiB0aGVpciBkaXNhYmxlZCBzdGF0ZS4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1pbnRlcmFjdGl2ZS1lcnJvci1zdHJvbmc6ICNjYzE4MTg7IC8qIEFjY2Vzc2libGUgc3Ryb2tlIGNvbG9yIHVzZWQgZm9yIGludGVyYWN0aXZlIGVycm9yLXRvbmVkIGVsZW1lbnRzIHdpdGggc3Ryb25nIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLWludGVyYWN0aXZlLW5ldXRyYWw6ICM4YThhOGE7IC8qIEFjY2Vzc2libGUgc3Ryb2tlIGNvbG9yIHVzZWQgZm9yIGludGVyYWN0aXZlIG5ldXRyYWxseS10b25lZCBlbGVtZW50cyB3aXRoIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1pbnRlcmFjdGl2ZS1uZXV0cmFsLWFjdGl2ZTogIzZjNmM2YzsgLyogQWNjZXNzaWJsZSBzdHJva2UgY29sb3IgdXNlZCBmb3IgaW50ZXJhY3RpdmUgbmV1dHJhbGx5LXRvbmVkIGVsZW1lbnRzIHdpdGggbm9ybWFsIGVtcGhhc2lzIHRoYXQgYXJlIGhvdmVyZWQsIGZvY3VzZWQsIG9yIGFjdGl2ZS4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1pbnRlcmFjdGl2ZS1uZXV0cmFsLWRpc2FibGVkOiAjZDhkOGQ4OyAvKiBBY2Nlc3NpYmxlIHN0cm9rZSBjb2xvciB1c2VkIGZvciBpbnRlcmFjdGl2ZSBuZXV0cmFsbHktdG9uZWQgZWxlbWVudHMgd2l0aCBub3JtYWwgZW1waGFzaXMsIGluIHRoZWlyIGRpc2FibGVkIHN0YXRlLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLWludGVyYWN0aXZlLW5ldXRyYWwtc3Ryb25nOiAjNmM2YzZjOyAvKiBBY2Nlc3NpYmxlIHN0cm9rZSBjb2xvciB1c2VkIGZvciBpbnRlcmFjdGl2ZSBuZXV0cmFsbHktdG9uZWQgZWxlbWVudHMgd2l0aCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2Utc3VyZmFjZS1icmFuZDogI2EyYjFkNjsgLyogRGVjb3JhdGl2ZSBzdHJva2UgY29sb3IgdXNlZCB0byBkZWZpbmUgYnJhbmQtdG9uZWQgc3VyZmFjZSBib3VuZGFyaWVzIHdpdGggbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLXN1cmZhY2UtYnJhbmQtc3Ryb25nOiAjMzg1OGU5OyAvKiBEZWNvcmF0aXZlIHN0cm9rZSBjb2xvciB1c2VkIHRvIGRlZmluZSBuZXV0cmFsbHktdG9uZWQgc3VyZmFjZSBib3VuZGFyaWVzIHdpdGggc3Ryb25nIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLXN1cmZhY2UtZXJyb3I6ICNlMWExOTg7IC8qIERlY29yYXRpdmUgc3Ryb2tlIGNvbG9yIHVzZWQgdG8gZGVmaW5lIGVycm9yLXRvbmVkIHN1cmZhY2UgYm91bmRhcmllcyB3aXRoIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1zdXJmYWNlLWVycm9yLXN0cm9uZzogI2NjMTgxODsgLyogRGVjb3JhdGl2ZSBzdHJva2UgY29sb3IgdXNlZCB0byBkZWZpbmUgZXJyb3ItdG9uZWQgc3VyZmFjZSBib3VuZGFyaWVzIHdpdGggc3Ryb25nIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLXN1cmZhY2UtaW5mbzogIzlmYmNkZDsgLyogRGVjb3JhdGl2ZSBzdHJva2UgY29sb3IgdXNlZCB0byBkZWZpbmUgaW5mby10b25lZCBzdXJmYWNlIGJvdW5kYXJpZXMgd2l0aCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2Utc3VyZmFjZS1pbmZvLXN0cm9uZzogIzAwNmJkNzsgLyogRGVjb3JhdGl2ZSBzdHJva2UgY29sb3IgdXNlZCB0byBkZWZpbmUgaW5mby10b25lZCBzdXJmYWNlIGJvdW5kYXJpZXMgd2l0aCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2Utc3VyZmFjZS1uZXV0cmFsOiAjZDhkOGQ4OyAvKiBEZWNvcmF0aXZlIHN0cm9rZSBjb2xvciB1c2VkIHRvIGRlZmluZSBuZXV0cmFsbHktdG9uZWQgc3VyZmFjZSBib3VuZGFyaWVzIHdpdGggbm9ybWFsIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLXN1cmZhY2UtbmV1dHJhbC1zdHJvbmc6ICM4YThhOGE7IC8qIERlY29yYXRpdmUgc3Ryb2tlIGNvbG9yIHVzZWQgdG8gZGVmaW5lIG5ldXRyYWxseS10b25lZCBzdXJmYWNlIGJvdW5kYXJpZXMgd2l0aCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2Utc3VyZmFjZS1uZXV0cmFsLXdlYWs6ICNlMGUwZTA7IC8qIERlY29yYXRpdmUgc3Ryb2tlIGNvbG9yIHVzZWQgdG8gZGVmaW5lIG5ldXRyYWxseS10b25lZCBzdXJmYWNlIGJvdW5kYXJpZXMgd2l0aCB3ZWFrIGVtcGhhc2lzLiAqL1xuXHQtLXdwZHMtY29sb3Itc3Ryb2tlLXN1cmZhY2Utc3VjY2VzczogIzgyYzk4ZjsgLyogRGVjb3JhdGl2ZSBzdHJva2UgY29sb3IgdXNlZCB0byBkZWZpbmUgc3VjY2Vzcy10b25lZCBzdXJmYWNlIGJvdW5kYXJpZXMgd2l0aCBub3JtYWwgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2Utc3VyZmFjZS1zdWNjZXNzLXN0cm9uZzogIzAwN2YzMDsgLyogRGVjb3JhdGl2ZSBzdHJva2UgY29sb3IgdXNlZCB0byBkZWZpbmUgc3VjY2Vzcy10b25lZCBzdXJmYWNlIGJvdW5kYXJpZXMgd2l0aCBzdHJvbmcgZW1waGFzaXMuICovXG5cdC0td3Bkcy1jb2xvci1zdHJva2Utc3VyZmFjZS13YXJuaW5nOiAjZDJiNTgxOyAvKiBEZWNvcmF0aXZlIHN0cm9rZSBjb2xvciB1c2VkIHRvIGRlZmluZSB3YXJuaW5nLXRvbmVkIHN1cmZhY2UgYm91bmRhcmllcyB3aXRoIG5vcm1hbCBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWNvbG9yLXN0cm9rZS1zdXJmYWNlLXdhcm5pbmctc3Ryb25nOiAjOTM2NDAwOyAvKiBEZWNvcmF0aXZlIHN0cm9rZSBjb2xvciB1c2VkIHRvIGRlZmluZSB3YXJuaW5nLXRvbmVkIHN1cmZhY2UgYm91bmRhcmllcyB3aXRoIHN0cm9uZyBlbXBoYXNpcy4gKi9cblx0LS13cGRzLWRpbWVuc2lvbi1iYXNlOiA0cHg7IC8qIEJhc2UgZGltZW5zaW9uIHVuaXQgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2UtMnhzOiA0cHg7IC8qIDJ4IGV4dHJhIHNtYWxsIHNwYWNpbmcgZm9yIHN1cmZhY2VzICovXG5cdC0td3Bkcy1kaW1lbnNpb24tcGFkZGluZy1zdXJmYWNlLWxnOiAzMnB4OyAvKiBMYXJnZSBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS1tZDogMjRweDsgLyogTWVkaXVtIHNwYWNpbmcgZm9yIHN1cmZhY2VzICovXG5cdC0td3Bkcy1kaW1lbnNpb24tcGFkZGluZy1zdXJmYWNlLXNtOiAxNnB4OyAvKiBTbWFsbCBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS14czogOHB4OyAvKiBFeHRyYSBzbWFsbCBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZWxldmF0aW9uLWxhcmdlOiAwIDVweCAxNXB4IDAgIzAwMDAwMDE0LCAwIDE1cHggMjdweCAwICMwMDAwMDAxMixcblx0XHQwIDMwcHggMzZweCAwICMwMDAwMDAwYSwgMCA1MHB4IDQzcHggMCAjMDAwMDAwMDU7IC8qIEZvciBjb21wb25lbnRzIHRoYXQgY29uZmlybSBkZWNpc2lvbnMgb3IgaGFuZGxlIG5lY2Vzc2FyeSBpbnRlcnJ1cHRpb25zLiBFeGFtcGxlOiBNb2RhbHMuICovXG5cdC0td3Bkcy1lbGV2YXRpb24tbWVkaXVtOiAwIDJweCAzcHggMCAjMDAwMDAwMGQsIDAgNHB4IDVweCAwICMwMDAwMDAwYSxcblx0XHQwIDEycHggMTJweCAwICMwMDAwMDAwOCwgMCAxNnB4IDE2cHggMCAjMDAwMDAwMDU7IC8qIEZvciBjb21wb25lbnRzIHRoYXQgb2ZmZXIgYWRkaXRpb25hbCBhY3Rpb25zLiBFeGFtcGxlOiBNZW51cywgQ29tbWFuZCBQYWxldHRlICovXG5cdC0td3Bkcy1lbGV2YXRpb24tc21hbGw6IDAgMXB4IDJweCAwICMwMDAwMDAwZCwgMCAycHggM3B4IDAgIzAwMDAwMDBhLFxuXHRcdDAgNnB4IDZweCAwICMwMDAwMDAwOCwgMCA4cHggOHB4IDAgIzAwMDAwMDA1OyAvKiBGb3IgY29tcG9uZW50cyB0aGF0IHByb3ZpZGUgY29udGV4dHVhbCBmZWVkYmFjayB3aXRob3V0IGJlaW5nIGludHJ1c2l2ZS4gR2VuZXJhbGx5IG5vbi1pbnRlcnJ1cHRpdmUuIEV4YW1wbGU6IFRvb2x0aXBzLCBTbmFja2Jhci4gKi9cblx0LS13cGRzLWVsZXZhdGlvbi14LXNtYWxsOiAwIDFweCAxcHggMCAjMDAwMDAwMDgsIDAgMXB4IDJweCAwICMwMDAwMDAwNSxcblx0XHQwIDNweCAzcHggMCAjMDAwMDAwMDUsIDAgNHB4IDRweCAwICMwMDAwMDAwMzsgLyogRm9yIHNlY3Rpb25zIGFuZCBjb250YWluZXJzIHRoYXQgZ3JvdXAgcmVsYXRlZCBjb250ZW50IGFuZCBjb250cm9scywgd2hpY2ggbWF5IG92ZXJsYXAgb3RoZXIgY29udGVudC4gRXhhbXBsZTogUHJldmlldyBGcmFtZS4gKi9cblx0LS13cGRzLWZvbnQtZmFtaWx5LWJvZHk6IC1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgJ1NlZ29lIFVJJywgJ1JvYm90bycsXG5cdFx0J094eWdlbi1TYW5zJywgJ1VidW50dScsICdDYW50YXJlbGwnLCAnSGVsdmV0aWNhIE5ldWUnLCBzYW5zLXNlcmlmOyAvKiBCb2R5IGZvbnQgZmFtaWx5ICovXG5cdC0td3Bkcy1mb250LWZhbWlseS1oZWFkaW5nOiAtYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksICdTZWdvZSBVSScsICdSb2JvdG8nLFxuXHRcdCdPeHlnZW4tU2FucycsICdVYnVudHUnLCAnQ2FudGFyZWxsJywgJ0hlbHZldGljYSBOZXVlJywgc2Fucy1zZXJpZjsgLyogSGVhZGluZ3MgZm9udCBmYW1pbHkgKi9cblx0LS13cGRzLWZvbnQtZmFtaWx5LW1vbm86ICdNZW5sbycsICdDb25zb2xhcycsIG1vbmFjbywgbW9ub3NwYWNlOyAvKiBNb25vc3BhY2UgZm9udCBmYW1pbHkgKi9cblx0LS13cGRzLWZvbnQtbGluZS1oZWlnaHQtMngtbGFyZ2U6IDQwcHg7IC8qIDJYIGxhcmdlIGxpbmUgaGVpZ2h0ICovXG5cdC0td3Bkcy1mb250LWxpbmUtaGVpZ2h0LWxhcmdlOiAyOHB4OyAvKiBMYXJnZSBsaW5lIGhlaWdodCAqL1xuXHQtLXdwZHMtZm9udC1saW5lLWhlaWdodC1tZWRpdW06IDI0cHg7IC8qIE1lZGl1bSBsaW5lIGhlaWdodCAqL1xuXHQtLXdwZHMtZm9udC1saW5lLWhlaWdodC1zbWFsbDogMjBweDsgLyogU21hbGwgbGluZSBoZWlnaHQgKi9cblx0LS13cGRzLWZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTogMzJweDsgLyogRXh0cmEgbGFyZ2UgbGluZSBoZWlnaHQgKi9cblx0LS13cGRzLWZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDogMTZweDsgLyogRXh0cmEgc21hbGwgbGluZSBoZWlnaHQgKi9cblx0LS13cGRzLWZvbnQtc2l6ZS0yeC1sYXJnZTogMzJweDsgLyogMlggbGFyZ2UgZm9udCBzaXplICovXG5cdC0td3Bkcy1mb250LXNpemUtbGFyZ2U6IDE1cHg7IC8qIExhcmdlIGZvbnQgc2l6ZSAqL1xuXHQtLXdwZHMtZm9udC1zaXplLW1lZGl1bTogMTNweDsgLyogTWVkaXVtIGZvbnQgc2l6ZSAqL1xuXHQtLXdwZHMtZm9udC1zaXplLXNtYWxsOiAxMnB4OyAvKiBTbWFsbCBmb250IHNpemUgKi9cblx0LS13cGRzLWZvbnQtc2l6ZS14LWxhcmdlOiAyMHB4OyAvKiBFeHRyYSBsYXJnZSBmb250IHNpemUgKi9cblx0LS13cGRzLWZvbnQtc2l6ZS14LXNtYWxsOiAxMXB4OyAvKiBFeHRyYSBzbWFsbCBmb250IHNpemUgKi9cbn1cblxuW2RhdGEtd3Bkcy10aGVtZS1wcm92aWRlci1pZF1bZGF0YS13cGRzLWRlbnNpdHk9J2RlZmF1bHQnXSB7XG5cdC0td3Bkcy1kaW1lbnNpb24tYmFzZTogNHB4OyAvKiBCYXNlIGRpbWVuc2lvbiB1bml0ICovXG5cdC0td3Bkcy1kaW1lbnNpb24tcGFkZGluZy1zdXJmYWNlLTJ4czogNHB4OyAvKiAyeCBleHRyYSBzbWFsbCBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS1sZzogMzJweDsgLyogTGFyZ2Ugc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2UtbWQ6IDI0cHg7IC8qIE1lZGl1bSBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS1zbTogMTZweDsgLyogU21hbGwgc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2UteHM6IDhweDsgLyogRXh0cmEgc21hbGwgc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cbn1cblxuW2RhdGEtd3Bkcy10aGVtZS1wcm92aWRlci1pZF1bZGF0YS13cGRzLWRlbnNpdHk9J2NvbXBhY3QnXSB7XG5cdC0td3Bkcy1kaW1lbnNpb24tcGFkZGluZy1zdXJmYWNlLTJ4czogNHB4OyAvKiAyeCBleHRyYSBzbWFsbCBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS1sZzogMjRweDsgLyogTGFyZ2Ugc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2UtbWQ6IDIwcHg7IC8qIE1lZGl1bSBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS1zbTogMTJweDsgLyogU21hbGwgc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2UteHM6IDRweDsgLyogRXh0cmEgc21hbGwgc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cbn1cblxuW2RhdGEtd3Bkcy10aGVtZS1wcm92aWRlci1pZF1bZGF0YS13cGRzLWRlbnNpdHk9J2NvbWZvcnRhYmxlJ10ge1xuXHQtLXdwZHMtZGltZW5zaW9uLXBhZGRpbmctc3VyZmFjZS0yeHM6IDhweDsgLyogMnggZXh0cmEgc21hbGwgc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2UtbGc6IDQwcHg7IC8qIExhcmdlIHNwYWNpbmcgZm9yIHN1cmZhY2VzICovXG5cdC0td3Bkcy1kaW1lbnNpb24tcGFkZGluZy1zdXJmYWNlLW1kOiAzMnB4OyAvKiBNZWRpdW0gc3BhY2luZyBmb3Igc3VyZmFjZXMgKi9cblx0LS13cGRzLWRpbWVuc2lvbi1wYWRkaW5nLXN1cmZhY2Utc206IDIwcHg7IC8qIFNtYWxsIHNwYWNpbmcgZm9yIHN1cmZhY2VzICovXG5cdC0td3Bkcy1kaW1lbnNpb24tcGFkZGluZy1zdXJmYWNlLXhzOiAxMnB4OyAvKiBFeHRyYSBzbWFsbCBzcGFjaW5nIGZvciBzdXJmYWNlcyAqL1xufVxuXG5AbWVkaWEgKCAtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIgKSwgKCBtaW4tcmVzb2x1dGlvbjogMTkyZHBpICkge1xuXHQ6cm9vdCB7XG5cdFx0LS13cGRzLWJvcmRlci13aWR0aC1mb2N1czogMS41cHg7IC8qIEJvcmRlciB3aWR0aCBmb3IgZm9jdXMgcmluZyAqL1xuXHR9XG59XG4iLCIvKipcbiAqIENvbG9yc1xuICovXG4vKipcbiAqIFNDU1MgVmFyaWFibGVzLlxuICpcbiAqIFBsZWFzZSB1c2UgdmFyaWFibGVzIGZyb20gdGhpcyBzaGVldCB0byBlbnN1cmUgY29uc2lzdGVuY3kgYWNyb3NzIHRoZSBVSS5cbiAqIERvbid0IGFkZCB0byB0aGlzIHNoZWV0IHVubGVzcyB5b3UncmUgcHJldHR5IHN1cmUgdGhlIHZhbHVlIHdpbGwgYmUgcmV1c2VkIGluIG1hbnkgcGxhY2VzLlxuICogRm9yIGV4YW1wbGUsIGRvbid0IGFkZCBydWxlcyB0byB0aGlzIHNoZWV0IHRoYXQgYWZmZWN0IGJsb2NrIHZpc3VhbHMuIEl0J3MgcHVyZWx5IGZvciBVSS5cbiAqL1xuLyoqXG4gKiBGb250cyAmIGJhc2ljIHZhcmlhYmxlcy5cbiAqL1xuLyoqXG4gKiBUeXBvZ3JhcGh5XG4gKi9cbi8qKlxuICogR3JpZCBTeXN0ZW0uXG4gKiBodHRwczovL21ha2Uud29yZHByZXNzLm9yZy9kZXNpZ24vMjAxOS8xMC8zMS9wcm9wb3NhbC1hLWNvbnNpc3RlbnQtc3BhY2luZy1zeXN0ZW0tZm9yLXdvcmRwcmVzcy9cbiAqL1xuLyoqXG4gKiBSYWRpdXMgc2NhbGUuXG4gKi9cbi8qKlxuICogRWxldmF0aW9uIHNjYWxlLlxuICovXG4vKipcbiAqIERpbWVuc2lvbnMuXG4gKi9cbi8qKlxuICogTW9iaWxlIHNwZWNpZmljIHN0eWxlc1xuICovXG4vKipcbiAqIEVkaXRvciBzdHlsZXMuXG4gKi9cbi8qKlxuICogQmxvY2sgJiBFZGl0b3IgVUkuXG4gKi9cbi8qKlxuICogQmxvY2sgcGFkZGluZ3MuXG4gKi9cbi8qKlxuICogUmVhY3QgTmF0aXZlIHNwZWNpZmljLlxuICogVGhlc2UgdmFyaWFibGVzIGRvIG5vdCBhcHBlYXIgdG8gYmUgdXNlZCBhbnl3aGVyZSBlbHNlLlxuICovXG4vKipcbiAqIFR5cG9ncmFwaHlcbiAqL1xuLyoqXG4gKiBCcmVha3BvaW50cyAmIE1lZGlhIFF1ZXJpZXNcbiAqL1xuLyoqXG4qICBDb252ZXJ0cyBhIGhleCB2YWx1ZSBpbnRvIHRoZSByZ2IgZXF1aXZhbGVudC5cbipcbiogQHBhcmFtIHtzdHJpbmd9IGhleCAtIHRoZSBoZXhhZGVjaW1hbCB2YWx1ZSB0byBjb252ZXJ0XG4qIEByZXR1cm4ge3N0cmluZ30gY29tbWEgc2VwYXJhdGVkIHJnYiB2YWx1ZXNcbiovXG4vKipcbiAqIExvbmcgY29udGVudCBmYWRlIG1peGluXG4gKlxuICogQ3JlYXRlcyBhIGZhZGluZyBvdmVybGF5IHRvIHNpZ25pZnkgdGhhdCB0aGUgY29udGVudCBpcyBsb25nZXJcbiAqIHRoYW4gdGhlIHNwYWNlIGFsbG93cy5cbiAqL1xuLyoqXG4gKiBCcmVha3BvaW50IG1peGluc1xuICovXG4vKipcbiAqIEZvY3VzIHN0eWxlcy5cbiAqL1xuLyoqXG4gKiBBcHBsaWVzIGVkaXRvciBsZWZ0IHBvc2l0aW9uIHRvIHRoZSBzZWxlY3RvciBwYXNzZWQgYXMgYXJndW1lbnRcbiAqL1xuLyoqXG4gKiBTdHlsZXMgdGhhdCBhcmUgcmV1c2VkIHZlcmJhdGltIGluIGEgZmV3IHBsYWNlc1xuICovXG4vKipcbiAqIEFsbG93cyB1c2VycyB0byBvcHQtb3V0IG9mIGFuaW1hdGlvbnMgdmlhIE9TLWxldmVsIHByZWZlcmVuY2VzLlxuICovXG4vKipcbiAqIFJlc2V0IGRlZmF1bHQgc3R5bGVzIGZvciBKYXZhU2NyaXB0IFVJIGJhc2VkIHBhZ2VzLlxuICogVGhpcyBpcyBhIFdQLWFkbWluIGFnbm9zdGljIHJlc2V0XG4gKi9cbi8qKlxuICogUmVzZXQgdGhlIFdQIEFkbWluIHBhZ2Ugc3R5bGVzIGZvciBHdXRlbmJlcmctbGlrZSBwYWdlcy5cbiAqL1xuLmFkbWluLXVpLXBhZ2Uge1xuICBkaXNwbGF5OiBmbGV4O1xuICBoZWlnaHQ6IDEwMCU7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjMmYyZjJmO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIHotaW5kZXg6IDE7XG4gIGZsZXgtZmxvdzogY29sdW1uO1xuICBjb250YWluZXI6IGFkbWluLXVpLXBhZ2UvaW5saW5lLXNpemU7XG59XG5AbWVkaWEgbm90IChwcmVmZXJzLXJlZHVjZWQtbW90aW9uKSB7XG4gIC5hZG1pbi11aS1wYWdlIHtcbiAgICB0cmFuc2l0aW9uOiB3aWR0aCBlYXNlLW91dCAwLjJzO1xuICB9XG59XG5cbi5hZG1pbi11aS1wYWdlX19oZWFkZXIge1xuICBwYWRkaW5nOiAxNnB4IDQ4cHg7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZjBmMGYwO1xuICBiYWNrZ3JvdW5kOiAjZmZmO1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICB0b3A6IDA7XG59XG5AY29udGFpbmVyIChtYXgtd2lkdGg6IDQzMHB4KSB7XG4gIC5hZG1pbi11aS1wYWdlX19oZWFkZXIge1xuICAgIHBhZGRpbmc6IDE2cHggMjRweDtcbiAgfVxufVxuXG4uYWRtaW4tdWktcGFnZV9faGVhZGVyLXN1YnRpdGxlIHtcbiAgcGFkZGluZy1ibG9jay1lbmQ6IDhweDtcbiAgY29sb3I6ICM3NTc1NzU7XG4gIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBcInN5c3RlbS11aVwiLCBcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLCBcIkhlbHZldGljYSBOZXVlXCIsIHNhbnMtc2VyaWY7XG4gIGZvbnQtd2VpZ2h0OiA0MDA7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDIwcHg7XG4gIG1hcmdpbjogMDtcbn1cblxuLmFkbWluLXVpLXBhZ2VfX2NvbnRlbnQge1xuICBmbGV4LWdyb3c6IDE7XG4gIG92ZXJmbG93OiBhdXRvO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xufVxuLmFkbWluLXVpLXBhZ2VfX2NvbnRlbnQuaGFzLXBhZGRpbmcge1xuICBwYWRkaW5nOiAxNnB4IDIwcHg7XG59XG5AY29udGFpbmVyIChtYXgtd2lkdGg6IDQzMHB4KSB7XG4gIC5hZG1pbi11aS1wYWdlX19jb250ZW50Lmhhcy1wYWRkaW5nIHtcbiAgICBwYWRkaW5nOiAxNnB4IDI0cHg7XG4gIH1cbn1cblxuLnNob3ctaWNvbi1sYWJlbHMgLmFkbWluLXVpLXBhZ2VfX2hlYWRlci1hY3Rpb25zIC5jb21wb25lbnRzLWJ1dHRvbi5oYXMtaWNvbiB7XG4gIHdpZHRoOiBhdXRvO1xuICBwYWRkaW5nOiAwIDhweDtcbn1cbi5zaG93LWljb24tbGFiZWxzIC5hZG1pbi11aS1wYWdlX19oZWFkZXItYWN0aW9ucyAuY29tcG9uZW50cy1idXR0b24uaGFzLWljb24gc3ZnIHtcbiAgZGlzcGxheTogbm9uZTtcbn1cbi5zaG93LWljb24tbGFiZWxzIC5hZG1pbi11aS1wYWdlX19oZWFkZXItYWN0aW9ucyAuY29tcG9uZW50cy1idXR0b24uaGFzLWljb246OmFmdGVyIHtcbiAgY29udGVudDogYXR0cihhcmlhLWxhYmVsKTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuXG4uYWRtaW4tdWktYnJlYWRjcnVtYnNfX2xpc3Qge1xuICBsaXN0LXN0eWxlOiBub25lO1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW46IDA7XG4gIGdhcDogMDtcbiAgZm9udC1zaXplOiAxNXB4O1xuICBtaW4taGVpZ2h0OiAzMnB4O1xuICBmb250LXdlaWdodDogNTAwO1xufVxuLmFkbWluLXVpLWJyZWFkY3J1bWJzX19saXN0IGxpOm5vdCg6bGFzdC1jaGlsZCk6OmFmdGVyIHtcbiAgY29udGVudDogXCIvXCI7XG4gIG1hcmdpbjogMCA4cHg7XG59XG4uYWRtaW4tdWktYnJlYWRjcnVtYnNfX2xpc3QgaDEge1xuICBmb250LXNpemU6IGluaGVyaXQ7XG4gIGxpbmUtaGVpZ2h0OiBpbmhlcml0O1xufSIsIi8qKlxuICogVHlwb2dyYXBoeVxuICovXG5cbkB1c2UgXCJzYXNzOmNvbG9yXCI7XG5AdXNlIFwic2FzczptYXRoXCI7XG5AdXNlIFwiLi92YXJpYWJsZXNcIjtcbkB1c2UgXCIuL2NvbG9yc1wiO1xuQHVzZSBcIi4vYnJlYWtwb2ludHNcIjtcbkB1c2UgXCIuL2Z1bmN0aW9uc1wiO1xuQHVzZSBcIi4vbG9uZy1jb250ZW50LWZhZGVcIjtcblxuQG1peGluIF90ZXh0LWhlYWRpbmcoKSB7XG5cdGZvbnQtZmFtaWx5OiB2YXJpYWJsZXMuJGZvbnQtZmFtaWx5LWhlYWRpbmdzO1xuXHRmb250LXdlaWdodDogdmFyaWFibGVzLiRmb250LXdlaWdodC1tZWRpdW07XG59XG5cbkBtaXhpbiBfdGV4dC1ib2R5KCkge1xuXHRmb250LWZhbWlseTogdmFyaWFibGVzLiRmb250LWZhbWlseS1ib2R5O1xuXHRmb250LXdlaWdodDogdmFyaWFibGVzLiRmb250LXdlaWdodC1yZWd1bGFyO1xufVxuXG5AbWl4aW4gaGVhZGluZy1zbWFsbCgpIHtcblx0QGluY2x1ZGUgX3RleHQtaGVhZGluZygpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLXgtc21hbGw7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDtcbn1cblxuQG1peGluIGhlYWRpbmctbWVkaXVtKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1oZWFkaW5nKCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtbWVkaXVtO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsO1xufVxuXG5AbWl4aW4gaGVhZGluZy1sYXJnZSgpIHtcblx0QGluY2x1ZGUgX3RleHQtaGVhZGluZygpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLWxhcmdlO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsO1xufVxuXG5AbWl4aW4gaGVhZGluZy14LWxhcmdlKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1oZWFkaW5nKCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUteC1sYXJnZTtcblx0bGluZS1oZWlnaHQ6IHZhcmlhYmxlcy4kZm9udC1saW5lLWhlaWdodC1tZWRpdW07XG59XG5cbkBtaXhpbiBoZWFkaW5nLTJ4LWxhcmdlKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1oZWFkaW5nKCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtMngtbGFyZ2U7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQtMngtbGFyZ2U7XG59XG5cbkBtaXhpbiBib2R5LXNtYWxsKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1ib2R5KCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtc21hbGw7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDtcbn1cblxuQG1peGluIGJvZHktbWVkaXVtKCkge1xuXHRAaW5jbHVkZSBfdGV4dC1ib2R5KCk7XG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRmb250LXNpemUtbWVkaXVtO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsO1xufVxuXG5AbWl4aW4gYm9keS1sYXJnZSgpIHtcblx0QGluY2x1ZGUgX3RleHQtYm9keSgpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLWxhcmdlO1xuXHRsaW5lLWhlaWdodDogdmFyaWFibGVzLiRmb250LWxpbmUtaGVpZ2h0LW1lZGl1bTtcbn1cblxuQG1peGluIGJvZHkteC1sYXJnZSgpIHtcblx0QGluY2x1ZGUgX3RleHQtYm9keSgpO1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZm9udC1zaXplLXgtbGFyZ2U7XG5cdGxpbmUtaGVpZ2h0OiB2YXJpYWJsZXMuJGZvbnQtbGluZS1oZWlnaHQteC1sYXJnZTtcbn1cblxuLyoqXG4gKiBCcmVha3BvaW50IG1peGluc1xuICovXG5cbkBtaXhpbiBicmVhay14aHVnZSgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWsteGh1Z2UpIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG5AbWl4aW4gYnJlYWstaHVnZSgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstaHVnZSkgfSkge1xuXHRcdEBjb250ZW50O1xuXHR9XG59XG5cbkBtaXhpbiBicmVhay13aWRlKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay13aWRlKSB9KSB7XG5cdFx0QGNvbnRlbnQ7XG5cdH1cbn1cblxuQG1peGluIGJyZWFrLXhsYXJnZSgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWsteGxhcmdlKSB9KSB7XG5cdFx0QGNvbnRlbnQ7XG5cdH1cbn1cblxuQG1peGluIGJyZWFrLWxhcmdlKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1sYXJnZSkgfSkge1xuXHRcdEBjb250ZW50O1xuXHR9XG59XG5cbkBtaXhpbiBicmVhay1tZWRpdW0oKSB7XG5cdEBtZWRpYSAobWluLXdpZHRoOiAjeyAoYnJlYWtwb2ludHMuJGJyZWFrLW1lZGl1bSkgfSkge1xuXHRcdEBjb250ZW50O1xuXHR9XG59XG5cbkBtaXhpbiBicmVhay1zbWFsbCgpIHtcblx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstc21hbGwpIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG5AbWl4aW4gYnJlYWstbW9iaWxlKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1tb2JpbGUpIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG5AbWl4aW4gYnJlYWstem9vbWVkLWluKCkge1xuXHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay16b29tZWQtaW4pIH0pIHtcblx0XHRAY29udGVudDtcblx0fVxufVxuXG4vKipcbiAqIEZvY3VzIHN0eWxlcy5cbiAqL1xuXG5AbWl4aW4gYmxvY2stdG9vbGJhci1idXR0b24tc3R5bGVfX2ZvY3VzKCkge1xuXHRib3gtc2hhZG93OiBpbnNldCAwIDAgMCB2YXJpYWJsZXMuJGJvcmRlci13aWR0aCBjb2xvcnMuJHdoaXRlLCAwIDAgMCB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpIHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKTtcblxuXHQvLyBXaW5kb3dzIEhpZ2ggQ29udHJhc3QgbW9kZSB3aWxsIHNob3cgdGhpcyBvdXRsaW5lLCBidXQgbm90IHRoZSBib3gtc2hhZG93LlxuXHRvdXRsaW5lOiAycHggc29saWQgdHJhbnNwYXJlbnQ7XG59XG5cbi8vIFRhYnMsIElucHV0cywgU3F1YXJlIGJ1dHRvbnMuXG5AbWl4aW4gaW5wdXQtc3R5bGVfX25ldXRyYWwoKSB7XG5cdGJveC1zaGFkb3c6IDAgMCAwIHRyYW5zcGFyZW50O1xuXHRib3JkZXItcmFkaXVzOiB2YXJpYWJsZXMuJHJhZGl1cy1zbWFsbDtcblx0Ym9yZGVyOiB2YXJpYWJsZXMuJGJvcmRlci13aWR0aCBzb2xpZCBjb2xvcnMuJGdyYXktNjAwO1xuXG5cdEBtZWRpYSBub3QgKHByZWZlcnMtcmVkdWNlZC1tb3Rpb24pIHtcblx0XHR0cmFuc2l0aW9uOiBib3gtc2hhZG93IDAuMXMgbGluZWFyO1xuXHR9XG59XG5cblxuQG1peGluIGlucHV0LXN0eWxlX19mb2N1cygkYWNjZW50LWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcikpIHtcblx0Ym9yZGVyLWNvbG9yOiAkYWNjZW50LWNvbG9yO1xuXHQvLyBFeHBhbmQgdGhlIGRlZmF1bHQgYm9yZGVyIGZvY3VzIHN0eWxlIGJ5IC41cHggdG8gYmUgYSB0b3RhbCBvZiAxLjVweC5cblx0Ym94LXNoYWRvdzogMCAwIDAgMC41cHggJGFjY2VudC1jb2xvcjtcblx0Ly8gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUgd2lsbCBzaG93IHRoaXMgb3V0bGluZSwgYnV0IG5vdCB0aGUgYm94LXNoYWRvdy5cblx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xufVxuXG5AbWl4aW4gYnV0dG9uLXN0eWxlX19mb2N1cygpIHtcblx0Ym94LXNoYWRvdzogMCAwIDAgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cblx0Ly8gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUgd2lsbCBzaG93IHRoaXMgb3V0bGluZSwgYnV0IG5vdCB0aGUgYm94LXNoYWRvdy5cblx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xufVxuXG5cbkBtaXhpbiBidXR0b24tc3R5bGUtb3V0c2V0X19mb2N1cygkZm9jdXMtY29sb3IpIHtcblx0Ym94LXNoYWRvdzogMCAwIDAgdmFyKC0td3AtYWRtaW4tYm9yZGVyLXdpZHRoLWZvY3VzKSBjb2xvcnMuJHdoaXRlLCAwIDAgMCBjYWxjKDIgKiB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpKSAkZm9jdXMtY29sb3I7XG5cblx0Ly8gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUgd2lsbCBzaG93IHRoaXMgb3V0bGluZSwgYnV0IG5vdCB0aGUgYm94LXNoYWRvdy5cblx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xuXHRvdXRsaW5lLW9mZnNldDogMnB4O1xufVxuXG5cbi8qKlxuICogQXBwbGllcyBlZGl0b3IgbGVmdCBwb3NpdGlvbiB0byB0aGUgc2VsZWN0b3IgcGFzc2VkIGFzIGFyZ3VtZW50XG4gKi9cblxuQG1peGluIGVkaXRvci1sZWZ0KCRzZWxlY3Rvcikge1xuXHQjeyRzZWxlY3Rvcn0geyAvKiBTZXQgbGVmdCBwb3NpdGlvbiB3aGVuIGF1dG8tZm9sZCBpcyBub3Qgb24gdGhlIGJvZHkgZWxlbWVudC4gKi9cblx0XHRsZWZ0OiAwO1xuXG5cdFx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstbWVkaXVtICsgMSkgfSkge1xuXHRcdFx0bGVmdDogdmFyaWFibGVzLiRhZG1pbi1zaWRlYmFyLXdpZHRoO1xuXHRcdH1cblx0fVxuXG5cdC5hdXRvLWZvbGQgI3skc2VsZWN0b3J9IHsgLyogQXV0byBmb2xkIGlzIHdoZW4gb24gc21hbGxlciBicmVha3BvaW50cywgbmF2IG1lbnUgYXV0byBjb2xsYXBzZXMuICovXG5cdFx0QG1lZGlhIChtaW4td2lkdGg6ICN7IChicmVha3BvaW50cy4kYnJlYWstbWVkaXVtICsgMSkgfSkge1xuXHRcdFx0bGVmdDogdmFyaWFibGVzLiRhZG1pbi1zaWRlYmFyLXdpZHRoLWNvbGxhcHNlZDtcblx0XHR9XG5cblx0XHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1sYXJnZSArIDEpIH0pIHtcblx0XHRcdGxlZnQ6IHZhcmlhYmxlcy4kYWRtaW4tc2lkZWJhci13aWR0aDtcblx0XHR9XG5cdH1cblxuXHQvKiBTaWRlYmFyIG1hbnVhbGx5IGNvbGxhcHNlZC4gKi9cblx0LmZvbGRlZCAjeyRzZWxlY3Rvcn0ge1xuXHRcdGxlZnQ6IDA7XG5cblx0XHRAbWVkaWEgKG1pbi13aWR0aDogI3sgKGJyZWFrcG9pbnRzLiRicmVhay1tZWRpdW0gKyAxKSB9KSB7XG5cdFx0XHRsZWZ0OiB2YXJpYWJsZXMuJGFkbWluLXNpZGViYXItd2lkdGgtY29sbGFwc2VkO1xuXHRcdH1cblx0fVxuXG5cdGJvZHkuaXMtZnVsbHNjcmVlbi1tb2RlICN7JHNlbGVjdG9yfSB7XG5cdFx0bGVmdDogMCAhaW1wb3J0YW50O1xuXHR9XG59XG5cbi8qKlxuICogU3R5bGVzIHRoYXQgYXJlIHJldXNlZCB2ZXJiYXRpbSBpbiBhIGZldyBwbGFjZXNcbiAqL1xuXG4vLyBUaGVzZSBhcmUgYWRkaXRpb25hbCBzdHlsZXMgZm9yIGFsbCBjYXB0aW9ucywgd2hlbiB0aGUgdGhlbWUgb3B0cyBpbiB0byBibG9jayBzdHlsZXMuXG5AbWl4aW4gY2FwdGlvbi1zdHlsZSgpIHtcblx0bWFyZ2luLXRvcDogMC41ZW07XG5cdG1hcmdpbi1ib3R0b206IDFlbTtcbn1cblxuQG1peGluIGNhcHRpb24tc3R5bGUtdGhlbWUoKSB7XG5cdGNvbG9yOiAjNTU1O1xuXHRmb250LXNpemU6IHZhcmlhYmxlcy4kZGVmYXVsdC1mb250LXNpemU7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcblxuXHQuaXMtZGFyay10aGVtZSAmIHtcblx0XHRjb2xvcjogY29sb3JzLiRsaWdodC1ncmF5LXBsYWNlaG9sZGVyO1xuXHR9XG59XG5cbi8qKlxuICogQWxsb3dzIHVzZXJzIHRvIG9wdC1vdXQgb2YgYW5pbWF0aW9ucyB2aWEgT1MtbGV2ZWwgcHJlZmVyZW5jZXMuXG4gKi9cblxuQG1peGluIHJlZHVjZS1tb3Rpb24oJHByb3BlcnR5OiBcIlwiKSB7XG5cblx0QGlmICRwcm9wZXJ0eSA9PSBcInRyYW5zaXRpb25cIiB7XG5cdFx0QG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpIHtcblx0XHRcdHRyYW5zaXRpb24tZHVyYXRpb246IDBzO1xuXHRcdFx0dHJhbnNpdGlvbi1kZWxheTogMHM7XG5cdFx0fVxuXHR9IEBlbHNlIGlmICRwcm9wZXJ0eSA9PSBcImFuaW1hdGlvblwiIHtcblx0XHRAbWVkaWEgKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSkge1xuXHRcdFx0YW5pbWF0aW9uLWR1cmF0aW9uOiAxbXM7XG5cdFx0XHRhbmltYXRpb24tZGVsYXk6IDBzO1xuXHRcdH1cblx0fSBAZWxzZSB7XG5cdFx0QG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpIHtcblx0XHRcdHRyYW5zaXRpb24tZHVyYXRpb246IDBzO1xuXHRcdFx0dHJhbnNpdGlvbi1kZWxheTogMHM7XG5cdFx0XHRhbmltYXRpb24tZHVyYXRpb246IDFtcztcblx0XHRcdGFuaW1hdGlvbi1kZWxheTogMHM7XG5cdFx0fVxuXHR9XG59XG5cbkBtaXhpbiBpbnB1dC1jb250cm9sKCRhY2NlbnQtY29sb3I6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKSkge1xuXHRmb250LWZhbWlseTogdmFyaWFibGVzLiRkZWZhdWx0LWZvbnQ7XG5cdHBhZGRpbmc6IDZweCA4cHg7XG5cdC8qIEZvbnRzIHNtYWxsZXIgdGhhbiAxNnB4IGNhdXNlcyBtb2JpbGUgc2FmYXJpIHRvIHpvb20uICovXG5cdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRtb2JpbGUtdGV4dC1taW4tZm9udC1zaXplO1xuXHQvKiBPdmVycmlkZSBjb3JlIGxpbmUtaGVpZ2h0LiBUbyBiZSByZXZpZXdlZC4gKi9cblx0bGluZS1oZWlnaHQ6IG5vcm1hbDtcblx0QGluY2x1ZGUgaW5wdXQtc3R5bGVfX25ldXRyYWwoKTtcblxuXHRAaW5jbHVkZSBicmVhay1zbWFsbCB7XG5cdFx0Zm9udC1zaXplOiB2YXJpYWJsZXMuJGRlZmF1bHQtZm9udC1zaXplO1xuXHRcdC8qIE92ZXJyaWRlIGNvcmUgbGluZS1oZWlnaHQuIFRvIGJlIHJldmlld2VkLiAqL1xuXHRcdGxpbmUtaGVpZ2h0OiBub3JtYWw7XG5cdH1cblxuXHQmOmZvY3VzIHtcblx0XHRAaW5jbHVkZSBpbnB1dC1zdHlsZV9fZm9jdXMoJGFjY2VudC1jb2xvcik7XG5cdH1cblxuXHQvLyBVc2Ugb3BhY2l0eSB0byB3b3JrIGluIHZhcmlvdXMgZWRpdG9yIHN0eWxlcy5cblx0Jjo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciB7XG5cdFx0Y29sb3I6IGNvbG9ycy4kZGFyay1ncmF5LXBsYWNlaG9sZGVyO1xuXHR9XG5cblx0Jjo6LW1vei1wbGFjZWhvbGRlciB7XG5cdFx0Y29sb3I6IGNvbG9ycy4kZGFyay1ncmF5LXBsYWNlaG9sZGVyO1xuXHR9XG5cblx0JjotbXMtaW5wdXQtcGxhY2Vob2xkZXIge1xuXHRcdGNvbG9yOiBjb2xvcnMuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjtcblx0fVxufVxuXG5AbWl4aW4gY2hlY2tib3gtY29udHJvbCB7XG5cdGJvcmRlcjogdmFyaWFibGVzLiRib3JkZXItd2lkdGggc29saWQgY29sb3JzLiRncmF5LTkwMDtcblx0bWFyZ2luLXJpZ2h0OiB2YXJpYWJsZXMuJGdyaWQtdW5pdC0xNTtcblx0dHJhbnNpdGlvbjogbm9uZTtcblx0Ym9yZGVyLXJhZGl1czogdmFyaWFibGVzLiRyYWRpdXMtc21hbGw7XG5cdEBpbmNsdWRlIGlucHV0LWNvbnRyb2w7XG5cblx0Jjpmb2N1cyB7XG5cdFx0Ym94LXNoYWRvdzogMCAwIDAgKHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoICogMikgY29sb3JzLiR3aGl0ZSwgMCAwIDAgKHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoICogMiArIHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoLWZvY3VzLWZhbGxiYWNrKSB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cblx0XHQvLyBPbmx5IHZpc2libGUgaW4gV2luZG93cyBIaWdoIENvbnRyYXN0IG1vZGUuXG5cdFx0b3V0bGluZTogMnB4IHNvbGlkIHRyYW5zcGFyZW50O1xuXHR9XG5cblx0JjpjaGVja2VkIHtcblx0XHRiYWNrZ3JvdW5kOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cdFx0Ym9yZGVyLWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cblx0XHQvLyBIaWRlIGRlZmF1bHQgY2hlY2tib3ggc3R5bGVzIGluIElFLlxuXHRcdCY6Oi1tcy1jaGVjayB7XG5cdFx0XHRvcGFjaXR5OiAwO1xuXHRcdH1cblx0fVxuXG5cdCY6Y2hlY2tlZDo6YmVmb3JlLFxuXHQmW2FyaWEtY2hlY2tlZD1cIm1peGVkXCJdOjpiZWZvcmUge1xuXHRcdG1hcmdpbjogLTNweCAtNXB4O1xuXHRcdGNvbG9yOiBjb2xvcnMuJHdoaXRlO1xuXG5cdFx0QGluY2x1ZGUgYnJlYWstbWVkaXVtKCkge1xuXHRcdFx0bWFyZ2luOiAtNHB4IDAgMCAtNXB4O1xuXHRcdH1cblx0fVxuXG5cdCZbYXJpYS1jaGVja2VkPVwibWl4ZWRcIl0ge1xuXHRcdGJhY2tncm91bmQ6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKTtcblx0XHRib3JkZXItY29sb3I6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yKTtcblxuXHRcdCY6OmJlZm9yZSB7XG5cdFx0XHQvLyBJbmhlcml0ZWQgZnJvbSBgZm9ybXMuY3NzYC5cblx0XHRcdC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL1dvcmRQcmVzcy93b3JkcHJlc3MtZGV2ZWxvcC90cmVlLzUuMS4xL3NyYy93cC1hZG1pbi9jc3MvZm9ybXMuY3NzI0wxMjItTDEzMlxuXHRcdFx0Y29udGVudDogXCJcXGY0NjBcIjtcblx0XHRcdGZsb2F0OiBsZWZ0O1xuXHRcdFx0ZGlzcGxheTogaW5saW5lLWJsb2NrO1xuXHRcdFx0dmVydGljYWwtYWxpZ246IG1pZGRsZTtcblx0XHRcdHdpZHRoOiAxNnB4O1xuXHRcdFx0Lyogc3R5bGVsaW50LWRpc2FibGUtbmV4dC1saW5lIGZvbnQtZmFtaWx5LW5vLW1pc3NpbmctZ2VuZXJpYy1mYW1pbHkta2V5d29yZCAtLSBkYXNoaWNvbnMgZG9uJ3QgbmVlZCBhIGdlbmVyaWMgZmFtaWx5IGtleXdvcmQuICovXG5cdFx0XHRmb250OiBub3JtYWwgMzBweC8xIGRhc2hpY29ucztcblx0XHRcdHNwZWFrOiBub25lO1xuXHRcdFx0LXdlYmtpdC1mb250LXNtb290aGluZzogYW50aWFsaWFzZWQ7XG5cdFx0XHQtbW96LW9zeC1mb250LXNtb290aGluZzogZ3JheXNjYWxlO1xuXG5cdFx0XHRAaW5jbHVkZSBicmVhay1tZWRpdW0oKSB7XG5cdFx0XHRcdGZsb2F0OiBub25lO1xuXHRcdFx0XHRmb250LXNpemU6IDIxcHg7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0JlthcmlhLWRpc2FibGVkPVwidHJ1ZVwiXSxcblx0JjpkaXNhYmxlZCB7XG5cdFx0YmFja2dyb3VuZDogY29sb3JzLiRncmF5LTEwMDtcblx0XHRib3JkZXItY29sb3I6IGNvbG9ycy4kZ3JheS0zMDA7XG5cdFx0Y3Vyc29yOiBkZWZhdWx0O1xuXG5cdFx0Ly8gT3ZlcnJpZGUgc3R5bGUgaW5oZXJpdGVkIGZyb20gd3AtYWRtaW4uIFJlcXVpcmVkIHRvIGF2b2lkIGRlZ3JhZGVkIGFwcGVhcmFuY2Ugb24gZGlmZmVyZW50IGJhY2tncm91bmRzLlxuXHRcdG9wYWNpdHk6IDE7XG5cdH1cbn1cblxuQG1peGluIHJhZGlvLWNvbnRyb2wge1xuXHRib3JkZXI6IHZhcmlhYmxlcy4kYm9yZGVyLXdpZHRoIHNvbGlkIGNvbG9ycy4kZ3JheS05MDA7XG5cdG1hcmdpbi1yaWdodDogdmFyaWFibGVzLiRncmlkLXVuaXQtMTU7XG5cdHRyYW5zaXRpb246IG5vbmU7XG5cdGJvcmRlci1yYWRpdXM6IHZhcmlhYmxlcy4kcmFkaXVzLXJvdW5kO1xuXHR3aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplLXNtO1xuXHRoZWlnaHQ6IHZhcmlhYmxlcy4kcmFkaW8taW5wdXQtc2l6ZS1zbTtcblx0bWluLXdpZHRoOiB2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUtc207XG5cdG1heC13aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplLXNtO1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG5cblx0QG1lZGlhIG5vdCAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbikge1xuXHRcdHRyYW5zaXRpb246IGJveC1zaGFkb3cgMC4xcyBsaW5lYXI7XG5cdH1cblxuXHRAaW5jbHVkZSBicmVhay1zbWFsbCgpIHtcblx0XHRoZWlnaHQ6IHZhcmlhYmxlcy4kcmFkaW8taW5wdXQtc2l6ZTtcblx0XHR3aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplO1xuXHRcdG1pbi13aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplO1xuXHRcdG1heC13aWR0aDogdmFyaWFibGVzLiRyYWRpby1pbnB1dC1zaXplO1xuXHR9XG5cblx0JjpjaGVja2VkOjpiZWZvcmUge1xuXHRcdGJveC1zaXppbmc6IGluaGVyaXQ7XG5cdFx0d2lkdGg6IG1hdGguZGl2KHZhcmlhYmxlcy4kcmFkaW8taW5wdXQtc2l6ZS1zbSwgMik7XG5cdFx0aGVpZ2h0OiBtYXRoLmRpdih2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUtc20sIDIpO1xuXHRcdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0XHR0b3A6IDUwJTtcblx0XHRsZWZ0OiA1MCU7XG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG5cdFx0bWFyZ2luOiAwO1xuXHRcdGJhY2tncm91bmQtY29sb3I6IGNvbG9ycy4kd2hpdGU7XG5cblx0XHQvLyBUaGlzIGJvcmRlciBzZXJ2ZXMgYXMgYSBiYWNrZ3JvdW5kIGNvbG9yIGluIFdpbmRvd3MgSGlnaCBDb250cmFzdCBtb2RlLlxuXHRcdGJvcmRlcjogNHB4IHNvbGlkIGNvbG9ycy4kd2hpdGU7XG5cblx0XHRAaW5jbHVkZSBicmVhay1zbWFsbCgpIHtcblx0XHRcdHdpZHRoOiBtYXRoLmRpdih2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUsIDIpO1xuXHRcdFx0aGVpZ2h0OiBtYXRoLmRpdih2YXJpYWJsZXMuJHJhZGlvLWlucHV0LXNpemUsIDIpO1xuXHRcdH1cblx0fVxuXG5cdCY6Zm9jdXMge1xuXHRcdGJveC1zaGFkb3c6IDAgMCAwICh2YXJpYWJsZXMuJGJvcmRlci13aWR0aCAqIDIpIGNvbG9ycy4kd2hpdGUsIDAgMCAwICh2YXJpYWJsZXMuJGJvcmRlci13aWR0aCAqIDIgKyB2YXJpYWJsZXMuJGJvcmRlci13aWR0aC1mb2N1cy1mYWxsYmFjaykgdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IpO1xuXG5cdFx0Ly8gT25seSB2aXNpYmxlIGluIFdpbmRvd3MgSGlnaCBDb250cmFzdCBtb2RlLlxuXHRcdG91dGxpbmU6IDJweCBzb2xpZCB0cmFuc3BhcmVudDtcblx0fVxuXG5cdCY6Y2hlY2tlZCB7XG5cdFx0YmFja2dyb3VuZDogdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IpO1xuXHRcdGJvcmRlcjogbm9uZTtcblx0fVxufVxuXG4vKipcbiAqIFJlc2V0IGRlZmF1bHQgc3R5bGVzIGZvciBKYXZhU2NyaXB0IFVJIGJhc2VkIHBhZ2VzLlxuICogVGhpcyBpcyBhIFdQLWFkbWluIGFnbm9zdGljIHJlc2V0XG4gKi9cblxuQG1peGluIHJlc2V0IHtcblx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcblxuXHQqLFxuXHQqOjpiZWZvcmUsXG5cdCo6OmFmdGVyIHtcblx0XHRib3gtc2l6aW5nOiBpbmhlcml0O1xuXHR9XG59XG5cbkBtaXhpbiBsaW5rLXJlc2V0IHtcblx0Jjpmb2N1cyB7XG5cdFx0Y29sb3I6IHZhcigtLXdwLWFkbWluLXRoZW1lLWNvbG9yLS1yZ2IpO1xuXHRcdGJveC1zaGFkb3c6IDAgMCAwIHZhcigtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1cykgdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IsICMwMDdjYmEpO1xuXHRcdGJvcmRlci1yYWRpdXM6IHZhcmlhYmxlcy4kcmFkaXVzLXNtYWxsO1xuXHR9XG59XG5cbi8vIFRoZSBlZGl0b3IgaW5wdXQgcmVzZXQgd2l0aCBpbmNyZWFzZWQgc3BlY2lmaWNpdHkgdG8gYXZvaWQgdGhlbWUgc3R5bGVzIGJsZWVkaW5nIGluLlxuQG1peGluIGVkaXRvci1pbnB1dC1yZXNldCgpIHtcblx0Zm9udC1mYW1pbHk6IHZhcmlhYmxlcy4kZWRpdG9yLWh0bWwtZm9udCAhaW1wb3J0YW50O1xuXHRjb2xvcjogY29sb3JzLiRncmF5LTkwMCAhaW1wb3J0YW50O1xuXHRiYWNrZ3JvdW5kOiBjb2xvcnMuJHdoaXRlICFpbXBvcnRhbnQ7XG5cdHBhZGRpbmc6IHZhcmlhYmxlcy4kZ3JpZC11bml0LTE1ICFpbXBvcnRhbnQ7XG5cdGJvcmRlcjogdmFyaWFibGVzLiRib3JkZXItd2lkdGggc29saWQgY29sb3JzLiRncmF5LTkwMCAhaW1wb3J0YW50O1xuXHRib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XG5cdGJvcmRlci1yYWRpdXM6IHZhcmlhYmxlcy4kcmFkaXVzLXNtYWxsICFpbXBvcnRhbnQ7XG5cblx0Ly8gRm9udHMgc21hbGxlciB0aGFuIDE2cHggY2F1c2VzIG1vYmlsZSBzYWZhcmkgdG8gem9vbS5cblx0Zm9udC1zaXplOiB2YXJpYWJsZXMuJG1vYmlsZS10ZXh0LW1pbi1mb250LXNpemUgIWltcG9ydGFudDtcblx0QGluY2x1ZGUgYnJlYWstc21hbGwge1xuXHRcdGZvbnQtc2l6ZTogdmFyaWFibGVzLiRkZWZhdWx0LWZvbnQtc2l6ZSAhaW1wb3J0YW50O1xuXHR9XG5cblx0Jjpmb2N1cyB7XG5cdFx0Ym9yZGVyLWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcikgIWltcG9ydGFudDtcblx0XHRib3gtc2hhZG93OiAwIDAgMCAodmFyaWFibGVzLiRib3JkZXItd2lkdGgtZm9jdXMtZmFsbGJhY2sgLSB2YXJpYWJsZXMuJGJvcmRlci13aWR0aCkgdmFyKC0td3AtYWRtaW4tdGhlbWUtY29sb3IpICFpbXBvcnRhbnQ7XG5cblx0XHQvLyBXaW5kb3dzIEhpZ2ggQ29udHJhc3QgbW9kZSB3aWxsIHNob3cgdGhpcyBvdXRsaW5lLCBidXQgbm90IHRoZSBib3gtc2hhZG93LlxuXHRcdG91dGxpbmU6IDJweCBzb2xpZCB0cmFuc3BhcmVudCAhaW1wb3J0YW50O1xuXHR9XG59XG5cbi8qKlxuICogUmVzZXQgdGhlIFdQIEFkbWluIHBhZ2Ugc3R5bGVzIGZvciBHdXRlbmJlcmctbGlrZSBwYWdlcy5cbiAqL1xuXG5AbWl4aW4gd3AtYWRtaW4tcmVzZXQoICRjb250ZW50LWNvbnRhaW5lciApIHtcblx0YmFja2dyb3VuZDogY29sb3JzLiR3aGl0ZTtcblxuXHQjd3Bjb250ZW50IHtcblx0XHRwYWRkaW5nLWxlZnQ6IDA7XG5cdH1cblxuXHQjd3Bib2R5LWNvbnRlbnQge1xuXHRcdHBhZGRpbmctYm90dG9tOiAwO1xuXHR9XG5cblx0LyogV2UgaGlkZSBsZWdhY3kgbm90aWNlcyBpbiBHdXRlbmJlcmcgQmFzZWQgUGFnZXMsIGJlY2F1c2UgdGhleSB3ZXJlIG5vdCBkZXNpZ25lZCBpbiBhIHdheSB0aGF0IHNjYWxlZCB3ZWxsLlxuXHQgICBQbHVnaW5zIGNhbiB1c2UgR3V0ZW5iZXJnIG5vdGljZXMgaWYgdGhleSBuZWVkIHRvIHBhc3Mgb24gaW5mb3JtYXRpb24gdG8gdGhlIHVzZXIgd2hlbiB0aGV5IGFyZSBlZGl0aW5nLiAqL1xuXHQjd3Bib2R5LWNvbnRlbnQgPiBkaXY6bm90KCN7ICRjb250ZW50LWNvbnRhaW5lciB9KTpub3QoI3NjcmVlbi1tZXRhKSB7XG5cdFx0ZGlzcGxheTogbm9uZTtcblx0fVxuXG5cdCN3cGZvb3RlciB7XG5cdFx0ZGlzcGxheTogbm9uZTtcblx0fVxuXG5cdC5hMTF5LXNwZWFrLXJlZ2lvbiB7XG5cdFx0bGVmdDogLTFweDtcblx0XHR0b3A6IC0xcHg7XG5cdH1cblxuXHR1bCNhZG1pbm1lbnUgYS53cC1oYXMtY3VycmVudC1zdWJtZW51OjphZnRlcixcblx0dWwjYWRtaW5tZW51ID4gbGkuY3VycmVudCA+IGEuY3VycmVudDo6YWZ0ZXIge1xuXHRcdGJvcmRlci1yaWdodC1jb2xvcjogY29sb3JzLiR3aGl0ZTtcblx0fVxuXG5cdC5tZWRpYS1mcmFtZSBzZWxlY3QuYXR0YWNobWVudC1maWx0ZXJzOmxhc3Qtb2YtdHlwZSB7XG5cdFx0d2lkdGg6IGF1dG87XG5cdFx0bWF4LXdpZHRoOiAxMDAlO1xuXHR9XG59XG5cbkBtaXhpbiBhZG1pbi1zY2hlbWUoJGNvbG9yLXByaW1hcnkpIHtcblx0Ly8gRGVmaW5lIFJHQiBlcXVpdmFsZW50cyBmb3IgdXNlIGluIHJnYmEgZnVuY3Rpb24uXG5cdC8vIEhleGFkZWNpbWFsIGNzcyB2YXJzIGRvIG5vdCB3b3JrIGluIHRoZSByZ2JhIGZ1bmN0aW9uLlxuXHQtLXdwLWFkbWluLXRoZW1lLWNvbG9yOiAjeyRjb2xvci1wcmltYXJ5fTtcblx0LS13cC1hZG1pbi10aGVtZS1jb2xvci0tcmdiOiAje2Z1bmN0aW9ucy5oZXgtdG8tcmdiKCRjb2xvci1wcmltYXJ5KX07XG5cdC8vIERhcmtlciBzaGFkZXMuXG5cdC0td3AtYWRtaW4tdGhlbWUtY29sb3ItZGFya2VyLTEwOiAje2NvbG9yLmFkanVzdCgkY29sb3ItcHJpbWFyeSwgJGxpZ2h0bmVzczogLTUlKX07XG5cdC0td3AtYWRtaW4tdGhlbWUtY29sb3ItZGFya2VyLTEwLS1yZ2I6ICN7ZnVuY3Rpb25zLmhleC10by1yZ2IoY29sb3IuYWRqdXN0KCRjb2xvci1wcmltYXJ5LCAkbGlnaHRuZXNzOiAtNSUpKX07XG5cdC0td3AtYWRtaW4tdGhlbWUtY29sb3ItZGFya2VyLTIwOiAje2NvbG9yLmFkanVzdCgkY29sb3ItcHJpbWFyeSwgJGxpZ2h0bmVzczogLTEwJSl9O1xuXHQtLXdwLWFkbWluLXRoZW1lLWNvbG9yLWRhcmtlci0yMC0tcmdiOiAje2Z1bmN0aW9ucy5oZXgtdG8tcmdiKGNvbG9yLmFkanVzdCgkY29sb3ItcHJpbWFyeSwgJGxpZ2h0bmVzczogLTEwJSkpfTtcblxuXHQvLyBGb2N1cyBzdHlsZSB3aWR0aC5cblx0Ly8gQXZvaWQgcm91bmRpbmcgaXNzdWVzIGJ5IHNob3dpbmcgYSB3aG9sZSAycHggZm9yIDF4IHNjcmVlbnMsIGFuZCAxLjVweCBvbiBoaWdoIHJlc29sdXRpb24gc2NyZWVucy5cblx0LS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXM6IDJweDtcblx0QG1lZGlhICggLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpIHtcblx0XHQtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1czogMS41cHg7XG5cdH1cbn1cblxuQG1peGluIHdvcmRwcmVzcy1hZG1pbi1zY2hlbWVzKCkge1xuXHRib2R5LmFkbWluLWNvbG9yLWxpZ2h0IHtcblx0XHRAaW5jbHVkZSBhZG1pbi1zY2hlbWUoIzAwODViYSk7XG5cdH1cblxuXHRib2R5LmFkbWluLWNvbG9yLW1vZGVybiB7XG5cdFx0QGluY2x1ZGUgYWRtaW4tc2NoZW1lKCMzODU4ZTkpO1xuXHR9XG5cblx0Ym9keS5hZG1pbi1jb2xvci1ibHVlIHtcblx0XHRAaW5jbHVkZSBhZG1pbi1zY2hlbWUoIzA5NjQ4NCk7XG5cdH1cblxuXHRib2R5LmFkbWluLWNvbG9yLWNvZmZlZSB7XG5cdFx0QGluY2x1ZGUgYWRtaW4tc2NoZW1lKCM0NjQwM2MpO1xuXHR9XG5cblx0Ym9keS5hZG1pbi1jb2xvci1lY3RvcGxhc20ge1xuXHRcdEBpbmNsdWRlIGFkbWluLXNjaGVtZSgjNTIzZjZkKTtcblx0fVxuXG5cdGJvZHkuYWRtaW4tY29sb3ItbWlkbmlnaHQge1xuXHRcdEBpbmNsdWRlIGFkbWluLXNjaGVtZSgjZTE0ZDQzKTtcblx0fVxuXG5cdGJvZHkuYWRtaW4tY29sb3Itb2NlYW4ge1xuXHRcdEBpbmNsdWRlIGFkbWluLXNjaGVtZSgjNjI3YzgzKTtcblx0fVxuXG5cdGJvZHkuYWRtaW4tY29sb3Itc3VucmlzZSB7XG5cdFx0QGluY2x1ZGUgYWRtaW4tc2NoZW1lKCNkZDgyM2IpO1xuXHR9XG59XG5cbi8vIERlcHJlY2F0ZWQgZnJvbSBVSSwga2VwdCBmb3IgYmFjay1jb21wYXQuXG5AbWl4aW4gYmFja2dyb3VuZC1jb2xvcnMtZGVwcmVjYXRlZCgpIHtcblx0Lmhhcy12ZXJ5LWxpZ2h0LWdyYXktYmFja2dyb3VuZC1jb2xvciB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogI2VlZTtcblx0fVxuXG5cdC5oYXMtdmVyeS1kYXJrLWdyYXktYmFja2dyb3VuZC1jb2xvciB7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogIzMxMzEzMTtcblx0fVxufVxuXG4vLyBEZXByZWNhdGVkIGZyb20gVUksIGtlcHQgZm9yIGJhY2stY29tcGF0LlxuQG1peGluIGZvcmVncm91bmQtY29sb3JzLWRlcHJlY2F0ZWQoKSB7XG5cdC5oYXMtdmVyeS1saWdodC1ncmF5LWNvbG9yIHtcblx0XHRjb2xvcjogI2VlZTtcblx0fVxuXG5cdC5oYXMtdmVyeS1kYXJrLWdyYXktY29sb3Ige1xuXHRcdGNvbG9yOiAjMzEzMTMxO1xuXHR9XG59XG5cbi8vIERlcHJlY2F0ZWQgZnJvbSBVSSwga2VwdCBmb3IgYmFjay1jb21wYXQuXG5AbWl4aW4gZ3JhZGllbnQtY29sb3JzLWRlcHJlY2F0ZWQoKSB7XG5cdC8vIE91ciBjbGFzc2VzIHVzZXMgdGhlIHNhbWUgdmFsdWVzIHdlIHNldCBmb3IgZ3JhZGllbnQgdmFsdWUgYXR0cmlidXRlcy5cblxuXHQvKiBzdHlsZWxpbnQtZGlzYWJsZSBAc3R5bGlzdGljL2Z1bmN0aW9uLWNvbW1hLXNwYWNlLWFmdGVyIC0tIFdlIGNhbiBub3QgdXNlIHNwYWNpbmcgYmVjYXVzZSBvZiBXUCBtdWx0aSBzaXRlIGtzZXMgcnVsZS4gKi9cblx0Lmhhcy12aXZpZC1ncmVlbi1jeWFuLXRvLXZpdmlkLWN5YW4tYmx1ZS1ncmFkaWVudC1iYWNrZ3JvdW5kIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLHJnYmEoMCwyMDgsMTMyLDEpIDAlLHJnYmEoNiwxNDcsMjI3LDEpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1wdXJwbGUtY3J1c2gtZ3JhZGllbnQtYmFja2dyb3VuZCB7XG5cdFx0YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZyxyZ2IoNTIsMjI2LDIyOCkgMCUscmdiKDcxLDMzLDI1MSkgNTAlLHJnYigxNzEsMjksMjU0KSAxMDAlKTtcblx0fVxuXG5cdC5oYXMtaGF6eS1kYXduLWdyYWRpZW50LWJhY2tncm91bmQge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcscmdiKDI1MCwxNzIsMTY4KSAwJSxyZ2IoMjE4LDIwOCwyMzYpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1zdWJkdWVkLW9saXZlLWdyYWRpZW50LWJhY2tncm91bmQge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcscmdiKDI1MCwyNTAsMjI1KSAwJSxyZ2IoMTAzLDE2NiwxMTMpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1hdG9taWMtY3JlYW0tZ3JhZGllbnQtYmFja2dyb3VuZCB7XG5cdFx0YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZyxyZ2IoMjUzLDIxNSwxNTQpIDAlLHJnYigwLDc0LDg5KSAxMDAlKTtcblx0fVxuXG5cdC5oYXMtbmlnaHRzaGFkZS1ncmFkaWVudC1iYWNrZ3JvdW5kIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLHJnYig1MSw5LDEwNCkgMCUscmdiKDQ5LDIwNSwyMDcpIDEwMCUpO1xuXHR9XG5cblx0Lmhhcy1taWRuaWdodC1ncmFkaWVudC1iYWNrZ3JvdW5kIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLHJnYigyLDMsMTI5KSAwJSxyZ2IoNDAsMTE2LDI1MikgMTAwJSk7XG5cdH1cblx0Lyogc3R5bGVsaW50LWVuYWJsZSBAc3R5bGlzdGljL2Z1bmN0aW9uLWNvbW1hLXNwYWNlLWFmdGVyICovXG59XG5cbkBtaXhpbiBjdXN0b20tc2Nyb2xsYmFycy1vbi1ob3ZlcigkaGFuZGxlLWNvbG9yLCAkaGFuZGxlLWNvbG9yLWhvdmVyKSB7XG5cblx0Ly8gV2ViS2l0XG5cdCY6Oi13ZWJraXQtc2Nyb2xsYmFyIHtcblx0XHR3aWR0aDogMTJweDtcblx0XHRoZWlnaHQ6IDEycHg7XG5cdH1cblx0Jjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuXHRcdGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuXHR9XG5cdCY6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHtcblx0XHRiYWNrZ3JvdW5kLWNvbG9yOiAkaGFuZGxlLWNvbG9yO1xuXHRcdGJvcmRlci1yYWRpdXM6IDhweDtcblx0XHRib3JkZXI6IDNweCBzb2xpZCB0cmFuc3BhcmVudDtcblx0XHRiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xuXHR9XG5cdCY6aG92ZXI6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iLCAvLyBUaGlzIG5lZWRzIHNwZWNpZmljaXR5LlxuXHQmOmZvY3VzOjotd2Via2l0LXNjcm9sbGJhci10aHVtYixcblx0Jjpmb2N1cy13aXRoaW46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHtcblx0XHRiYWNrZ3JvdW5kLWNvbG9yOiAkaGFuZGxlLWNvbG9yLWhvdmVyO1xuXHR9XG5cblx0Ly8gRmlyZWZveCAxMDkrIGFuZCBDaHJvbWUgMTExK1xuXHRzY3JvbGxiYXItd2lkdGg6IHRoaW47XG5cdHNjcm9sbGJhci1ndXR0ZXI6IHN0YWJsZSBib3RoLWVkZ2VzO1xuXHRzY3JvbGxiYXItY29sb3I6ICRoYW5kbGUtY29sb3IgdHJhbnNwYXJlbnQ7IC8vIFN5bnRheCwgXCJkYXJrXCIsIFwibGlnaHRcIiwgb3IgXCIjaGFuZGxlLWNvbG9yICN0cmFjay1jb2xvclwiXG5cblx0Jjpob3Zlcixcblx0Jjpmb2N1cyxcblx0Jjpmb2N1cy13aXRoaW4ge1xuXHRcdHNjcm9sbGJhci1jb2xvcjogJGhhbmRsZS1jb2xvci1ob3ZlciB0cmFuc3BhcmVudDtcblx0fVxuXG5cdC8vIE5lZWRlZCB0byBmaXggYSBTYWZhcmkgcmVuZGVyaW5nIGlzc3VlLlxuXHR3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xuXG5cdC8vIEFsd2F5cyBzaG93IHNjcm9sbGJhciBvbiBNb2JpbGUgZGV2aWNlcy5cblx0QG1lZGlhIChob3Zlcjogbm9uZSkge1xuXHRcdCYge1xuXHRcdFx0c2Nyb2xsYmFyLWNvbG9yOiAkaGFuZGxlLWNvbG9yLWhvdmVyIHRyYW5zcGFyZW50O1xuXHRcdH1cblx0fVxufVxuXG5AbWl4aW4gc2VsZWN0ZWQtYmxvY2stb3V0bGluZSgkd2lkdGhSYXRpbzogMSkge1xuXHRvdXRsaW5lLWNvbG9yOiB2YXIoLS13cC1hZG1pbi10aGVtZS1jb2xvcik7XG5cdG91dGxpbmUtc3R5bGU6IHNvbGlkO1xuXHRvdXRsaW5lLXdpZHRoOiBjYWxjKCN7JHdpZHRoUmF0aW99ICogKHZhcigtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1cykgLyB2YXIoLS13cC1ibG9jay1lZGl0b3ItaWZyYW1lLXpvb20tb3V0LXNjYWxlLCAxKSkpO1xuXHRvdXRsaW5lLW9mZnNldDogY2FsYygjeyR3aWR0aFJhdGlvfSAqICgoLTEgKiB2YXIoLS13cC1hZG1pbi1ib3JkZXItd2lkdGgtZm9jdXMpICkgLyB2YXIoLS13cC1ibG9jay1lZGl0b3ItaWZyYW1lLXpvb20tb3V0LXNjYWxlLCAxKSkpO1xufVxuXG5AbWl4aW4gc2VsZWN0ZWQtYmxvY2stZm9jdXMoJHdpZHRoUmF0aW86IDEpIHtcblx0Y29udGVudDogXCJcIjtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHRwb2ludGVyLWV2ZW50czogbm9uZTtcblx0dG9wOiAwO1xuXHRyaWdodDogMDtcblx0Ym90dG9tOiAwO1xuXHRsZWZ0OiAwO1xuXHRAaW5jbHVkZSBzZWxlY3RlZC1ibG9jay1vdXRsaW5lKCR3aWR0aFJhdGlvKTtcbn1cbiIsIi8qKlxuICogU0NTUyBWYXJpYWJsZXMuXG4gKlxuICogUGxlYXNlIHVzZSB2YXJpYWJsZXMgZnJvbSB0aGlzIHNoZWV0IHRvIGVuc3VyZSBjb25zaXN0ZW5jeSBhY3Jvc3MgdGhlIFVJLlxuICogRG9uJ3QgYWRkIHRvIHRoaXMgc2hlZXQgdW5sZXNzIHlvdSdyZSBwcmV0dHkgc3VyZSB0aGUgdmFsdWUgd2lsbCBiZSByZXVzZWQgaW4gbWFueSBwbGFjZXMuXG4gKiBGb3IgZXhhbXBsZSwgZG9uJ3QgYWRkIHJ1bGVzIHRvIHRoaXMgc2hlZXQgdGhhdCBhZmZlY3QgYmxvY2sgdmlzdWFscy4gSXQncyBwdXJlbHkgZm9yIFVJLlxuICovXG5cbkB1c2UgXCIuL2NvbG9yc1wiO1xuXG4vKipcbiAqIEZvbnRzICYgYmFzaWMgdmFyaWFibGVzLlxuICovXG5cbiRkZWZhdWx0LWZvbnQ6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCxcIlNlZ29lIFVJXCIsIFJvYm90bywgT3h5Z2VuLVNhbnMsIFVidW50dSwgQ2FudGFyZWxsLFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjsgLy8gVG9kbzogZGVwcmVjYXRlIGluIGZhdm9yIG9mICRmYW1pbHkgdmFyaWFibGVzXG4kZGVmYXVsdC1saW5lLWhlaWdodDogMS40OyAvLyBUb2RvOiBkZXByZWNhdGUgaW4gZmF2b3Igb2YgJGxpbmUtaGVpZ2h0IHRva2Vuc1xuXG4vKipcbiAqIFR5cG9ncmFwaHlcbiAqL1xuXG4vLyBTaXplc1xuJGZvbnQtc2l6ZS14LXNtYWxsOiAxMXB4O1xuJGZvbnQtc2l6ZS1zbWFsbDogMTJweDtcbiRmb250LXNpemUtbWVkaXVtOiAxM3B4O1xuJGZvbnQtc2l6ZS1sYXJnZTogMTVweDtcbiRmb250LXNpemUteC1sYXJnZTogMjBweDtcbiRmb250LXNpemUtMngtbGFyZ2U6IDMycHg7XG5cbi8vIExpbmUgaGVpZ2h0c1xuJGZvbnQtbGluZS1oZWlnaHQteC1zbWFsbDogMTZweDtcbiRmb250LWxpbmUtaGVpZ2h0LXNtYWxsOiAyMHB4O1xuJGZvbnQtbGluZS1oZWlnaHQtbWVkaXVtOiAyNHB4O1xuJGZvbnQtbGluZS1oZWlnaHQtbGFyZ2U6IDI4cHg7XG4kZm9udC1saW5lLWhlaWdodC14LWxhcmdlOiAzMnB4O1xuJGZvbnQtbGluZS1oZWlnaHQtMngtbGFyZ2U6IDQwcHg7XG5cbi8vIFdlaWdodHNcbiRmb250LXdlaWdodC1yZWd1bGFyOiA0MDA7XG4kZm9udC13ZWlnaHQtbWVkaXVtOiA0OTk7IC8vIGVuc3VyZXMgZmFsbGJhY2sgdG8gNDAwIChpbnN0ZWFkIG9mIDYwMClcblxuLy8gRmFtaWxpZXNcbiRmb250LWZhbWlseS1oZWFkaW5nczogLWFwcGxlLXN5c3RlbSwgXCJzeXN0ZW0tdWlcIiwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuJGZvbnQtZmFtaWx5LWJvZHk6IC1hcHBsZS1zeXN0ZW0sIFwic3lzdGVtLXVpXCIsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiRmb250LWZhbWlseS1tb25vOiBNZW5sbywgQ29uc29sYXMsIG1vbmFjbywgbW9ub3NwYWNlO1xuXG4vKipcbiAqIEdyaWQgU3lzdGVtLlxuICogaHR0cHM6Ly9tYWtlLndvcmRwcmVzcy5vcmcvZGVzaWduLzIwMTkvMTAvMzEvcHJvcG9zYWwtYS1jb25zaXN0ZW50LXNwYWNpbmctc3lzdGVtLWZvci13b3JkcHJlc3MvXG4gKi9cblxuJGdyaWQtdW5pdDogOHB4O1xuJGdyaWQtdW5pdC0wNTogMC41ICogJGdyaWQtdW5pdDtcdC8vIDRweFxuJGdyaWQtdW5pdC0xMDogMSAqICRncmlkLXVuaXQ7XHRcdC8vIDhweFxuJGdyaWQtdW5pdC0xNTogMS41ICogJGdyaWQtdW5pdDtcdC8vIDEycHhcbiRncmlkLXVuaXQtMjA6IDIgKiAkZ3JpZC11bml0O1x0XHQvLyAxNnB4XG4kZ3JpZC11bml0LTMwOiAzICogJGdyaWQtdW5pdDtcdFx0Ly8gMjRweFxuJGdyaWQtdW5pdC00MDogNCAqICRncmlkLXVuaXQ7XHRcdC8vIDMycHhcbiRncmlkLXVuaXQtNTA6IDUgKiAkZ3JpZC11bml0O1x0XHQvLyA0MHB4XG4kZ3JpZC11bml0LTYwOiA2ICogJGdyaWQtdW5pdDtcdFx0Ly8gNDhweFxuJGdyaWQtdW5pdC03MDogNyAqICRncmlkLXVuaXQ7XHRcdC8vIDU2cHhcbiRncmlkLXVuaXQtODA6IDggKiAkZ3JpZC11bml0O1x0XHQvLyA2NHB4XG5cbi8qKlxuICogUmFkaXVzIHNjYWxlLlxuICovXG5cbiRyYWRpdXMteC1zbWFsbDogMXB4OyAgIC8vIEFwcGxpZWQgdG8gZWxlbWVudHMgbGlrZSBidXR0b25zIG5lc3RlZCB3aXRoaW4gcHJpbWl0aXZlcyBsaWtlIGlucHV0cy5cbiRyYWRpdXMtc21hbGw6IDJweDsgICAgIC8vIEFwcGxpZWQgdG8gbW9zdCBwcmltaXRpdmVzLlxuJHJhZGl1cy1tZWRpdW06IDRweDsgICAgLy8gQXBwbGllZCB0byBjb250YWluZXJzIHdpdGggc21hbGxlciBwYWRkaW5nLlxuJHJhZGl1cy1sYXJnZTogOHB4OyAgICAgLy8gQXBwbGllZCB0byBjb250YWluZXJzIHdpdGggbGFyZ2VyIHBhZGRpbmcuXG4kcmFkaXVzLWZ1bGw6IDk5OTlweDsgICAvLyBGb3IgcGlsbHMuXG4kcmFkaXVzLXJvdW5kOiA1MCU7ICAgICAvLyBGb3IgY2lyY2xlcyBhbmQgb3ZhbHMuXG5cbi8qKlxuICogRWxldmF0aW9uIHNjYWxlLlxuICovXG5cbi8vIEZvciBzZWN0aW9ucyBhbmQgY29udGFpbmVycyB0aGF0IGdyb3VwIHJlbGF0ZWQgY29udGVudCBhbmQgY29udHJvbHMsIHdoaWNoIG1heSBvdmVybGFwIG90aGVyIGNvbnRlbnQuIEV4YW1wbGU6IFByZXZpZXcgRnJhbWUuXG4kZWxldmF0aW9uLXgtc21hbGw6IDAgMXB4IDFweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDMpLCAwIDFweCAycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKSwgMCAzcHggM3B4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMiksIDAgNHB4IDRweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDEpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IHByb3ZpZGUgY29udGV4dHVhbCBmZWVkYmFjayB3aXRob3V0IGJlaW5nIGludHJ1c2l2ZS4gR2VuZXJhbGx5IG5vbi1pbnRlcnJ1cHRpdmUuIEV4YW1wbGU6IFRvb2x0aXBzLCBTbmFja2Jhci5cbiRlbGV2YXRpb24tc21hbGw6IDAgMXB4IDJweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDUpLCAwIDJweCAzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA0KSwgMCA2cHggNnB4IHJnYmEoY29sb3JzLiRibGFjaywgMC4wMyksIDAgOHB4IDhweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDIpO1xuXG4vLyBGb3IgY29tcG9uZW50cyB0aGF0IG9mZmVyIGFkZGl0aW9uYWwgYWN0aW9ucy4gRXhhbXBsZTogTWVudXMsIENvbW1hbmQgUGFsZXR0ZVxuJGVsZXZhdGlvbi1tZWRpdW06IDAgMnB4IDNweCByZ2JhKGNvbG9ycy4kYmxhY2ssIDAuMDUpLCAwIDRweCA1cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA0KSwgMCAxMnB4IDEycHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAzKSwgMCAxNnB4IDE2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLy8gRm9yIGNvbXBvbmVudHMgdGhhdCBjb25maXJtIGRlY2lzaW9ucyBvciBoYW5kbGUgbmVjZXNzYXJ5IGludGVycnVwdGlvbnMuIEV4YW1wbGU6IE1vZGFscy5cbiRlbGV2YXRpb24tbGFyZ2U6IDAgNXB4IDE1cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA4KSwgMCAxNXB4IDI3cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA3KSwgMCAzMHB4IDM2cHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjA0KSwgMCA1MHB4IDQzcHggcmdiYShjb2xvcnMuJGJsYWNrLCAwLjAyKTtcblxuLyoqXG4gKiBEaW1lbnNpb25zLlxuICovXG5cbiRpY29uLXNpemU6IDI0cHg7XG4kYnV0dG9uLXNpemU6IDM2cHg7XG4kYnV0dG9uLXNpemUtbmV4dC1kZWZhdWx0LTQwcHg6IDQwcHg7IC8vIHRyYW5zaXRpb25hcnkgdmFyaWFibGUgZm9yIG5leHQgZGVmYXVsdCBidXR0b24gc2l6ZVxuJGJ1dHRvbi1zaXplLXNtYWxsOiAyNHB4O1xuJGJ1dHRvbi1zaXplLWNvbXBhY3Q6IDMycHg7XG4kaGVhZGVyLWhlaWdodDogNjRweDtcbiRwYW5lbC1oZWFkZXItaGVpZ2h0OiAkZ3JpZC11bml0LTYwO1xuJG5hdi1zaWRlYmFyLXdpZHRoOiAzMDBweDtcbiRhZG1pbi1iYXItaGVpZ2h0OiAzMnB4O1xuJGFkbWluLWJhci1oZWlnaHQtYmlnOiA0NnB4O1xuJGFkbWluLXNpZGViYXItd2lkdGg6IDE2MHB4O1xuJGFkbWluLXNpZGViYXItd2lkdGgtYmlnOiAxOTBweDtcbiRhZG1pbi1zaWRlYmFyLXdpZHRoLWNvbGxhcHNlZDogMzZweDtcbiRtb2RhbC1taW4td2lkdGg6IDM1MHB4O1xuJG1vZGFsLXdpZHRoLXNtYWxsOiAzODRweDtcbiRtb2RhbC13aWR0aC1tZWRpdW06IDUxMnB4O1xuJG1vZGFsLXdpZHRoLWxhcmdlOiA4NDBweDtcbiRzcGlubmVyLXNpemU6IDE2cHg7XG4kY2FudmFzLXBhZGRpbmc6ICRncmlkLXVuaXQtMjA7XG4kcGFsZXR0ZS1tYXgtaGVpZ2h0OiAzNjhweDtcblxuLyoqXG4gKiBNb2JpbGUgc3BlY2lmaWMgc3R5bGVzXG4gKi9cbiRtb2JpbGUtdGV4dC1taW4tZm9udC1zaXplOiAxNnB4OyAvLyBBbnkgZm9udCBzaXplIGJlbG93IDE2cHggd2lsbCBjYXVzZSBNb2JpbGUgU2FmYXJpIHRvIFwiem9vbSBpblwiLlxuXG4vKipcbiAqIEVkaXRvciBzdHlsZXMuXG4gKi9cblxuJHNpZGViYXItd2lkdGg6IDI4MHB4O1xuJGNvbnRlbnQtd2lkdGg6IDg0MHB4O1xuJHdpZGUtY29udGVudC13aWR0aDogMTEwMHB4O1xuJHdpZGdldC1hcmVhLXdpZHRoOiA3MDBweDtcbiRzZWNvbmRhcnktc2lkZWJhci13aWR0aDogMzUwcHg7XG4kZWRpdG9yLWZvbnQtc2l6ZTogMTZweDtcbiRkZWZhdWx0LWJsb2NrLW1hcmdpbjogMjhweDsgLy8gVGhpcyB2YWx1ZSBwcm92aWRlcyBhIGNvbnNpc3RlbnQsIGNvbnRpZ3VvdXMgc3BhY2luZyBiZXR3ZWVuIGJsb2Nrcy5cbiR0ZXh0LWVkaXRvci1mb250LXNpemU6IDE1cHg7XG4kZWRpdG9yLWxpbmUtaGVpZ2h0OiAxLjg7XG4kZWRpdG9yLWh0bWwtZm9udDogJGZvbnQtZmFtaWx5LW1vbm87XG5cbi8qKlxuICogQmxvY2sgJiBFZGl0b3IgVUkuXG4gKi9cblxuJGJsb2NrLXRvb2xiYXItaGVpZ2h0OiAkZ3JpZC11bml0LTYwO1xuJGJvcmRlci13aWR0aDogMXB4O1xuJGJvcmRlci13aWR0aC1mb2N1cy1mYWxsYmFjazogMnB4OyAvLyBUaGlzIGV4aXN0cyBhcyBhIGZhbGxiYWNrLCBhbmQgaXMgaWRlYWxseSBvdmVycmlkZGVuIGJ5IHZhcigtLXdwLWFkbWluLWJvcmRlci13aWR0aC1mb2N1cykgdW5sZXNzIGluIHNvbWUgU0FTUyBtYXRoIGNhc2VzLlxuJGJvcmRlci13aWR0aC10YWI6IDEuNXB4O1xuJGhlbHB0ZXh0LWZvbnQtc2l6ZTogMTJweDtcbiRyYWRpby1pbnB1dC1zaXplOiAxNnB4O1xuJHJhZGlvLWlucHV0LXNpemUtc206IDI0cHg7IC8vIFdpZHRoICYgaGVpZ2h0IGZvciBzbWFsbCB2aWV3cG9ydHMuXG5cbi8vIERlcHJlY2F0ZWQsIHBsZWFzZSBhdm9pZCB1c2luZyB0aGVzZS5cbiRibG9jay1wYWRkaW5nOiAxNHB4OyAvLyBVc2VkIHRvIGRlZmluZSBzcGFjZSBiZXR3ZWVuIGJsb2NrIGZvb3RwcmludCBhbmQgc3Vycm91bmRpbmcgYm9yZGVycy5cbiRyYWRpdXMtYmxvY2stdWk6ICRyYWRpdXMtc21hbGw7XG4kc2hhZG93LXBvcG92ZXI6ICRlbGV2YXRpb24teC1zbWFsbDtcbiRzaGFkb3ctbW9kYWw6ICRlbGV2YXRpb24tbGFyZ2U7XG4kZGVmYXVsdC1mb250LXNpemU6ICRmb250LXNpemUtbWVkaXVtO1xuXG4vKipcbiAqIEJsb2NrIHBhZGRpbmdzLlxuICovXG5cbi8vIFBhZGRpbmcgZm9yIGJsb2NrcyB3aXRoIGEgYmFja2dyb3VuZCBjb2xvciAoZS5nLiBwYXJhZ3JhcGggb3IgZ3JvdXApLlxuJGJsb2NrLWJnLXBhZGRpbmctLXY6IDEuMjVlbTtcbiRibG9jay1iZy1wYWRkaW5nLS1oOiAyLjM3NWVtO1xuXG5cbi8qKlxuICogUmVhY3QgTmF0aXZlIHNwZWNpZmljLlxuICogVGhlc2UgdmFyaWFibGVzIGRvIG5vdCBhcHBlYXIgdG8gYmUgdXNlZCBhbnl3aGVyZSBlbHNlLlxuICovXG5cbi8vIERpbWVuc2lvbnMuXG4kbW9iaWxlLWhlYWRlci10b29sYmFyLWhlaWdodDogNDRweDtcbiRtb2JpbGUtaGVhZGVyLXRvb2xiYXItZXhwYW5kZWQtaGVpZ2h0OiA1MnB4O1xuJG1vYmlsZS1mbG9hdGluZy10b29sYmFyLWhlaWdodDogNDRweDtcbiRtb2JpbGUtZmxvYXRpbmctdG9vbGJhci1tYXJnaW46IDhweDtcbiRtb2JpbGUtY29sb3Itc3dhdGNoOiA0OHB4O1xuXG4vLyBCbG9jayBVSS5cbiRtb2JpbGUtYmxvY2stdG9vbGJhci1oZWlnaHQ6IDQ0cHg7XG4kZGltbWVkLW9wYWNpdHk6IDE7XG4kYmxvY2stZWRnZS10by1jb250ZW50OiAxNnB4O1xuJHNvbGlkLWJvcmRlci1zcGFjZTogMTJweDtcbiRkYXNoZWQtYm9yZGVyLXNwYWNlOiA2cHg7XG4kYmxvY2stc2VsZWN0ZWQtbWFyZ2luOiAzcHg7XG4kYmxvY2stc2VsZWN0ZWQtYm9yZGVyLXdpZHRoOiAxcHg7XG4kYmxvY2stc2VsZWN0ZWQtcGFkZGluZzogMDtcbiRibG9jay1zZWxlY3RlZC1jaGlsZC1tYXJnaW46IDVweDtcbiRibG9jay1zZWxlY3RlZC10by1jb250ZW50OiAkYmxvY2stZWRnZS10by1jb250ZW50IC0gJGJsb2NrLXNlbGVjdGVkLW1hcmdpbiAtICRibG9jay1zZWxlY3RlZC1ib3JkZXItd2lkdGg7XG4iLCIvKipcbiAqIENvbG9yc1xuICovXG5cbi8vIFdvcmRQcmVzcyBncmF5cy5cbiRibGFjazogIzAwMDtcdFx0XHQvLyBVc2Ugb25seSB3aGVuIHlvdSB0cnVseSBuZWVkIHB1cmUgYmxhY2suIEZvciBVSSwgdXNlICRncmF5LTkwMC5cbiRncmF5LTkwMDogIzFlMWUxZTtcbiRncmF5LTgwMDogIzJmMmYyZjtcbiRncmF5LTcwMDogIzc1NzU3NTtcdFx0Ly8gTWVldHMgNC42OjEgKDQuNToxIGlzIG1pbmltdW0pIHRleHQgY29udHJhc3QgYWdhaW5zdCB3aGl0ZS5cbiRncmF5LTYwMDogIzk0OTQ5NDtcdFx0Ly8gTWVldHMgMzoxIFVJIG9yIGxhcmdlIHRleHQgY29udHJhc3QgYWdhaW5zdCB3aGl0ZS5cbiRncmF5LTQwMDogI2NjYztcbiRncmF5LTMwMDogI2RkZDtcdFx0Ly8gVXNlZCBmb3IgbW9zdCBib3JkZXJzLlxuJGdyYXktMjAwOiAjZTBlMGUwO1x0XHQvLyBVc2VkIHNwYXJpbmdseSBmb3IgbGlnaHQgYm9yZGVycy5cbiRncmF5LTEwMDogI2YwZjBmMDtcdFx0Ly8gVXNlZCBmb3IgbGlnaHQgZ3JheSBiYWNrZ3JvdW5kcy5cbiR3aGl0ZTogI2ZmZjtcblxuLy8gT3BhY2l0aWVzICYgYWRkaXRpb25hbCBjb2xvcnMuXG4kZGFyay1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC42Mik7XG4kbWVkaXVtLWdyYXktcGxhY2Vob2xkZXI6IHJnYmEoJGdyYXktOTAwLCAwLjU1KTtcbiRsaWdodC1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCR3aGl0ZSwgMC42NSk7XG5cbi8vIEFsZXJ0IGNvbG9ycy5cbiRhbGVydC15ZWxsb3c6ICNmMGI4NDk7XG4kYWxlcnQtcmVkOiAjY2MxODE4O1xuJGFsZXJ0LWdyZWVuOiAjNGFiODY2O1xuXG4vLyBEZXByZWNhdGVkLCBwbGVhc2UgYXZvaWQgdXNpbmcgdGhlc2UuXG4kZGFyay10aGVtZS1mb2N1czogJHdoaXRlO1x0Ly8gRm9jdXMgY29sb3Igd2hlbiB0aGUgdGhlbWUgaXMgZGFyay5cbiIsIi8qKlxuICogQnJlYWtwb2ludHMgJiBNZWRpYSBRdWVyaWVzXG4gKi9cblxuLy8gTW9zdCB1c2VkIGJyZWFrcG9pbnRzXG4kYnJlYWsteGh1Z2U6IDE5MjBweDtcbiRicmVhay1odWdlOiAxNDQwcHg7XG4kYnJlYWstd2lkZTogMTI4MHB4O1xuJGJyZWFrLXhsYXJnZTogMTA4MHB4O1xuJGJyZWFrLWxhcmdlOiA5NjBweDtcdC8vIGFkbWluIHNpZGViYXIgYXV0byBmb2xkc1xuJGJyZWFrLW1lZGl1bTogNzgycHg7XHQvLyBhZG1pbmJhciBnb2VzIGJpZ1xuJGJyZWFrLXNtYWxsOiA2MDBweDtcbiRicmVhay1tb2JpbGU6IDQ4MHB4O1xuJGJyZWFrLXpvb21lZC1pbjogMjgwcHg7XG5cbi8vIEFsbCBtZWRpYSBxdWVyaWVzIGN1cnJlbnRseSBpbiBXb3JkUHJlc3M6XG4vL1xuLy8gbWluLXdpZHRoOiAyMDAwcHhcbi8vIG1pbi13aWR0aDogMTY4MHB4XG4vLyBtaW4td2lkdGg6IDEyNTBweFxuLy8gbWF4LXdpZHRoOiAxMTIwcHggKlxuLy8gbWF4LXdpZHRoOiAxMDAwcHhcbi8vIG1pbi13aWR0aDogNzY5cHggYW5kIG1heC13aWR0aDogMTAwMHB4XG4vLyBtYXgtd2lkdGg6IDk2MHB4ICpcbi8vIG1heC13aWR0aDogOTAwcHhcbi8vIG1heC13aWR0aDogODUwcHhcbi8vIG1pbi13aWR0aDogODAwcHggYW5kIG1heC13aWR0aDogMTQ5OXB4XG4vLyBtYXgtd2lkdGg6IDgwMHB4XG4vLyBtYXgtd2lkdGg6IDc5OXB4XG4vLyBtYXgtd2lkdGg6IDc4MnB4ICpcbi8vIG1heC13aWR0aDogNzY4cHhcbi8vIG1heC13aWR0aDogNjQwcHggKlxuLy8gbWF4LXdpZHRoOiA2MDBweCAqXG4vLyBtYXgtd2lkdGg6IDUyMHB4XG4vLyBtYXgtd2lkdGg6IDUwMHB4XG4vLyBtYXgtd2lkdGg6IDQ4MHB4ICpcbi8vIG1heC13aWR0aDogNDAwcHggKlxuLy8gbWF4LXdpZHRoOiAzODBweFxuLy8gbWF4LXdpZHRoOiAzMjBweCAqXG4vL1xuLy8gVGhvc2UgbWFya2VkICogc2VlbSB0byBiZSBtb3JlIGNvbW1vbmx5IHVzZWQgdGhhbiB0aGUgb3RoZXJzLlxuLy8gTGV0J3MgdHJ5IGFuZCB1c2UgYXMgZmV3IG9mIHRoZXNlIGFzIHBvc3NpYmxlLCBhbmQgYmUgbWluZGZ1bCBhYm91dCBhZGRpbmcgbmV3IG9uZXMsIHNvIHdlIGRvbid0IG1ha2UgdGhlIHNpdHVhdGlvbiB3b3JzZVxuIiwiLyoqXG4qICBDb252ZXJ0cyBhIGhleCB2YWx1ZSBpbnRvIHRoZSByZ2IgZXF1aXZhbGVudC5cbipcbiogQHBhcmFtIHtzdHJpbmd9IGhleCAtIHRoZSBoZXhhZGVjaW1hbCB2YWx1ZSB0byBjb252ZXJ0XG4qIEByZXR1cm4ge3N0cmluZ30gY29tbWEgc2VwYXJhdGVkIHJnYiB2YWx1ZXNcbiovXG5cbkB1c2UgXCJzYXNzOmNvbG9yXCI7XG5AdXNlIFwic2FzczptZXRhXCI7XG5cbkBmdW5jdGlvbiBoZXgtdG8tcmdiKCRoZXgpIHtcblx0Lypcblx0ICogVE9ETzogYGNvbG9yLntyZWR8Z3JlZW58Ymx1ZX1gIHdpbGwgdHJpZ2dlciBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgaW4gRGFydCBTYXNzLFxuXHQgKiBidXQgdGhlIFNhc3MgdXNlZCBieSB0aGUgR3V0ZW5iZXJnIHByb2plY3QgZG9lc24ndCBzdXBwb3J0IGBjb2xvci5jaGFubmVsKClgIHlldCxcblx0ICogc28gd2UgY2FuJ3QgbWlncmF0ZSB0byBpdCBhdCB0aGlzIHRpbWUuXG5cdCAqIEluIHRoZSBmdXR1cmUsIGFmdGVyIHRoZSBHdXRlbmJlcmcgcHJvamVjdCBoYXMgYmVlbiBmdWxseSBtaWdyYXRlZCB0byBEYXJ0IFNhc3MsXG5cdCAqIFJlbW92ZSB0aGlzIGNvbmRpdGlvbmFsIHN0YXRlbWVudCBhbmQgdXNlIG9ubHkgYGNvbG9yLmNoYW5uZWwoKWAuXG5cdCAqL1xuXHRAaWYgbWV0YS5mdW5jdGlvbi1leGlzdHMoXCJjaGFubmVsXCIsIFwiY29sb3JcIikge1xuXHRcdEByZXR1cm4gY29sb3IuY2hhbm5lbCgkaGV4LCBcInJlZFwiKSwgY29sb3IuY2hhbm5lbCgkaGV4LCBcImdyZWVuXCIpLCBjb2xvci5jaGFubmVsKCRoZXgsIFwiYmx1ZVwiKTtcblx0fSBAZWxzZSB7XG5cdFx0QHJldHVybiBjb2xvci5yZWQoJGhleCksIGNvbG9yLmdyZWVuKCRoZXgpLCBjb2xvci5ibHVlKCRoZXgpO1xuXHR9XG59XG4iLCIvKipcbiAqIExvbmcgY29udGVudCBmYWRlIG1peGluXG4gKlxuICogQ3JlYXRlcyBhIGZhZGluZyBvdmVybGF5IHRvIHNpZ25pZnkgdGhhdCB0aGUgY29udGVudCBpcyBsb25nZXJcbiAqIHRoYW4gdGhlIHNwYWNlIGFsbG93cy5cbiAqL1xuXG5AbWl4aW4gbG9uZy1jb250ZW50LWZhZGUoJGRpcmVjdGlvbjogcmlnaHQsICRzaXplOiAyMCUsICRjb2xvcjogI2ZmZiwgJGVkZ2U6IDAsICR6LWluZGV4OiBmYWxzZSkge1xuXHRjb250ZW50OiBcIlwiO1xuXHRkaXNwbGF5OiBibG9jaztcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHQtd2Via2l0LXRvdWNoLWNhbGxvdXQ6IG5vbmU7XG5cdC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG5cdC1raHRtbC11c2VyLXNlbGVjdDogbm9uZTtcblx0LW1vei11c2VyLXNlbGVjdDogbm9uZTtcblx0LW1zLXVzZXItc2VsZWN0OiBub25lO1xuXHR1c2VyLXNlbGVjdDogbm9uZTtcblx0cG9pbnRlci1ldmVudHM6IG5vbmU7XG5cblx0QGlmICR6LWluZGV4IHtcblx0XHR6LWluZGV4OiAkei1pbmRleDtcblx0fVxuXG5cdEBpZiAkZGlyZWN0aW9uID09IFwiYm90dG9tXCIge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byB0b3AsIHRyYW5zcGFyZW50LCAkY29sb3IgOTAlKTtcblx0XHRsZWZ0OiAkZWRnZTtcblx0XHRyaWdodDogJGVkZ2U7XG5cdFx0dG9wOiAkZWRnZTtcblx0XHRib3R0b206IGNhbGMoMTAwJSAtICRzaXplKTtcblx0XHR3aWR0aDogYXV0bztcblx0fVxuXG5cdEBpZiAkZGlyZWN0aW9uID09IFwidG9wXCIge1xuXHRcdGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sIHRyYW5zcGFyZW50LCAkY29sb3IgOTAlKTtcblx0XHR0b3A6IGNhbGMoMTAwJSAtICRzaXplKTtcblx0XHRsZWZ0OiAkZWRnZTtcblx0XHRyaWdodDogJGVkZ2U7XG5cdFx0Ym90dG9tOiAkZWRnZTtcblx0XHR3aWR0aDogYXV0bztcblx0fVxuXG5cdEBpZiAkZGlyZWN0aW9uID09IFwibGVmdFwiIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gbGVmdCwgdHJhbnNwYXJlbnQsICRjb2xvciA5MCUpO1xuXHRcdHRvcDogJGVkZ2U7XG5cdFx0bGVmdDogJGVkZ2U7XG5cdFx0Ym90dG9tOiAkZWRnZTtcblx0XHRyaWdodDogYXV0bztcblx0XHR3aWR0aDogJHNpemU7XG5cdFx0aGVpZ2h0OiBhdXRvO1xuXHR9XG5cblx0QGlmICRkaXJlY3Rpb24gPT0gXCJyaWdodFwiIHtcblx0XHRiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIHRyYW5zcGFyZW50LCAkY29sb3IgOTAlKTtcblx0XHR0b3A6ICRlZGdlO1xuXHRcdGJvdHRvbTogJGVkZ2U7XG5cdFx0cmlnaHQ6ICRlZGdlO1xuXHRcdGxlZnQ6IGF1dG87XG5cdFx0d2lkdGg6ICRzaXplO1xuXHRcdGhlaWdodDogYXV0bztcblx0fVxufVxuIiwiQHVzZSBcIkB3b3JkcHJlc3MvdGhlbWUvc3JjL3ByZWJ1aWx0L2Nzcy9kZXNpZ24tdG9rZW5zLmNzc1wiIGFzICo7XG5AdXNlIFwiQHdvcmRwcmVzcy9hZG1pbi11aS9idWlsZC1zdHlsZS9zdHlsZS5jc3NcIiBhcyAqO1xuQHVzZSBcIkB3b3JkcHJlc3MvYmFzZS1zdHlsZXMvbWl4aW5zXCIgYXMgKjtcbkB1c2UgXCJAd29yZHByZXNzL2Jhc2Utc3R5bGVzL3ZhcmlhYmxlc1wiO1xuXG4vLyBSZXNldCB3cC1hZG1pbiBsYXlvdXQgc3R5bGVzIHdoZW4gbG9hZGVkIGluc2lkZSB3cC1hZG1pbi5cbi5ib290LWxheW91dC1jb250YWluZXIgLmJvb3QtbGF5b3V0IHtcblx0aGVpZ2h0OiBjYWxjKDEwMHZoIC0gI3t2YXJpYWJsZXMuJGFkbWluLWJhci1oZWlnaHR9KTtcbn1cblxuYm9keTpoYXMoLmJvb3QtbGF5b3V0LWNvbnRhaW5lcikge1xuXHRiYWNrZ3JvdW5kOiAjMWQyMzI3OyAvLyBTYW1lIGFzIFdQLUFkbWluIHNpZGViYXJcblx0b3ZlcmZsb3c6IGhpZGRlbjtcbn1cblxuI3dwY29udGVudCB7XG5cdHBhZGRpbmctbGVmdDogMDtcbn1cblxuI3dwYm9keS1jb250ZW50IHtcblx0cGFkZGluZy1ib3R0b206IDA7XG59XG5cbiN3cGZvb3RlciB7XG5cdGRpc3BsYXk6IG5vbmU7XG59XG5cbmJvZHk6aGFzKC5ib290LWxheW91dC5oYXMtZnVsbC1jYW52YXMpIHtcblx0QGluY2x1ZGUgYnJlYWstbWVkaXVtIHtcblx0XHQvLyBSZXNldCB0aGUgaHRtbC53cC10b3BiYXIgcGFkZGluZy5cblx0XHQvLyBCZWNhdXNlIHRoaXMgdXNlcyBuZWdhdGl2ZSBtYXJnaW5zLCB3ZSBoYXZlIHRvIGNvbXBlbnNhdGUgZm9yIHRoZSBoZWlnaHQuXG5cdFx0bWFyZ2luLXRvcDogLSB2YXJpYWJsZXMuJGFkbWluLWJhci1oZWlnaHQ7XG5cdFx0aGVpZ2h0OiBjYWxjKDEwMCUgKyAjeyB2YXJpYWJsZXMuJGFkbWluLWJhci1oZWlnaHQgfSk7XG5cblx0XHQjYWRtaW5tZW51bWFpbixcblx0XHQjd3BhZG1pbmJhciB7XG5cdFx0XHRkaXNwbGF5OiBub25lO1xuXHRcdH1cblxuXHRcdCN3cGNvbnRlbnQsXG5cdFx0I3dwZm9vdGVyIHtcblx0XHRcdG1hcmdpbi1sZWZ0OiAwO1xuXHRcdH1cblx0fVxufVxuXG4uYm9vdC1sYXlvdXQgLmNvbXBvbmVudHMtZWRpdG9yLW5vdGljZXNfX3NuYWNrYmFyIHtcblx0cG9zaXRpb246IGZpeGVkO1xuXHRyaWdodDogMDtcblx0Ym90dG9tOiAxNnB4O1xuXHRwYWRkaW5nLWxlZnQ6IDE2cHg7XG5cdHBhZGRpbmctcmlnaHQ6IDE2cHg7XG59XG4iXX0= */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css12 ) );
const css22 = `/**
 * Colors
 */
@media (max-width: 782px) {
  * {
    view-transition-name: none !important;
  }
}
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 250ms;
}

@media not (prefers-reduced-motion: reduce) {
  .boot-layout__canvas .interface-interface-skeleton__header {
    view-transition-name: boot--canvas-header;
  }
  .boot-layout__canvas .interface-interface-skeleton__sidebar {
    view-transition-name: boot--canvas-sidebar;
  }
  .boot-layout.has-full-canvas .boot-layout__canvas .boot-site-icon-link,
  .boot-layout:not(.has-full-canvas) .boot-site-hub .boot-site-icon-link {
    view-transition-name: boot--site-icon-link;
  }
  .boot-layout__stage {
    view-transition-name: boot--stage;
  }
  .boot-layout__inspector {
    view-transition-name: boot--inspector;
  }
  .boot-layout__canvas:not(.is-full-canvas),
  .boot-layout__canvas.is-full-canvas .interface-interface-skeleton__content {
    view-transition-name: boot--canvas;
  }
  @supports (-webkit-hyphens: none) and (not (-moz-appearance: none)) {
    .boot-layout__stage {
      view-transition-name: boot-safari--stage;
    }
    .boot-layout__inspector {
      view-transition-name: boot-safari--inspector;
    }
    .boot-layout__canvas:not(.is-full-canvas),
    .boot-layout__canvas.is-full-canvas .interface-interface-skeleton__content {
      view-transition-name: boot-safari--canvas;
    }
  }
  .components-popover:first-of-type {
    view-transition-name: boot--components-popover;
  }
}
::view-transition-group(boot--canvas-header),
::view-transition-group(boot--canvas-sidebar),
::view-transition-group(boot-safari--canvas),
::view-transition-group(boot--canvas) {
  z-index: 1;
}

::view-transition-group(boot--site-icon-link) {
  z-index: 2;
}

::view-transition-new(boot--site-icon-link),
::view-transition-old(boot--site-icon-link) {
  animation: none;
}

::view-transition-new(boot-safari--canvas),
::view-transition-old(boot-safari--canvas),
::view-transition-new(boot-safari--stage),
::view-transition-old(boot-safari--stage),
::view-transition-old(boot-safari--inspector),
::view-transition-new(boot-safari--inspector) {
  width: auto;
}

::view-transition-new(boot--canvas),
::view-transition-old(boot--canvas),
::view-transition-new(boot--stage),
::view-transition-old(boot--stage),
::view-transition-new(boot--inspector),
::view-transition-old(boot--inspector) {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  object-fit: none;
  object-position: left top;
  overflow: hidden;
}

::view-transition-new(boot--canvas),
::view-transition-old(boot--canvas) {
  object-position: center top;
}

::view-transition-old(boot-safari--inspector):only-child,
::view-transition-old(boot--inspector):only-child,
::view-transition-old(boot-safari--stage):only-child,
::view-transition-old(boot--stage):only-child {
  animation-name: zoomOut;
  will-change: transform, opacity;
}

::view-transition-new(boot-safari--inspector):only-child,
::view-transition-new(boot--inspector):only-child,
::view-transition-new(boot-safari--stage):only-child,
::view-transition-new(boot--stage):only-child {
  animation-name: zoomIn;
  will-change: transform, opacity;
}

@keyframes zoomOut {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.9);
    opacity: 0;
  }
}
@keyframes zoomIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
::view-transition-new(boot-safari--canvas):only-child,
::view-transition-new(boot--canvas):only-child {
  animation-name: slideFromRight;
  will-change: transform;
}

::view-transition-old(boot-safari--canvas):only-child,
::view-transition-old(boot--canvas):only-child {
  animation-name: slideToRight;
  will-change: transform;
}

@keyframes slideFromRight {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes slideToRight {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100vw);
  }
}
::view-transition-new(boot--canvas-header):only-child {
  animation-name: slideHeaderFromTop;
  will-change: transform;
}

::view-transition-old(boot--canvas-header):only-child {
  animation-name: slideHeaderToTop;
  will-change: transform;
}

@keyframes slideHeaderFromTop {
  from {
    transform: translateY(-100%);
  }
}
@keyframes slideHeaderToTop {
  to {
    transform: translateY(-100%);
  }
}
::view-transition-new(boot--canvas-sidebar):only-child {
  animation-name: slideSidebarFromRight;
  will-change: transform;
}

::view-transition-old(boot--canvas-sidebar):only-child {
  animation-name: slideSidebarToRight;
  will-change: transform;
}

@keyframes slideSidebarFromRight {
  from {
    transform: translateX(100%);
  }
}
@keyframes slideSidebarToRight {
  to {
    transform: translateX(100%);
  }
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL2hvbWUvcnVubmVyL3dvcmsvZ3V0ZW5iZXJnL2d1dGVuYmVyZy9wdWJsaXNoL3BhY2thZ2VzL2Jvb3Qvc3JjIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9fY29sb3JzLnNjc3MiLCJ2aWV3LXRyYW5zaXRpb25zLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FDSUE7RUFDQztJQUNDOzs7QUFJRjtBQUFBO0VBRUM7OztBQUdEO0VBQ0M7SUFDQzs7RUFHRDtJQUNDOztFQUdEO0FBQUE7SUFNQzs7RUFJRDtJQUNDOztFQUdEO0lBQ0M7O0VBR0Q7QUFBQTtJQUdDOztFQUtEO0lBQ0M7TUFDQzs7SUFHRDtNQUNDOztJQUdEO0FBQUE7TUFHQzs7O0VBTUY7SUFDQzs7O0FBSUY7QUFBQTtBQUFBO0FBQUE7RUFJQzs7O0FBR0Q7RUFDQzs7O0FBR0Q7QUFBQTtFQUVDOzs7QUFJRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7RUFNQzs7O0FBS0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0VBTUMsWUQ3Rk87RUM4RlA7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOzs7QUFHRDtBQUFBO0VBRUM7OztBQUdEO0FBQUE7QUFBQTtBQUFBO0VBSUM7RUFDQTs7O0FBR0Q7QUFBQTtBQUFBO0FBQUE7RUFJQztFQUNBOzs7QUFHRDtFQUNDO0lBQ0M7SUFDQTs7RUFHRDtJQUNDO0lBQ0E7OztBQUlGO0VBQ0M7SUFDQztJQUNBOztFQUdEO0lBQ0M7SUFDQTs7O0FBSUY7QUFBQTtFQUVDO0VBQ0E7OztBQUdEO0FBQUE7RUFFQztFQUNBOzs7QUFHRDtFQUNDO0lBSUM7O0VBR0Q7SUFDQzs7O0FBSUY7RUFDQztJQUNDOztFQUdEO0lBQ0M7OztBQUlGO0VBQ0M7RUFDQTs7O0FBR0Q7RUFDQztFQUNBOzs7QUFHRDtFQUNDO0lBQ0M7OztBQUlGO0VBQ0M7SUFDQzs7O0FBSUY7RUFDQztFQUNBOzs7QUFHRDtFQUNDO0VBQ0E7OztBQUdEO0VBQ0M7SUFDQzs7O0FBSUY7RUFDQztJQUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb2xvcnNcbiAqL1xuXG4vLyBXb3JkUHJlc3MgZ3JheXMuXG4kYmxhY2s6ICMwMDA7XHRcdFx0Ly8gVXNlIG9ubHkgd2hlbiB5b3UgdHJ1bHkgbmVlZCBwdXJlIGJsYWNrLiBGb3IgVUksIHVzZSAkZ3JheS05MDAuXG4kZ3JheS05MDA6ICMxZTFlMWU7XG4kZ3JheS04MDA6ICMyZjJmMmY7XG4kZ3JheS03MDA6ICM3NTc1NzU7XHRcdC8vIE1lZXRzIDQuNjoxICg0LjU6MSBpcyBtaW5pbXVtKSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS02MDA6ICM5NDk0OTQ7XHRcdC8vIE1lZXRzIDM6MSBVSSBvciBsYXJnZSB0ZXh0IGNvbnRyYXN0IGFnYWluc3Qgd2hpdGUuXG4kZ3JheS00MDA6ICNjY2M7XG4kZ3JheS0zMDA6ICNkZGQ7XHRcdC8vIFVzZWQgZm9yIG1vc3QgYm9yZGVycy5cbiRncmF5LTIwMDogI2UwZTBlMDtcdFx0Ly8gVXNlZCBzcGFyaW5nbHkgZm9yIGxpZ2h0IGJvcmRlcnMuXG4kZ3JheS0xMDA6ICNmMGYwZjA7XHRcdC8vIFVzZWQgZm9yIGxpZ2h0IGdyYXkgYmFja2dyb3VuZHMuXG4kd2hpdGU6ICNmZmY7XG5cbi8vIE9wYWNpdGllcyAmIGFkZGl0aW9uYWwgY29sb3JzLlxuJGRhcmstZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkZ3JheS05MDAsIDAuNjIpO1xuJG1lZGl1bS1ncmF5LXBsYWNlaG9sZGVyOiByZ2JhKCRncmF5LTkwMCwgMC41NSk7XG4kbGlnaHQtZ3JheS1wbGFjZWhvbGRlcjogcmdiYSgkd2hpdGUsIDAuNjUpO1xuXG4vLyBBbGVydCBjb2xvcnMuXG4kYWxlcnQteWVsbG93OiAjZjBiODQ5O1xuJGFsZXJ0LXJlZDogI2NjMTgxODtcbiRhbGVydC1ncmVlbjogIzRhYjg2NjtcblxuLy8gRGVwcmVjYXRlZCwgcGxlYXNlIGF2b2lkIHVzaW5nIHRoZXNlLlxuJGRhcmstdGhlbWUtZm9jdXM6ICR3aGl0ZTtcdC8vIEZvY3VzIGNvbG9yIHdoZW4gdGhlIHRoZW1lIGlzIGRhcmsuXG4iLCJAdXNlIFwiQHdvcmRwcmVzcy9iYXNlLXN0eWxlcy9jb2xvcnNcIjtcblxuLy8gRGlzYWJsZSB2aWV3IHRyYW5zaXRpb25zIG9uIG1vYmlsZSBkZXZpY2VzXG4vLyB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBzaWRlYmFyIG5hdmlnYXRpb24uXG5AbWVkaWEgKG1heC13aWR0aDogNzgycHgpIHtcblx0KiB7XG5cdFx0dmlldy10cmFuc2l0aW9uLW5hbWU6IG5vbmUgIWltcG9ydGFudDtcblx0fVxufVxuXG46OnZpZXctdHJhbnNpdGlvbi1vbGQocm9vdCksXG46OnZpZXctdHJhbnNpdGlvbi1uZXcocm9vdCkge1xuXHRhbmltYXRpb24tZHVyYXRpb246IDI1MG1zO1xufVxuXG5AbWVkaWEgbm90IChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpIHtcblx0LmJvb3QtbGF5b3V0X19jYW52YXMgLmludGVyZmFjZS1pbnRlcmZhY2Utc2tlbGV0b25fX2hlYWRlciB7XG5cdFx0dmlldy10cmFuc2l0aW9uLW5hbWU6IGJvb3QtLWNhbnZhcy1oZWFkZXI7XG5cdH1cblxuXHQuYm9vdC1sYXlvdXRfX2NhbnZhcyAuaW50ZXJmYWNlLWludGVyZmFjZS1za2VsZXRvbl9fc2lkZWJhciB7XG5cdFx0dmlldy10cmFuc2l0aW9uLW5hbWU6IGJvb3QtLWNhbnZhcy1zaWRlYmFyO1xuXHR9XG5cblx0LmJvb3QtbGF5b3V0Lmhhcy1mdWxsLWNhbnZhc1xuXHQuYm9vdC1sYXlvdXRfX2NhbnZhc1xuXHQuYm9vdC1zaXRlLWljb24tbGluayxcblx0LmJvb3QtbGF5b3V0Om5vdCguaGFzLWZ1bGwtY2FudmFzKVxuXHQuYm9vdC1zaXRlLWh1YlxuXHQuYm9vdC1zaXRlLWljb24tbGluayB7XG5cdFx0dmlldy10cmFuc2l0aW9uLW5hbWU6IGJvb3QtLXNpdGUtaWNvbi1saW5rO1xuXHR9XG5cblx0Ly8gRGVmYXVsdCAobm9uLVNhZmFyaSkgdmlldyB0cmFuc2l0aW9uIG5hbWVzXG5cdC5ib290LWxheW91dF9fc3RhZ2Uge1xuXHRcdHZpZXctdHJhbnNpdGlvbi1uYW1lOiBib290LS1zdGFnZTtcblx0fVxuXG5cdC5ib290LWxheW91dF9faW5zcGVjdG9yIHtcblx0XHR2aWV3LXRyYW5zaXRpb24tbmFtZTogYm9vdC0taW5zcGVjdG9yO1xuXHR9XG5cblx0LmJvb3QtbGF5b3V0X19jYW52YXM6bm90KC5pcy1mdWxsLWNhbnZhcyksXG5cdC5ib290LWxheW91dF9fY2FudmFzLmlzLWZ1bGwtY2FudmFzXG5cdC5pbnRlcmZhY2UtaW50ZXJmYWNlLXNrZWxldG9uX19jb250ZW50IHtcblx0XHR2aWV3LXRyYW5zaXRpb24tbmFtZTogYm9vdC0tY2FudmFzO1xuXHR9XG5cblx0Ly8gU2FmYXJpLXNwZWNpZmljIHZpZXcgdHJhbnNpdGlvbiBuYW1lc1xuXHQvLyBVc2VzIENTUyBmZWF0dXJlIGRldGVjdGlvbiBpbnN0ZWFkIG9mIC5pcy1zYWZhcmkgY2xhc3Ncblx0QHN1cHBvcnRzICgtd2Via2l0LWh5cGhlbnM6bm9uZSkgYW5kIChub3QgKC1tb3otYXBwZWFyYW5jZTpub25lKSkge1xuXHRcdC5ib290LWxheW91dF9fc3RhZ2Uge1xuXHRcdFx0dmlldy10cmFuc2l0aW9uLW5hbWU6IGJvb3Qtc2FmYXJpLS1zdGFnZTtcblx0XHR9XG5cblx0XHQuYm9vdC1sYXlvdXRfX2luc3BlY3RvciB7XG5cdFx0XHR2aWV3LXRyYW5zaXRpb24tbmFtZTogYm9vdC1zYWZhcmktLWluc3BlY3Rvcjtcblx0XHR9XG5cblx0XHQuYm9vdC1sYXlvdXRfX2NhbnZhczpub3QoLmlzLWZ1bGwtY2FudmFzKSxcblx0XHQuYm9vdC1sYXlvdXRfX2NhbnZhcy5pcy1mdWxsLWNhbnZhc1xuXHRcdC5pbnRlcmZhY2UtaW50ZXJmYWNlLXNrZWxldG9uX19jb250ZW50IHtcblx0XHRcdHZpZXctdHJhbnNpdGlvbi1uYW1lOiBib290LXNhZmFyaS0tY2FudmFzO1xuXHRcdH1cblx0fVxuXG5cdC8vIEZvciBhbnkgcG9wb3ZlciB0aGF0IHN0YXlzIG9wZW4gYWNyb3NzIGEgcXVlcnkgY2hhbmdlLlxuXHQvLyBOYW1pbmcgaXQgYXZvaWRzIHRoZSBzdGFnZSBvdmVybGF5aW5nIGl0LlxuXHQuY29tcG9uZW50cy1wb3BvdmVyOmZpcnN0LW9mLXR5cGUge1xuXHRcdHZpZXctdHJhbnNpdGlvbi1uYW1lOiBib290LS1jb21wb25lbnRzLXBvcG92ZXI7XG5cdH1cbn1cblxuOjp2aWV3LXRyYW5zaXRpb24tZ3JvdXAoYm9vdC0tY2FudmFzLWhlYWRlciksXG46OnZpZXctdHJhbnNpdGlvbi1ncm91cChib290LS1jYW52YXMtc2lkZWJhciksXG46OnZpZXctdHJhbnNpdGlvbi1ncm91cChib290LXNhZmFyaS0tY2FudmFzKSxcbjo6dmlldy10cmFuc2l0aW9uLWdyb3VwKGJvb3QtLWNhbnZhcykge1xuXHR6LWluZGV4OiAxO1xufVxuXG46OnZpZXctdHJhbnNpdGlvbi1ncm91cChib290LS1zaXRlLWljb24tbGluaykge1xuXHR6LWluZGV4OiAyO1xufVxuXG46OnZpZXctdHJhbnNpdGlvbi1uZXcoYm9vdC0tc2l0ZS1pY29uLWxpbmspLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3QtLXNpdGUtaWNvbi1saW5rKSB7XG5cdGFuaW1hdGlvbjogbm9uZTtcbn1cblxuLy8gU2FmYXJpLXNwZWNpZmljIHBzZXVkby1lbGVtZW50IHN0eWxlcyB3aXRoIHdpZHRoOiBhdXRvIGZpeFxuOjp2aWV3LXRyYW5zaXRpb24tbmV3KGJvb3Qtc2FmYXJpLS1jYW52YXMpLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3Qtc2FmYXJpLS1jYW52YXMpLFxuOjp2aWV3LXRyYW5zaXRpb24tbmV3KGJvb3Qtc2FmYXJpLS1zdGFnZSksXG46OnZpZXctdHJhbnNpdGlvbi1vbGQoYm9vdC1zYWZhcmktLXN0YWdlKSxcbjo6dmlldy10cmFuc2l0aW9uLW9sZChib290LXNhZmFyaS0taW5zcGVjdG9yKSxcbjo6dmlldy10cmFuc2l0aW9uLW5ldyhib290LXNhZmFyaS0taW5zcGVjdG9yKSB7XG5cdHdpZHRoOiBhdXRvO1xufVxuXG4vLyBTYWZhcmkgdHJpcHMgdXAgd2l0aCB1c2luZyBvYmplY3QgZml0IG9uIHRoZSBwc2V1ZG8gaW1hZ2VzIGFuZCBmaWxsaW5nIG91dFxuLy8gYmFja2dyb3VuZC5cbjo6dmlldy10cmFuc2l0aW9uLW5ldyhib290LS1jYW52YXMpLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3QtLWNhbnZhcyksXG46OnZpZXctdHJhbnNpdGlvbi1uZXcoYm9vdC0tc3RhZ2UpLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3QtLXN0YWdlKSxcbjo6dmlldy10cmFuc2l0aW9uLW5ldyhib290LS1pbnNwZWN0b3IpLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3QtLWluc3BlY3Rvcikge1xuXHRiYWNrZ3JvdW5kOiBjb2xvcnMuJHdoaXRlO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdHdpZHRoOiAxMDAlO1xuXHRoZWlnaHQ6IDEwMCU7XG5cdG9iamVjdC1maXQ6IG5vbmU7XG5cdG9iamVjdC1wb3NpdGlvbjogbGVmdCB0b3A7XG5cdG92ZXJmbG93OiBoaWRkZW47XG59XG5cbjo6dmlldy10cmFuc2l0aW9uLW5ldyhib290LS1jYW52YXMpLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3QtLWNhbnZhcykge1xuXHRvYmplY3QtcG9zaXRpb246IGNlbnRlciB0b3A7XG59XG5cbjo6dmlldy10cmFuc2l0aW9uLW9sZChib290LXNhZmFyaS0taW5zcGVjdG9yKTpvbmx5LWNoaWxkLFxuOjp2aWV3LXRyYW5zaXRpb24tb2xkKGJvb3QtLWluc3BlY3Rvcik6b25seS1jaGlsZCxcbjo6dmlldy10cmFuc2l0aW9uLW9sZChib290LXNhZmFyaS0tc3RhZ2UpOm9ubHktY2hpbGQsXG46OnZpZXctdHJhbnNpdGlvbi1vbGQoYm9vdC0tc3RhZ2UpOm9ubHktY2hpbGQge1xuXHRhbmltYXRpb24tbmFtZTogem9vbU91dDtcblx0d2lsbC1jaGFuZ2U6IHRyYW5zZm9ybSwgb3BhY2l0eTtcbn1cblxuOjp2aWV3LXRyYW5zaXRpb24tbmV3KGJvb3Qtc2FmYXJpLS1pbnNwZWN0b3IpOm9ubHktY2hpbGQsXG46OnZpZXctdHJhbnNpdGlvbi1uZXcoYm9vdC0taW5zcGVjdG9yKTpvbmx5LWNoaWxkLFxuOjp2aWV3LXRyYW5zaXRpb24tbmV3KGJvb3Qtc2FmYXJpLS1zdGFnZSk6b25seS1jaGlsZCxcbjo6dmlldy10cmFuc2l0aW9uLW5ldyhib290LS1zdGFnZSk6b25seS1jaGlsZCB7XG5cdGFuaW1hdGlvbi1uYW1lOiB6b29tSW47XG5cdHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm0sIG9wYWNpdHk7XG59XG5cbkBrZXlmcmFtZXMgem9vbU91dCB7XG5cdGZyb20ge1xuXHRcdHRyYW5zZm9ybTogc2NhbGUoMSk7XG5cdFx0b3BhY2l0eTogMTtcblx0fVxuXG5cdHRvIHtcblx0XHR0cmFuc2Zvcm06IHNjYWxlKDAuOSk7XG5cdFx0b3BhY2l0eTogMDtcblx0fVxufVxuXG5Aa2V5ZnJhbWVzIHpvb21JbiB7XG5cdGZyb20ge1xuXHRcdHRyYW5zZm9ybTogc2NhbGUoMC45NSk7XG5cdFx0b3BhY2l0eTogMDtcblx0fVxuXG5cdHRvIHtcblx0XHR0cmFuc2Zvcm06IHNjYWxlKDEpO1xuXHRcdG9wYWNpdHk6IDE7XG5cdH1cbn1cblxuOjp2aWV3LXRyYW5zaXRpb24tbmV3KGJvb3Qtc2FmYXJpLS1jYW52YXMpOm9ubHktY2hpbGQsXG46OnZpZXctdHJhbnNpdGlvbi1uZXcoYm9vdC0tY2FudmFzKTpvbmx5LWNoaWxkIHtcblx0YW5pbWF0aW9uLW5hbWU6IHNsaWRlRnJvbVJpZ2h0O1xuXHR3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xufVxuXG46OnZpZXctdHJhbnNpdGlvbi1vbGQoYm9vdC1zYWZhcmktLWNhbnZhcyk6b25seS1jaGlsZCxcbjo6dmlldy10cmFuc2l0aW9uLW9sZChib290LS1jYW52YXMpOm9ubHktY2hpbGQge1xuXHRhbmltYXRpb24tbmFtZTogc2xpZGVUb1JpZ2h0O1xuXHR3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xufVxuXG5Aa2V5ZnJhbWVzIHNsaWRlRnJvbVJpZ2h0IHtcblx0ZnJvbSB7XG5cdFx0Ly8gU2hvdWxkIGlkZWFsbHkgYmUgMTAwJSArIDE2cHgsIGJ1dCB3ZSBhbHNvIG5lZWQgdG8gdGFrZSBpbnRvIGFjY291bnRcblx0XHQvLyB0aGF0IHRoZSBjYW52YXMgY2FuIGJlIHRoZSBlZGl0b3ItaW50ZXJmYWNlLXNrZWxldG9uX19jb250ZW50LCB3aGljaFxuXHRcdC8vIG5vdCBwbGFjZWQgb24gdGhlIHJpZ2h0IHNpZGUuXG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMHZ3KTtcblx0fVxuXG5cdHRvIHtcblx0XHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG5cdH1cbn1cblxuQGtleWZyYW1lcyBzbGlkZVRvUmlnaHQge1xuXHRmcm9tIHtcblx0XHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG5cdH1cblxuXHR0byB7XG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMHZ3KTtcblx0fVxufVxuXG46OnZpZXctdHJhbnNpdGlvbi1uZXcoYm9vdC0tY2FudmFzLWhlYWRlcik6b25seS1jaGlsZCB7XG5cdGFuaW1hdGlvbi1uYW1lOiBzbGlkZUhlYWRlckZyb21Ub3A7XG5cdHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm07XG59XG5cbjo6dmlldy10cmFuc2l0aW9uLW9sZChib290LS1jYW52YXMtaGVhZGVyKTpvbmx5LWNoaWxkIHtcblx0YW5pbWF0aW9uLW5hbWU6IHNsaWRlSGVhZGVyVG9Ub3A7XG5cdHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm07XG59XG5cbkBrZXlmcmFtZXMgc2xpZGVIZWFkZXJGcm9tVG9wIHtcblx0ZnJvbSB7XG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xMDAlKTtcblx0fVxufVxuXG5Aa2V5ZnJhbWVzIHNsaWRlSGVhZGVyVG9Ub3Age1xuXHR0byB7XG5cdFx0dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xMDAlKTtcblx0fVxufVxuXG46OnZpZXctdHJhbnNpdGlvbi1uZXcoYm9vdC0tY2FudmFzLXNpZGViYXIpOm9ubHktY2hpbGQge1xuXHRhbmltYXRpb24tbmFtZTogc2xpZGVTaWRlYmFyRnJvbVJpZ2h0O1xuXHR3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xufVxuXG46OnZpZXctdHJhbnNpdGlvbi1vbGQoYm9vdC0tY2FudmFzLXNpZGViYXIpOm9ubHktY2hpbGQge1xuXHRhbmltYXRpb24tbmFtZTogc2xpZGVTaWRlYmFyVG9SaWdodDtcblx0d2lsbC1jaGFuZ2U6IHRyYW5zZm9ybTtcbn1cblxuQGtleWZyYW1lcyBzbGlkZVNpZGViYXJGcm9tUmlnaHQge1xuXHRmcm9tIHtcblx0XHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTAwJSk7XG5cdH1cbn1cblxuQGtleWZyYW1lcyBzbGlkZVNpZGViYXJUb1JpZ2h0IHtcblx0dG8ge1xuXHRcdHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMDAlKTtcblx0fVxufVxuIl19 */`;
document.head
	.appendChild( document.createElement( 'style' ) )
	.appendChild( document.createTextNode( css22 ) );
export { init, initSinglePage, store };
//# sourceMappingURL=index.js.map
