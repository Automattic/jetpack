/**
 * Internal dependencies
 */
import { getEmptyChartDomain } from './chart-empty-state';

/**
 * A y-axis domain pinned by the chart rather than derived from the data.
 */
export type FixedYAxis = {
	/** Y-axis domain tuple [min, max]. */
	domain: [ number, number ];
};

/**
 * Resolve the y-axis domain a comparative chart should pin, if any: a percentage
 * metric always reads 0–100%, and an all-zero period gets a real axis instead of
 * a flat baseline.
 *
 * @param metricType  - The data format type (currency, number, percentage).
 * @param isEmptyData - Whether every value in the chart is 0 or null.
 * @return The domain, or null to let the chart scale to the data.
 */
export function getFixedYAxis( metricType: string, isEmptyData: boolean ): FixedYAxis | null {
	let domain: [ number, number ] | null = null;

	if ( metricType === 'percentage' ) {
		domain = [ 0, 1.0 ];
	} else if ( isEmptyData ) {
		domain = getEmptyChartDomain( metricType );
	}

	if ( ! domain ) {
		return null;
	}

	return { domain };
}
