/**
 * External dependencies
 */
import {
	SessionsByDeviceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { SessionsByDeviceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SessionsByDeviceRenderAttributes = SessionsByDeviceAttributes &
	Partial< ReportParamsFieldAttributes >;

type SessionsByDeviceWidgetProps = WidgetRenderProps< SessionsByDeviceRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sessions by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SessionsByDeviceWidget
 * fetches the sessions-by-device report and renders the device breakdown.
 *
 * @param {SessionsByDeviceWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SessionsByDeviceRender( {
	attributes = {},
	setError,
}: SessionsByDeviceWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SessionsByDeviceWidget />
		</WidgetRoot>
	);
}
