import { SessionsByDeviceWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type SessionsByDeviceRenderProps = {
	attributes?: ComponentProps< typeof WidgetRoot >[ 'attributes' ];
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sessions by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SessionsByDeviceWidget
 * fetches the sessions-by-device report and renders the device breakdown.
 */
export default function SessionsByDeviceRender( {
	attributes,
	setError,
}: SessionsByDeviceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SessionsByDeviceWidget />
		</WidgetRoot>
	);
}
