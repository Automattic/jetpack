import { LegendOrdinal } from '@visx/legend';
import type { BaseLegendItem } from '../../types';
import type { ComponentProps } from 'react';

// See https://airbnb.io/visx/docs/legend#Ordinal for more details.
type LegendOrdinalProps = Omit< ComponentProps< typeof LegendOrdinal >, 'scale' | 'direction' >;

export type BaseLegendProps = Omit< LegendOrdinalProps, 'shapeStyle' > & {
	items: BaseLegendItem[];
	orientation?: 'horizontal' | 'vertical';
	/**
	 * TODO: Add 'left' | 'right' positioning support in future implementation
	 */
	position?: 'top' | 'bottom';
	alignment?: 'start' | 'center' | 'end';
};

export type LegendProps = Omit< BaseLegendProps, 'items' > & {
	items?: BaseLegendItem[];
	chartId?: string;
};
