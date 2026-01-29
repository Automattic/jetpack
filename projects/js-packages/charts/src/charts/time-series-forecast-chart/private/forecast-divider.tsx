import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import type { FC } from 'react';

interface ForecastDividerProps {
	/**
	 * The date at which the forecast begins
	 */
	forecastStart: Date;
	/**
	 * Color of the divider line. Default: '#888888'
	 */
	color?: string;
}

/**
 * Renders a vertical dashed line at the forecast start position.
 * Uses DataContext from visx/xychart to access scales.
 *
 * @param root0               - Props object
 * @param root0.forecastStart - The date at which the forecast begins
 * @param root0.color         - Color of the divider line
 * @return SVG line element or null if scales are not available
 */
export const ForecastDivider: FC< ForecastDividerProps > = ( {
	forecastStart,
	color = '#888888',
} ) => {
	const context = useContext( DataContext );

	if ( ! context?.xScale || ! context?.yScale ) {
		return null;
	}

	const { xScale, innerHeight } = context;

	// Get x position from scale
	const xScaleFn = xScale as ( value: Date ) => number | undefined;
	const x = xScaleFn( forecastStart );

	if ( x === undefined || ! Number.isFinite( x ) ) {
		return null;
	}

	return (
		<line
			x1={ x }
			x2={ x }
			y1={ 0 }
			y2={ innerHeight }
			stroke={ color }
			strokeDasharray="4 4"
			strokeWidth={ 1 }
			data-testid="forecast-divider"
		/>
	);
};
