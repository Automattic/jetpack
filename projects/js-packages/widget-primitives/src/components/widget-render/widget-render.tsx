/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { getLazyWidgetComponent } from '../../tools/get-lazy-widget-component';
import type { ResolveWidgetModule, WidgetErrorConfig, WidgetType } from '../../types';

interface WidgetRenderProps< Item = unknown > {
	widgetType: WidgetType< Item >;
	attributes?: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
	setError?: ( error: WidgetErrorConfig | true | null ) => void;
	resolveWidgetModule: ResolveWidgetModule;
}

/*
 * Host-agnostic render entry point for any widget type. Resolves the
 * widget's `renderModule` through the host-provided
 * `resolveWidgetModule` and mounts the resulting component with the
 * standard `attributes` plus `setAttributes` render contract.
 */
/**
 *
 * @param root0
 * @param root0.widgetType
 * @param root0.attributes
 * @param root0.setAttributes
 * @param root0.setError
 * @param root0.resolveWidgetModule
 */
export function WidgetRender< Item = unknown >( {
	widgetType,
	attributes,
	setAttributes,
	setError,
	resolveWidgetModule,
}: WidgetRenderProps< Item > ) {
	const WidgetComponent = getLazyWidgetComponent( widgetType.renderModule, resolveWidgetModule );

	return (
		<>
			{ /* WidgetComponent is a cached `lazy()` keyed by renderModule, so its identity stays stable across renders. */ }
			{  }
			<WidgetComponent
				attributes={ attributes }
				setAttributes={ setAttributes }
				setError={ setError }
			/>
		</>
	);
}
