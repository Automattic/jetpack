/**
 * External dependencies
 */
import { LineShape, RectShape } from '@automattic/charts/visx/legend';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './chart-tooltip.module.scss';
import { TooltipRow } from './tooltip-row';
import { isChartDatumEntry } from './utils';
import type { DataFormat } from '../../types';

/**
 * Style configuration for tooltip indicators.
 * Matches SeriesStyle pattern from chart components.
 */
export type TooltipStyle = {
	/** Color for the indicator */
	stroke: string;

	/** Stroke width (for line indicator) */
	strokeWidth?: string | number;

	/** Stroke dash array (for line indicator) */
	strokeDasharray?: string | number;

	/** Stroke dash offset (for line indicator) */
	strokeDashoffset?: string | number;
};

/**
 * Common datum shape with label and value properties.
 * Used by default extractors.
 */
type DatumWithLabel = { label: string };
type DatumWithValue = { value: number };

/**
 * Default label extractor - assumes datum has a 'label' property.
 * Override for custom label formatting (e.g., date formatting for line charts).
 *
 * @param datum - The data point
 */
function defaultGetLabel( datum: unknown ): string {
	return ( datum as DatumWithLabel ).label ?? '';
}

/**
 * Default value extractor - assumes datum has a 'value' property.
 */
function defaultGetValue( datum: unknown ): number {
	return ( datum as DatumWithValue ).value;
}

export type ChartTooltipProps< TDatum = unknown > = {
	/**
	 * Tooltip data from visx chart
	 */
	tooltipData?: {
		datumByKey?: Record< string, unknown >;
	};

	/**
	 * Format configuration for chart values
	 */
	dataFormat: DataFormat;

	/**
	 * Array of styles for each series (required).
	 * Index corresponds to series index.
	 */
	seriesStyles: TooltipStyle[];

	/**
	 * Indicator type: 'line' for line charts, 'rect' for bar charts
	 * Uses chart library's LineShape and RectShape components.
	 */
	indicatorType: 'line' | 'rect';

	/**
	 * Function to extract label from datum.
	 * Defaults to extracting 'label' property.
	 */
	getLabel?: ( datum: TDatum, index: number, key: string ) => string;

	/**
	 * Function to extract value from datum.
	 * Defaults to extracting 'value' property.
	 */
	getValue?: ( datum: TDatum ) => number;
};

/**
 * Self-contained tooltip component for charts.
 * Handles rendering of tooltip rows with configurable indicators.
 *
 * Uses chart library's shape components (LineShape, RectShape) for visual consistency.
 *
 * Provides sensible defaults for common chart data patterns:
 * - getLabel: Extracts 'label' property from datum
 * - getValue: Extracts 'value' property from datum
 */
export function ChartTooltip< TDatum >( {
	tooltipData,
	dataFormat,
	seriesStyles,
	indicatorType,
	getLabel = defaultGetLabel,
	getValue = defaultGetValue,
}: ChartTooltipProps< TDatum > ) {
	if ( ! tooltipData?.datumByKey ) {
		return null;
	}

	const datumEntries = Object.values( tooltipData.datumByKey );

	if ( datumEntries.length === 0 ) {
		return null;
	}

	return (
		<Stack direction="column" className={ styles.tooltip } gap="xs">
			{ datumEntries.map( ( entry, index ) => {
				if ( ! isChartDatumEntry< TDatum >( entry ) ) {
					return null;
				}

				const { stroke, ...lineShapeStyle } = seriesStyles[ index ] || seriesStyles[ 0 ];
				const label = getLabel( entry.datum, index, entry.key );
				const value = getValue( entry.datum );

				return (
					<TooltipRow
						key={ entry.key }
						indicator={
							indicatorType === 'line' ? (
								<LineShape
									fill={ stroke || 'currentColor' }
									width={ 16 }
									height={ 15 }
									style={ lineShapeStyle }
								/>
							) : (
								<RectShape fill={ stroke || 'currentColor' } height={ 8 } width={ 8 } />
							)
						}
						label={ label }
						value={ value }
						dataFormat={ dataFormat }
					/>
				);
			} ) }
		</Stack>
	);
}
