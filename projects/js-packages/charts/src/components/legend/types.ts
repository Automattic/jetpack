import { LegendOrdinal } from '@visx/legend';
import type { GlyphProps } from '@visx/xychart';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

// See https://airbnb.io/visx/docs/legend#Ordinal for more details.
type LegendOrdinalProps = Omit< ComponentProps< typeof LegendOrdinal >, 'scale' | 'direction' >;

export type BaseLegendItem = {
	label: string;
	value: number | string;
	color: string;
	glyphSize?: number;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	shapeStyle?: CSSProperties;
};

export type LegendItemWithGlyph = BaseLegendItem & {
	renderGlyph: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	glyphSize: number;
};

export type LegendItemWithoutGlyph = BaseLegendItem & {
	renderGlyph?: never;
	glyphSize?: number;
};

export type LegendProps = Omit< LegendOrdinalProps, 'shapeStyle' > & {
	items: LegendItemWithGlyph[] | LegendItemWithoutGlyph[];
	orientation?: 'horizontal' | 'vertical';
	alignmentHorizontal?: 'left' | 'center' | 'right';
	alignmentVertical?: 'top' | 'bottom';
};
