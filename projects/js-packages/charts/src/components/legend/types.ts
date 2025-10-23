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
	 * Additional CSS class name for legend items.
	 * This allows consumers to customize individual legend item styling.
	 */
	legendItemClassName?: string;
	/**
	 * Function for rendering a custom legend layout.
	 */
	render?: ( items: BaseLegendItem[] ) => ReactNode;
	/**
	 * Enable interactive legend items that can toggle series visibility.
	 * Requires GlobalChartsProvider and chartId to be set.
	 */
	interactive?: boolean;
	/**
	 * Chart ID for series visibility tracking when interactive mode is enabled.
	 */
	chartId?: string;
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
