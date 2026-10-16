/**
 * External dependencies
 */
import { ConversionFunnelChart } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, type JSX } from 'react';
/**
 * Internal dependencies
 */
import { formatChartName } from '../../helpers/format-chart-name';
import { exactFormatOf } from '../chart-tooltip/utils';
import { MetricWithComparison } from '../metric-with-comparison';
import {
	WidgetState,
	resolveWidgetStateError,
	type WidgetStateEmpty,
	type WidgetStateError,
} from '../widget-state';
import { buildFunnelChartData, type FunnelStepInput } from './build-funnel-chart-data';
import styles from './funnel.module.scss';
import type { DataFormat, WidgetStatus } from '../../types';

export type FunnelProps = {
	/**
	 * The steps in order. The first one is the whole the others are shares of, and the rate
	 * of the whole is the last step over the first.
	 */
	steps: readonly FunnelStepInput[];
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
	 * Format of the step counts, in the tooltip. Defaults to compact integers.
	 */
	format?: DataFormat;
	/** What the chart shows, such as the widget title; the chart is named "Chart: <title>". */
	chartTitle?: string;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

// Shares and the rate are never negative, so they read without a sign.
const RATE_FORMAT: DataFormat = {
	type: 'percentage',
	options: { signDisplay: 'auto' },
};

/**
 * A funnel widget body: the rate of the whole with its delta, a bar per step with its share of
 * the first step, the tooltip with the step's count, and the loading, error and empty states.
 * Renders inside `WidgetRoot`, whose charts provider colors the bars.
 *
 * @param {FunnelProps} props - The props for the Funnel component.
 * @return {JSX.Element} The Funnel component.
 */
export function Funnel( {
	steps,
	status,
	error,
	empty,
	format = DEFAULT_FORMAT,
	chartTitle,
}: FunnelProps ): JSX.Element {
	const { isLoading, isFetching, isError, refetch } = status;
	const hasComparison = !! status.hasComparison;

	const { chartSteps, rate, previousRate } = useMemo(
		() => buildFunnelChartData( steps, { hasComparison } ),
		[ steps, hasComparison ]
	);
	const errorState = useMemo( () => resolveWidgetStateError( error, refetch ), [ error, refetch ] );

	const getTooltipContent = useCallback(
		( step: { count?: number; rate: number }, index: number ) => {
			const countFormat = exactFormatOf( format );
			const rateFormat = exactFormatOf( RATE_FORMAT );
			return {
				value:
					step.count === undefined
						? __( 'No data', 'jetpack-premium-analytics-pkg' )
						: formatMetricValue( step.count, countFormat.type, countFormat.options ),
				rows:
					index === 0
						? []
						: [
								{
									label: __( 'Conversion rate', 'jetpack-premium-analytics-pkg' ),
									value: formatMetricValue( step.rate / 100, rateFormat.type, rateFormat.options ),
								},
							],
			};
		},
		[ format ]
	);

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ !! isError }
			isEmpty={ ! steps[ 0 ]?.value }
			error={ errorState }
			empty={ empty }
		>
			<ConversionFunnelChart
				className={ styles.chart }
				ariaLabel={ formatChartName( chartTitle ) }
				steps={ chartSteps }
				mainRate={ rate * 100 }
				getTooltipContent={ getTooltipContent }
				renderMainMetric={ () => (
					<MetricWithComparison
						value={ rate }
						previousValue={ previousRate }
						dataFormat={ RATE_FORMAT }
					/>
				) }
				renderStepRate={ ( { step, className } ) => (
					<span className={ className }>
						{ formatMetricValue( step.rate / 100, RATE_FORMAT.type, RATE_FORMAT.options ) }
					</span>
				) }
			/>
		</WidgetState>
	);
}
