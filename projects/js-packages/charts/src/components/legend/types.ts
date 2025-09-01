import { LegendOrdinal } from '@visx/legend';
import type { GlyphProps, LineStyles } from '@visx/xychart';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

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

export type BaseLegendItem = {
	label: string;
	value: number | string;
	color: string;
	glyphSize?: number;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	shapeStyle?: CSSProperties & LineStyles;
	// Optional group info for dynamic color resolution
	group?: string;
	index?: number;
	overrideColor?: string;
};
