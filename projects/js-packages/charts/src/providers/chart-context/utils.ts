import { useEffect, useId, useMemo } from 'react';
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
	metadata?: Record< string, unknown >,
	isDataValid: boolean = true
): void => {
	const { registerChart, unregisterChart } = useChartContext();

	// Memoize metadata to prevent unnecessary re-renders
	const memoizedMetadata = useMemo( () => metadata, [ metadata ] );

	useEffect( () => {
		// Only register if data is valid
		if ( isDataValid ) {
			registerChart( chartId, {
				legendItems,
				theme,
				chartType,
				metadata: memoizedMetadata,
			} );
		}

		return () => {
			unregisterChart( chartId );
		};
	}, [
		chartId,
		legendItems,
		theme,
		chartType,
		memoizedMetadata,
		isDataValid,
		registerChart,
		unregisterChart,
	] );
};
