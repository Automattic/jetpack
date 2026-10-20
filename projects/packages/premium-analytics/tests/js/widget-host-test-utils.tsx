/**
 * External dependencies
 */
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';
import type { ReactNode } from 'react';

/**
 * A widget host that records the actions a widget declares, as the dashboard would place them.
 *
 * @return The host to render the widget under, and a reader of its current actions.
 */
export function createWidgetActionsHost() {
	const declare = jest.fn();
	const host = { actions: { declare } };

	/**
	 *
	 * @param root0
	 * @param root0.children
	 */
	/**
	 * Render a widget under the recording host.
	 *
	 * @param props          - Component props.
	 * @param props.children - The widget under test.
	 * @return The provider.
	 */
	function WidgetActionsHost( { children }: { children: ReactNode } ) {
		return <WidgetHostProvider value={ host }>{ children }</WidgetHostProvider>;
	}

	return {
		WidgetActionsHost,
		// The widget's current actions: the last list it declared.
		declaredActions: (): WidgetRuntimeAction[] => declare.mock.calls.at( -1 )?.[ 0 ] ?? [],
	};
}
