/**
 * External dependencies
 */
import { createElement } from '@wordpress/element';
import { getLockedWidgetFeature } from '@jetpack-premium-analytics/data';
import { LockedWidget } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ResolveWidgetModule, WidgetType } from '@wordpress/widget-primitives';

type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;

/**
 * Render module id a plan-locked type points at. The dashboard caches each lazy component by
 * module id, so swapping the component behind the real id would not take.
 */
export const LOCKED_RENDER_MODULE_PREFIX = 'jetpack-premium-analytics/locked:';

/**
 * Point every plan-locked type at the locked module. The type stays in the list, or a placed
 * instance would render as no longer available.
 *
 * @param types - Widget types.
 * @return The types, or the same array when none is locked.
 */
export function withPlanLockedRenderModules( types: WidgetType[] ): WidgetType[] {
	if ( ! types.some( type => getLockedWidgetFeature( type.name ) ) ) {
		return types;
	}

	return types.map( type =>
		getLockedWidgetFeature( type.name )
			? {
					...type,
					renderModule: LOCKED_RENDER_MODULE_PREFIX + type.name,
					// A control that fetches its options, like Year in review's years, would request locked data.
					attributes: type.attributes?.filter( attribute => ! attribute.getElements ),
				}
			: type
	);
}

/**
 * The locked module for a locked id, or undefined for any other id.
 *
 * @param moduleId - A render module id.
 * @return The module.
 */
export function resolvePlanLockedWidgetModule( moduleId: string ): WidgetModule | undefined {
	if ( ! moduleId.startsWith( LOCKED_RENDER_MODULE_PREFIX ) ) {
		return undefined;
	}

	const feature = getLockedWidgetFeature( moduleId.slice( LOCKED_RENDER_MODULE_PREFIX.length ) );
	if ( ! feature ) {
		return undefined;
	}

	return { default: () => createElement( LockedWidget, { feature } ) } as WidgetModule;
}
