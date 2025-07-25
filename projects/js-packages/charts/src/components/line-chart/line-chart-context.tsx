import { createContext, useContext } from 'react';

export interface LineChartRef {
	getScales: () => { xScale: unknown; yScale: unknown } | null;
	getChartDimensions: () => {
		width: number;
		height: number;
		margin: { top?: number; right?: number; bottom?: number; left?: number };
	};
}

// Local context for LineChart implicit state sharing
export interface LineChartContextValue {
	chartId: string;
	chartRef: React.RefObject< LineChartRef >;
	chartWidth: number;
	chartHeight: number;
}

export const LineChartContext = createContext< LineChartContextValue | null >( null );

export const useLineChartContext = (): LineChartContextValue => {
	const context = useContext( LineChartContext );
	if ( ! context ) {
		throw new Error( 'useLineChartContext must be used within a LineChart component' );
	}
	return context;
};
