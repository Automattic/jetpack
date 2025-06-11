import { LegendOrdinal } from '@visx/legend';
import type { ComponentProps, CSSProperties, RefObject } from 'react';

// See https://airbnb.io/visx/docs/legend#Ordinal for more details.
type LegendOrdinalProps = Omit< ComponentProps< typeof LegendOrdinal >, 'scale' | 'direction' >;

export type LegendItem = {
	label: string;
	value: number | string;
	color: string;
	shapeStyle?: CSSProperties;
};

export type LegendProps = Omit< LegendOrdinalProps, 'shapeStyle' > & {
	items: LegendItem[];
	orientation?: 'horizontal' | 'vertical';
	ref?: RefObject< HTMLDivElement >;
};
