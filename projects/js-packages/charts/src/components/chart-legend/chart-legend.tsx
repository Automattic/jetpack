import { BaseLegend } from '../legend/base-legend';
import type { ChartLegendProps } from './types';
import type { FC } from 'react';

export const ChartLegend: FC< ChartLegendProps > = ( { items, ...props } ) => {
	return <BaseLegend items={ items } { ...props } />;
};
