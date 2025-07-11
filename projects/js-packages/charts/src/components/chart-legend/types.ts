import type { LegendProps, LegendItemWithGlyph, LegendItemWithoutGlyph } from '../legend/types';
import type { GlyphProps } from '@visx/xychart';
import type { ReactNode } from 'react';

export interface ChartLegendOptions {
	showValues?: boolean;
	withGlyph?: boolean;
	glyphSize?: number;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
}

export interface ChartLegendProps extends Omit< LegendProps, 'items' > {
	items?: LegendItemWithGlyph[] | LegendItemWithoutGlyph[];
	chartId?: string;
}
