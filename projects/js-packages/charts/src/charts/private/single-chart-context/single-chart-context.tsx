import { createContext } from 'react';

export interface ChartInstanceRef {
	getScales: () => { xScale: unknown; yScale: unknown } | null;
	getChartDimensions: () => {
		width: number;
		height: number;
		margin: { top?: number; right?: number; bottom?: number; left?: number };
	};
}

// Local context for chart implicit state sharing
export interface ChartInstanceContextValue {
	chartId: string;
	chartRef?: React.RefObject< ChartInstanceRef >;
	chartWidth?: number;
	chartHeight?: number;
}

export const ChartInstanceContext = createContext< ChartInstanceContextValue | null >( null );

// Backward compatibility exports
export const SingleChartContext = ChartInstanceContext;
export type SingleChartContextValue = ChartInstanceContextValue;
export type SingleChartRef = ChartInstanceRef;
