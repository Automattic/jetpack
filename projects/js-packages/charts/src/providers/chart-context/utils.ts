import { useEffect, useId } from 'react';
import { useChartContext } from './chart-context';
import type { BaseLegendItem } from '../../components/legend/types';
import type { ChartTheme } from '../../types';

export const useChartId = ( providedId?: string ): string => {
	const generatedId = useId();
	return providedId || generatedId;
};

export const useChartRegistration = (
	chartId: string,
	legendItems: BaseLegendItem[],
	theme: ChartTheme,
	chartType: string,
	metadata?: Record< string, unknown >
): void => {
	const { registerChart, unregisterChart } = useChartContext();

	useEffect( () => {
		registerChart( chartId, {
			legendItems,
			theme,
			chartType,
			metadata,
		} );

		return () => {
			unregisterChart( chartId );
		};
	}, [ chartId, legendItems, theme, chartType, metadata, registerChart, unregisterChart ] );
};
