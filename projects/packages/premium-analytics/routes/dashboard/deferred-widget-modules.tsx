/**
 * External dependencies
 */
import { GenericSkeleton } from '@jetpack-premium-analytics/widgets-toolkit';
import { lazy, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './deferred-widget-modules.module.scss';
import type { ResolveWidgetModule, WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType, ReactNode } from 'react';
/**
 * Internal dependencies
 */

type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;

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
 * Render a skeleton until the widget is near the visible area, then its content.
 *
 * Checked on layout, not on the observer's first callback, so a widget on screen mounts in the
 * same frame. Without `IntersectionObserver` (tests, old browsers) everything renders at once.
 *
 * @param props          - Component props.
 * @param props.children - The widget content.
 * @return The skeleton or the content.
 */
function NearViewport( { children }: { children: ReactNode } ) {
	const ref = useRef< HTMLDivElement >( null );
	const [ isNear, setIsNear ] = useState( () => typeof IntersectionObserver === 'undefined' );

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

	return isNear ? (
		children
	) : (
		<div ref={ ref } className={ styles.placeholder }>
			<GenericSkeleton />
		</div>
	);
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
			const Widget = lazy( () => resolve( moduleId ) ) as ComponentType<
				WidgetRenderProps< unknown >
			>;
			module = {
				default: ( props: WidgetRenderProps< unknown > ) => (
					<NearViewport>
						<Widget { ...props } />
					</NearViewport>
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
