import { LegendOrdinal } from '@visx/legend';
import type { GlyphProps } from '@visx/xychart';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

// See https://airbnb.io/visx/docs/legend#Ordinal for more details.
type LegendOrdinalProps = Omit< ComponentProps< typeof LegendOrdinal >, 'scale' | 'direction' >;

export type LegendItem = {
	label: string;
	value: number | string;
	color: string;
	glyphSize: number;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	shapeStyle?: CSSProperties;
};

export type LegendProps = Omit< LegendOrdinalProps, 'shapeStyle' > & {
	items: LegendItem[];
	orientation?: 'horizontal' | 'vertical';
};
