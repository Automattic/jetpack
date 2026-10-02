import type { LineChartProps } from './types';

type Crosshairs = NonNullable< LineChartProps[ 'withTooltipCrosshairs' ] >;

export const paintCrosshairs: Crosshairs = {
	verticalStyle: { stroke: 'purple', strokeWidth: 2 },
};

export const coordinateCrosshairs: Crosshairs = {
	// @ts-expect-error Crosshair coordinates are computed from the active datum.
	verticalStyle: { x1: 12 },
};

export const transformedCrosshairs: Crosshairs = {
	// @ts-expect-error Crosshair transforms are not paint attributes.
	verticalStyle: { transform: 'translate(100 0)' },
};

export const transformedStyles: Crosshairs = {
	// @ts-expect-error Inline crosshair styles accept only paint properties.
	horizontalStyle: { style: { transform: 'translateX(100px)' } },
};
