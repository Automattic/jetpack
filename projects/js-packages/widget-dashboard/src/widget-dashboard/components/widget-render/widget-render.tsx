/**
 * External dependencies
 */
import { WidgetRender } from '@automattic/jetpack-widget-primitives';
import type { WidgetErrorConfig, WidgetType } from '@automattic/jetpack-widget-primitives';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { DashboardWidget } from '../../types';

interface DashboardWidgetRenderProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
	setError?: ( error: WidgetErrorConfig | true | null ) => void;
}

/*
 * Dashboard-specific adapter around the host-agnostic `WidgetRender`
 * primitive. Bridges the dashboard context (`resolveWidgetModule`, layout
 * state) and turns layout-level attribute updates into the per-instance
 * `setAttributes` callback the render contract expects.
 */
/**
 *
 * @param root0
 * @param root0.widget
 * @param root0.widgetType
 * @param root0.setError
 */
export function DashboardWidgetRender( {
	widget,
	widgetType,
	setError,
}: DashboardWidgetRenderProps ) {
	const { layout, onLayoutChange, resolveWidgetModule } = useDashboardInternalContext();

	const setAttributes = useCallback(
		( next: Partial< unknown > ) => {
			onLayoutChange(
				layout.map( w =>
					w.uuid === widget.uuid
						? {
								...w,
								attributes: {
									...( w.attributes as object ),
									...( next as object ),
								},
						  }
						: w
				)
			);
		},
		[ widget.uuid, layout, onLayoutChange ]
	);

	return (
		<WidgetRender
			widgetType={ widgetType }
			attributes={ widget.attributes }
			setAttributes={ setAttributes }
			setError={ setError }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}
