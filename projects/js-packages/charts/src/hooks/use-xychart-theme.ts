import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { SeriesData } from '../types';
import { useGlobalChartTheme } from './use-global-chart-theme';

export const useXYChartTheme = ( data: SeriesData[] ) => {
	const theme = useGlobalChartTheme();

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
