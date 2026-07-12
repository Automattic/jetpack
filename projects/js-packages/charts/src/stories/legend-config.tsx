import type { ChartLegendConfig } from '../types';

/**
 * Flat Storybook controls corresponding to `legendArgTypes`. These are story-only
 * controls (not component props); `extractLegendConfig` maps them into the nested
 * `legend` prop. Include this in a story's `StoryArgs` type so Storybook v10's typed
 * `Meta`/`StoryObj`/`ArgTypes` accept the flat keys.
 *
 * Note: `showLegend` is intentionally omitted — it is a real component prop
 * (`BaseChartProps`), not a synthetic control.
 */
export type LegendStoryControls = {
	legendPosition?: 'top' | 'bottom';
	legendAlignment?: 'start' | 'center' | 'end';
	legendOrientation?: 'horizontal' | 'vertical';
	legendShape?: 'circle' | 'line' | 'rect';
	withLegendGlyph?: boolean;
	legendMaxWidth?: string;
	legendTextOverflow?: 'wrap' | 'ellipsis';
	legendItemClassName?: string;
	legendInteractive?: boolean;
	legendShapeStyles?: ChartLegendConfig[ 'shapeStyles' ];
	legendItemStyles?: ChartLegendConfig[ 'itemStyles' ];
};

/**
 * Shared legend configuration for chart stories.
 * Provides consistent argTypes and decorators across all chart legend stories.
 *
 * These use flat keys for reliable Storybook controls. Use `extractLegendConfig`
 * in render functions to map them to the nested `legend` prop.
 */
export const legendArgTypes = {
	showLegend: {
		control: { type: 'boolean' as const },
		description: 'Show or hide the legend',
		table: { category: 'Legend' },
	},
	legendPosition: {
		control: { type: 'select' as const },
		options: [ 'top', 'bottom' ],
		description: 'Position of the legend relative to the chart',
		table: { category: 'Legend' },
	},
	legendAlignment: {
		control: { type: 'select' as const },
		options: [ 'start', 'center', 'end' ],
		description: 'Horizontal alignment of the legend within its position',
		table: { category: 'Legend' },
	},
	legendOrientation: {
		control: { type: 'select' as const },
		options: [ 'horizontal', 'vertical' ],
		description: 'Layout direction of legend items',
		table: { category: 'Legend' },
	},
	legendShape: {
		control: { type: 'select' as const },
		options: [ 'circle', 'line', 'rect' ],
		description: 'Shape of the legend marker icon',
		table: { category: 'Legend' },
	},
	withLegendGlyph: {
		control: { type: 'boolean' as const },
		table: { category: 'Legend' },
		description: 'Show glyphs in legend (Line charts only)',
	},
	legendMaxWidth: {
		control: { type: 'text' as const },
		table: { category: 'Legend' },
		description:
			'Maximum width for legend items as CSS value (e.g. "200px", "50%", "10rem"). When set, text overflow behavior is controlled by legendTextOverflow.',
	},
	legendTextOverflow: {
		control: { type: 'select' as const },
		options: [ 'wrap', 'ellipsis' ],
		table: { category: 'Legend' },
		description:
			'Controls how text behaves when it exceeds legendMaxWidth. "ellipsis" truncates with ... (ideal for widgets), "wrap" allows text to wrap to multiple lines.',
	},
	legendItemClassName: {
		control: { type: 'text' as const },
		table: { category: 'Legend' },
		description:
			'Additional CSS class name for individual legend items. This allows consumers to customize legend item styling.',
	},
	legendInteractive: {
		control: { type: 'boolean' as const },
		table: { category: 'Legend' },
		description:
			'Enable interactive legend items that can toggle series visibility. Requires GlobalChartsProvider and chartId to be set.',
	},
	legendShapeStyles: {
		control: { type: 'object' as const },
		table: {
			category: 'Legend',
			type: { summary: '{ width?: number; height?: number; margin?: string | number }' },
		},
		description: 'Styles for legend shapes (width, height, margin).',
	},
	legendItemStyles: {
		control: { type: 'object' as const },
		table: {
			category: 'Legend',
			type: {
				summary:
					'{ margin?: string | number; flexDirection?: "row" | "row-reverse" | "column" | "column-reverse" }',
			},
		},
		description: 'Styles for each legend item (margin, flexDirection).',
	},
};

/**
 * Extracts flat legend story args into a `ChartLegendConfig` object.
 * Use in story render functions to bridge flat Storybook controls to the nested `legend` prop.
 *
 * @param args - Flat Storybook args containing legendXxx keys.
 * @return The legend config object, or undefined if no legend args are set.
 */
export function extractLegendConfig< T = ChartLegendConfig >(
	args: Partial< LegendStoryControls >
): T | undefined {
	const {
		legendPosition,
		legendAlignment,
		legendOrientation,
		legendShape,
		legendInteractive,
		legendItemClassName,
		legendMaxWidth,
		legendTextOverflow,
		legendShapeStyles,
		legendItemStyles,
	} = args;

	const hasAny =
		legendPosition !== undefined ||
		legendAlignment !== undefined ||
		legendOrientation !== undefined ||
		legendShape !== undefined ||
		legendInteractive !== undefined ||
		legendItemClassName !== undefined ||
		legendMaxWidth !== undefined ||
		legendTextOverflow !== undefined ||
		legendShapeStyles !== undefined ||
		legendItemStyles !== undefined;

	if ( ! hasAny ) {
		return undefined;
	}

	const config: ChartLegendConfig = {};

	if ( legendOrientation !== undefined ) {
		config.orientation = legendOrientation as ChartLegendConfig[ 'orientation' ];
	}
	if ( legendPosition !== undefined ) {
		config.position = legendPosition as ChartLegendConfig[ 'position' ];
	}
	if ( legendAlignment !== undefined ) {
		config.alignment = legendAlignment as ChartLegendConfig[ 'alignment' ];
	}
	if ( legendShape !== undefined ) {
		config.shape = legendShape as unknown as ChartLegendConfig[ 'shape' ];
	}
	if ( legendInteractive !== undefined ) {
		config.interactive = legendInteractive as boolean;
	}
	if ( legendItemClassName !== undefined ) {
		config.itemClassName = legendItemClassName as string;
	}
	if ( legendMaxWidth !== undefined || legendTextOverflow !== undefined ) {
		config.labelStyles = {};
		if ( legendMaxWidth !== undefined ) {
			config.labelStyles.maxWidth = legendMaxWidth as string;
		}
		if ( legendTextOverflow !== undefined ) {
			config.labelStyles.textOverflow =
				legendTextOverflow as ChartLegendConfig[ 'labelStyles' ][ 'textOverflow' ];
		}
	}
	if ( legendShapeStyles !== undefined ) {
		config.shapeStyles = legendShapeStyles as ChartLegendConfig[ 'shapeStyles' ];
	}
	if ( legendItemStyles !== undefined ) {
		config.itemStyles = legendItemStyles as ChartLegendConfig[ 'itemStyles' ];
	}

	return config as T;
}
