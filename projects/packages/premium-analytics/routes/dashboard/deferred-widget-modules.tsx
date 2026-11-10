/**
 * External dependencies
 */
import { GenericSkeleton } from '@jetpack-premium-analytics/widgets-toolkit';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './deferred-widget-modules.module.scss';
import type { ResolveWidgetModule, WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';
/**
 * Internal dependencies
 */

type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;
type WidgetComponent = ComponentType< WidgetRenderProps< unknown > >;

/**
 * How far below the visible area a widget starts loading, as a share of its height: half a
 * screen, so the next row is usually ready before it scrolls in.
 */
const LOAD_MARGIN = 0.5;

/**
 * The element the widget scrolls in: the dashboard has its own scroll container, which clips
 * its children, so an observer rooted at the viewport would ignore the load margin. Only an
 * ancestor that overflows counts: the widget body is `overflow: auto` too.
 *
 * @param element - The widget's element.
 * @return The nearest scrolling ancestor, or null for the viewport.
 */
function getScrollRoot( element: HTMLElement ): HTMLElement | null {
	for ( let parent = element.parentElement; parent; parent = parent.parentElement ) {
		if (
			parent.scrollHeight > parent.clientHeight &&
			/(auto|scroll)/.test( window.getComputedStyle( parent ).overflowY )
		) {
			return parent;
		}
	}
	return null;
}

/**
 * Loads one render module once, however many widgets use it, and remembers the result.
 */
interface ModuleLoader {
	load: () => Promise< WidgetModule >;
	loaded: () => WidgetComponent | undefined;
}

/**
 * Render a skeleton until the widget is near the visible area and its module has loaded.
 *
 * Checked on layout, not on the observer's first callback, so a widget on screen starts loading
 * in the same frame. The module loads without suspending: the host has already suspended once
 * for this widget, and React throttles a second reveal under the same boundary by up to 300ms.
 *
 * @param props        - Component props.
 * @param props.loader - The widget's module loader.
 * @param props.props  - The widget's render props.
 * @return The skeleton or the widget.
 */
function NearViewport( {
	loader,
	props,
}: {
	loader: ModuleLoader;
	props: WidgetRenderProps< unknown >;
} ) {
	const ref = useRef< HTMLDivElement >( null );
	// Without `IntersectionObserver` (tests, old browsers) everything loads at once.
	const [ isNear, setIsNear ] = useState( () => typeof IntersectionObserver === 'undefined' );
	const [ state, setState ] = useState< { Widget?: WidgetComponent; error?: unknown } >( () => ( {
		Widget: loader.loaded(),
	} ) );

	useLayoutEffect( () => {
		const element = ref.current;
		if ( isNear || ! element ) {
			return;
		}

		const root = getScrollRoot( element );
		const visible = root
			? root.getBoundingClientRect()
			: { top: 0, bottom: window.innerHeight, height: window.innerHeight };
		const margin = Math.round( visible.height * LOAD_MARGIN );
		const { top, bottom } = element.getBoundingClientRect();
		if ( bottom >= visible.top && top <= visible.bottom + margin ) {
			setIsNear( true );
			return;
		}

		const observer = new IntersectionObserver(
			entries => {
				if ( entries.some( entry => entry.isIntersecting ) ) {
					setIsNear( true );
				}
			},
			{ root, rootMargin: `0px 0px ${ margin }px 0px` }
		);
		observer.observe( element );
		return () => observer.disconnect();
	}, [ isNear ] );

	useLayoutEffect( () => {
		if ( ! isNear || state.Widget ) {
			return;
		}
		let active = true;
		loader.load().then(
			module => active && setState( { Widget: module.default } ),
			error => active && setState( { error } )
		);
		return () => {
			active = false;
		};
	}, [ isNear, loader, state.Widget ] );

	if ( state.error ) {
		// Hand a failed load to the widget's error boundary, as a suspended import would.
		throw state.error;
	}

	const { Widget } = state;
	return isNear && Widget ? (
		<Widget { ...props } />
	) : (
		<div ref={ ref } className={ styles.placeholder }>
			<GenericSkeleton />
		</div>
	);
}

/**
 * A loader for one render module; a failed load is forgotten so the next mount retries it.
 *
 * @param resolve  - The dashboard's resolver.
 * @param moduleId - The render module id.
 * @return The loader.
 */
function createModuleLoader( resolve: ResolveWidgetModule, moduleId: string ): ModuleLoader {
	let pending: Promise< WidgetModule > | null = null;
	let Widget: WidgetComponent | undefined;

	return {
		load: () => {
			pending ??= resolve( moduleId ).then(
				module => {
					Widget = module.default;
					return module;
				},
				error => {
					pending = null;
					throw error;
				}
			);
			return pending;
		},
		loaded: () => Widget,
	};
}

/**
 * Wrap a resolver so each widget's render module loads only once the widget is near the viewport.
 *
 * The render module resolves at once to a stand-in that defers the real module, its translations
 * and its data requests, so widgets below the fold stop competing with those on screen. Ids that
 * are not render modules (metadata modules, plan-locked stand-ins) pass straight through.
 *
 * @param resolve       - The dashboard's resolver.
 * @param renderModules - The render module ids to defer.
 * @return The deferring resolver.
 */
export function deferOffscreenWidgets(
	resolve: ResolveWidgetModule,
	renderModules: ReadonlySet< string >
): ResolveWidgetModule {
	const deferred = new Map< string, WidgetModule >();

	return moduleId => {
		if ( ! renderModules.has( moduleId ) ) {
			return resolve( moduleId );
		}

		let module = deferred.get( moduleId );
		if ( ! module ) {
			const loader = createModuleLoader( resolve, moduleId );
			module = {
				default: ( props: WidgetRenderProps< unknown > ) => (
					<NearViewport loader={ loader } props={ props } />
				),
			};
			deferred.set( moduleId, module );
		}
		return Promise.resolve( module );
	};
}

/**
 * `deferOffscreenWidgets()` as a hook, rebuilt only when the resolver or the records change.
 *
 * @param resolve - The dashboard's resolver.
 * @param records - Widget module records, or `null`/`undefined` while loading.
 * @return The deferring resolver.
 */
export function useDeferOffscreenWidgets(
	resolve: ResolveWidgetModule,
	records: ReadonlyArray< { render_module?: string | null } > | null | undefined
): ResolveWidgetModule {
	return useMemo(
		() =>
			deferOffscreenWidgets(
				resolve,
				new Set(
					( records ?? [] ).flatMap( record =>
						record.render_module ? [ record.render_module ] : []
					)
				)
			),
		[ resolve, records ]
	);
}
