/**
 * External dependencies
 */
import { useMemo, type JSX } from 'react';
/**
 * Internal dependencies
 */
import { isEmptyChartData } from '../../helpers/chart-empty-state';
import { formatLegendLabels } from '../../helpers/format-legend-labels';
import { BarChart } from '../chart-bar/bar-chart';
import { BarChartSkeleton } from '../chart-bar/bar-chart-skeleton';
import { useWidgetRootContext } from '../widget-root';
import {
	WidgetState,
	resolveWidgetStateError,
	type WidgetStateEmpty,
	type WidgetStateError,
} from '../widget-state';
import { buildColumnsChartData, type ColumnInput } from './build-columns-chart-data';
import { useBarStyles } from './use-bar-styles';
import type { DataFormat, WidgetStatus } from '../../types';

export type ColumnsProps = {
	/**
	 * The columns, in display order. Each one draws once per period, and the skeleton draws one
	 * per column: a widget whose categories are fixed can hand them in before the data arrives.
	 */
	columns: readonly ColumnInput[];
	/**
	 * Request state, from the widget's data hook.
	 */
	status: WidgetStatus;
	/**
	 * Error copy and actions, as `describeError()` builds them. Omit for the generic
	 * message with a Retry bound to `status.refetch`.
	 */
	error?: WidgetStateError;
	/**
	 * A widget's own empty state; omit for the generic one.
	 */
	empty?: WidgetStateEmpty;
	/**
	 * Format of the figures, on the y axis and in the tooltip. Defaults to compact integers.
	 */
	format?: DataFormat;
	/** What the chart shows, such as the widget title; the chart is named "Chart: <title>". */
	chartTitle?: string;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A columns widget body: a vertical bar per column and per period, the periods named in the
 * legend from the report params, and the loading, error and empty states. Renders inside
 * `WidgetRoot`, which provides the report params and the charts provider that colors the
 * periods.
 *
 * @param {ColumnsProps} props - The props for the Columns component.
 * @return {JSX.Element} The Columns component.
 */
export function Columns( {
	columns,
	status,
	error,
	empty,
	format = DEFAULT_FORMAT,
	chartTitle,
}: ColumnsProps ): JSX.Element {
	const { reportParams } = useWidgetRootContext();
	const { isLoading, isFetching, isError, refetch } = status;
	const hasComparison = !! status.hasComparison;

	const labels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );
	const chartData = useMemo(
		() => buildColumnsChartData( columns, { hasComparison, labels } ),
		[ columns, hasComparison, labels ]
	);
	const barStyles = useBarStyles( chartData );
	const errorState = useMemo( () => resolveWidgetStateError( error, refetch ), [ error, refetch ] );

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ !! isError }
			isEmpty={ isEmptyChartData( chartData ) }
			error={ errorState }
			empty={ empty }
			renderLoading={ <BarChartSkeleton columns={ columns.length } /> }
		>
			<BarChart
				chartData={ chartData }
				styles={ barStyles }
				dataFormat={ format }
				chartTitle={ chartTitle }
			/>
		</WidgetState>
	);
}
