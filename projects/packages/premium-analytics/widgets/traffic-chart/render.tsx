/**
 * Internal dependencies
 */
import { TrafficChartWidget } from './components/traffic-chart';
import { WidgetRoot } from './components/widget-root';
import type { TrafficChartAttributes } from './types';

type TrafficChartRenderProps = {
	attributes?: TrafficChartAttributes;
};

/**
 * Default range when the widget has no stored attributes: the last 30 days,
 * daily. A shared dashboard date-range context can override this later.
 */
const DEFAULT_UNIT = 'day';
const DEFAULT_QUANTITY = 30;

/**
 * Traffic chart widget.
 *
 * Ports Calypso's `stats-chart-tabs` traffic card. v1 renders Views and
 * Visitors over time as a line chart; `WidgetRoot` supplies the query client
 * and chart theme.
 *
 * @param props            - Render props from the dashboard.
 * @param props.attributes - Stored widget attributes (stats period/quantity).
 */
export default function TrafficChartRender( { attributes }: TrafficChartRenderProps ) {
	return (
		<WidgetRoot>
			<TrafficChartWidget
				unit={ attributes?.unit ?? DEFAULT_UNIT }
				quantity={ attributes?.quantity ?? DEFAULT_QUANTITY }
			/>
		</WidgetRoot>
	);
}
