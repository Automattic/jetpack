import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../providers';
import type { SeriesData } from '../types';

export const useXYChartTheme = ( data: SeriesData[] ) => {
	const theme = useGlobalChartsTheme();

	return useMemo( () => {
		const seriesColors = ( data ?? [] )
			.map( series => series.options?.stroke )
			.filter( ( color ): color is string => Boolean( color ) );

		return buildChartTheme( {
			...theme,
			colors: [ ...seriesColors, ...( theme.colors ?? [] ) ],
		} );
	}, [ theme, data ] );
};
