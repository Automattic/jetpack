import { LegendOrdinal } from '@visx/legend';
import type { CompleteChartTheme } from '../../types';
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
	 * Legend layout type
	 * - 'default': Uses orientation (horizontal/vertical) with flexbox
	 * - 'grid': Uses CSS Grid for complex layouts (ignores orientation)
	 */
	layout?: 'default' | 'grid';
	/**
	 * Number of columns for grid layout. Only applies when layout='grid'
	 */
	gridColumns?: number;
	/**
	 * Gap between grid items. Only applies when layout='grid'
	 * Should be a CSS value string (e.g. '16px', '1rem')
	 */
	gridGap?: string;
	/**
	 * Grid template for predefined layouts. Only applies when layout='grid'
	 * - 'auto': Auto-fit columns based on content
	 * - 'columns': Fixed columns based on gridColumns prop
	 * - 'compact': Compact layout with minimal gaps
	 */
	gridTemplate?: 'auto' | 'columns' | 'compact';
	/**
	 * Custom render function for the entire legend container
	 * When provided, gives full control over legend rendering while maintaining theme integration
	 */
	renderLegend?: ( items: BaseLegendItem[], theme: CompleteChartTheme ) => ReactNode;
	/**
	 * Custom render function for individual legend items
	 * When provided, overrides default legend item rendering while maintaining theme integration
	 */
	renderLegendItem?: (
		item: BaseLegendItem,
		index: number,
		theme: CompleteChartTheme
	) => ReactNode;
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
