/**
 * External dependencies
 */
import { GenericSkeleton } from '@jetpack-premium-analytics/widgets-toolkit';
import { lazy, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ResolveWidgetModule, WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType, ReactNode } from 'react';

type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;

/**
 * How far below the viewport a widget starts loading: half a screen, so the next row is
 * usually ready before it scrolls in.
 */
const LOAD_MARGIN = 0.5;

/**
 * Whether an element sits within the load margin of the viewport.
 *
 * @param element - The element.
 * @return Whether it is near.
 */
function isNearViewport( element: HTMLElement ): boolean {
	const { top, bottom } = element.getBoundingClientRect();
	return bottom >= 0 && top <= window.innerHeight * ( 1 + LOAD_MARGIN );
}

/**
 * Render a skeleton until the widget is near the viewport, then its content.
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
		if ( isNearViewport( element ) ) {
			setIsNear( true );
			return;
		}

		const observer = new IntersectionObserver(
			entries => {
				if ( entries.some( entry => entry.isIntersecting ) ) {
					setIsNear( true );
				}
			},
			{ rootMargin: `0px 0px ${ LOAD_MARGIN * 100 }% 0px` }
		);
		observer.observe( element );
		return () => observer.disconnect();
	}, [ isNear ] );

	return isNear ? (
		children
	) : (
		<div ref={ ref }>
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
