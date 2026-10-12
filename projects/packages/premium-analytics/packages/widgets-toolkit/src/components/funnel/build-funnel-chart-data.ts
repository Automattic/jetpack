/**
 * External dependencies
 */
import { sharePercentage } from '../../helpers/share-percentage';
import type { ConversionFunnelChart } from '@jetpack-premium-analytics/externals';
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */

type FunnelChartStep = ComponentProps< typeof ConversionFunnelChart >[ 'steps' ][ number ];

/**
 * One step of the funnel, in the widget's own terms.
 */
export type FunnelStepInput = {
	/**
	 * Stable key of the step; the chart anchors its selection on it.
	 */
	id: string;
	/**
	 * Label text, over the step's bar and in the tooltip.
	 */
	label: string;
	/**
	 * Count for the selected period.
	 */
	value: number;
	/**
	 * Count for the comparison period; `undefined` when the step has no match there.
	 */
	previousValue?: number;
};

export type FunnelChartDataOptions = {
	/**
	 * Whether the comparison period is on: the previous rate exists only then.
	 */
	hasComparison: boolean;
};

export type FunnelChartDataResult = {
	/**
	 * The steps as the chart draws them, each rated as a share of the first step in 0-100.
	 */
	chartSteps: FunnelChartStep[];
	/**
	 * The last step over the first, as a ratio; 0 when the first step is empty.
	 */
	rate: number;
	/**
	 * The same ratio for the comparison period, or null when the comparison is off or that
	 * period has no first step.
	 */
	previousRate: number | null;
};

const ratioOf = ( part: number | undefined, whole: number | undefined ): number | null =>
	part === undefined || ! whole ? null : part / whole;

/**
 * Turns the steps into the chart's steps and the rates of both periods, every figure a share
 * of the first step.
 *
 * @param steps   - The steps, in order.
 * @param options - The comparison flag.
 * @return The chart steps and the rates.
 */
export function buildFunnelChartData(
	steps: readonly FunnelStepInput[],
	options: FunnelChartDataOptions
): FunnelChartDataResult {
	const first = steps[ 0 ];
	const last = steps[ steps.length - 1 ];

	return {
		chartSteps: steps.map( step => ( {
			id: step.id,
			label: step.label,
			count: step.value,
			rate: sharePercentage( step.value, first?.value ?? 0 ),
		} ) ),
		rate: ratioOf( last?.value, first?.value ) ?? 0,
		previousRate: options.hasComparison
			? ratioOf( last?.previousValue, first?.previousValue )
			: null,
	};
}
