import { createContext, useContext } from 'react';

export interface SingleChartRef {
	getScales: () => { xScale: unknown; yScale: unknown } | null;
	getChartDimensions: () => {
		width: number;
		height: number;
		margin: { top?: number; right?: number; bottom?: number; left?: number };
	};
}

// Local context for chart implicit state sharing
export interface SingleChartContextValue {
	chartId: string;
	chartRef?: React.RefObject< SingleChartRef >;
	chartWidth: number;
	chartHeight: number;
}

export const SingleChartContext = createContext< SingleChartContextValue | null >( null );

export const useSingleChartContext = (): SingleChartContextValue => {
	const context = useContext( SingleChartContext );
	if ( ! context ) {
		throw new Error( 'useSingleChartContext must be used within a Chart component' );
	}
	return context;
};
