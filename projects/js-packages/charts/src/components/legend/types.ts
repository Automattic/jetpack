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
	/**
	 * Maximum width for legend items. When set, text overflow behavior is controlled by textOverflow prop.
	 * Should be a CSS value string (e.g. '200px', '50%', '10rem')
	 */
	maxWidth?: string;
	/**
	 * Controls how text behaves when it exceeds maxWidth.
	 * - 'ellipsis': Truncate with ellipsis (ideal for widgets/small devices)
	 * - 'wrap': Wrap text to multiple lines (default, ideal for larger displays)
	 */
	textOverflow?: 'ellipsis' | 'wrap';
	/**
	 * Margin around the legend container.
	 * Can be a CSS margin string (e.g. '10px', '1rem 2rem', '10px 20px 30px 40px')
	 * or an object with individual margin properties (e.g. {top: 10, right: 15, bottom: 10, left: 15})
	 */
	legendMargin?:
		| string
		| {
				top?: number | string;
				right?: number | string;
				bottom?: number | string;
				left?: number | string;
		  };
	/**
	 * Custom CSS styles for the legend container.
	 * These styles will be merged with and override default styles.
	 */
	legendStyle?: CSSProperties;
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
};
