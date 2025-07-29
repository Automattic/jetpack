/**
 * Utility function to create chart components with composition API.
 *
 * This function attaches subcomponents to a chart component to enable
 * dot notation access like <Chart.Legend />, <Chart.Tooltip />, etc.
 *
 * @param Chart         - The main chart component
 * @param subComponents - Object containing subcomponents to attach
 * @return Chart component with attached subcomponents
 */
export function attachSubComponents< TChart, TSubComponents extends Record< string, unknown > >(
	Chart: TChart,
	subComponents: TSubComponents
): TChart & TSubComponents {
	const ComposedChart = Object.assign( Chart, subComponents );

	// Preserve display name if it exists
	if ( typeof Chart === 'function' && 'displayName' in Chart && Chart.displayName ) {
		( ComposedChart as typeof Chart & { displayName?: string } ).displayName = Chart.displayName;
	}

	return ComposedChart;
}
