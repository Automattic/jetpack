import type { BaseLegendItem } from '../../components/legend/types';
import type { ChartTheme } from '../../types';

export interface ChartRegistration {
	legendItems: BaseLegendItem[];
	chartType: string;
	metadata?: Record< string, unknown >;
}

export interface ChartContextValue {
	charts: Map< string, ChartRegistration >;
	registerChart: ( id: string, data: ChartRegistration ) => void;
	unregisterChart: ( id: string ) => void;
	getChartData: ( id: string ) => ChartRegistration | undefined;
	/** Theme provided by the ChartProvider (merged with defaults) */
	theme: ChartTheme;
}
