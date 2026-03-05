import { LegendOrdinal } from '@visx/legend';
import type { GlyphProps, LineStyles } from '@visx/xychart';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

type LegendOrdinalProps = Omit<
	ComponentProps< typeof LegendOrdinal >,
	'scale' | 'direction' | 'children'
>;

type OmittedStylingProps =
	| 'shapeStyle'
	| 'shapeWidth'
	| 'shapeHeight'
	| 'shapeMargin'
	| 'labelAlign'
	| 'labelFlex'
	| 'labelMargin'
	| 'itemMargin'
	| 'itemDirection'
	| 'legendLabelProps';

export type LegendItemStyles = {
	/** Margin around each legend item. */
	margin?: CSSProperties[ 'margin' ];
	/** Flex direction for items within each legend entry. */
	flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
};

export type LegendLabelStyles = Pick< CSSProperties, 'justifyContent' | 'flex' | 'margin' > & {
	/**
	 * Maximum width for legend label text as a CSS value (e.g. '200px', '50%', '10rem').
	 * When set, text overflow behavior is controlled by textOverflow.
	 */
	maxWidth?: string;
	/**
	 * Controls how text behaves when it exceeds maxWidth.
	 * - 'ellipsis': Truncate with ellipsis (ideal for widgets/small devices)
	 * - 'wrap': Wrap text to multiple lines (default, ideal for larger displays)
	 */
	textOverflow?: 'ellipsis' | 'wrap';
};

export type LegendShapeStyles = {
	/** Width of the legend shape in pixels. */
	width?: number;
	/** Height of the legend shape in pixels. */
	height?: number;
	/** Margin around the legend shape. */
	margin?: CSSProperties[ 'margin' ];
};

export type BaseLegendProps = Omit< LegendOrdinalProps, OmittedStylingProps > & {
	items: BaseLegendItem[];
	orientation?: 'horizontal' | 'vertical';
	/**
	 * TODO: Add 'left' | 'right' positioning support in future implementation
	 */
	position?: 'top' | 'bottom';
	alignment?: 'start' | 'center' | 'end';
	/** Additional CSS class name for legend items. */
	itemClassName?: string;
	/** CSS styles for each legend item (margin, flexDirection). */
	itemStyles?: LegendItemStyles;
	/** Additional CSS class name for legend labels. */
	labelClassName?: string;
	/** CSS styles for legend labels (justifyContent, flex, margin). */
	labelStyles?: LegendLabelStyles;
	/** Styles for legend shapes (width, height, margin). */
	shapeStyles?: LegendShapeStyles;
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
