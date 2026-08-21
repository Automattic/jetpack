/**
 * External dependencies
 */
import { LineShape, RectShape, Stack } from '@jetpack-premium-analytics/externals';
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

	/** Indicator opacity, so a swatch can match a mark the chart drew translucent. */
	opacity?: string | number;
};

type DatumWithLabel = { label: string };
type DatumWithValue = { value: number };

// The default extractors assume the common datum shape; charts with other
// shapes (dates on line charts, for one) pass their own via `getLabel`.
function defaultGetLabel( datum: unknown ): string {
	return ( datum as DatumWithLabel ).label ?? '';
}

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

	dataFormat: DataFormat;

	/**
	 * Array of styles for each series (required).
	 * Index corresponds to series index.
	 */
	seriesStyles: TooltipStyle[];

	/**
	 * Series keys in the same order as `seriesStyles`, used to pair a row with
	 * its style by key instead of by position. Charts emit their tooltip rows in
	 * their own order — a bar chart drawing two metrics lists both current
	 * periods before either previous period — so a positional lookup hands rows
	 * the wrong swatch as soon as the two orders diverge. Omit for charts whose
	 * rows always arrive in series order.
	 */
	seriesKeys?: string[];

	/**
	 * Indicator type: 'line' for line charts, 'rect' for bar charts
	 * Uses chart library's LineShape and RectShape components.
	 */
	indicatorType: 'line' | 'rect';

	getLabel?: ( datum: TDatum, index: number, key: string ) => string;

	getValue?: ( datum: TDatum ) => number;
};

/**
 * Self-contained chart tooltip. Indicators use the chart library's own
 * `LineShape` / `RectShape` so they match the series they describe.
 */
export function ChartTooltip< TDatum >( {
	tooltipData,
	dataFormat,
	seriesStyles,
	seriesKeys,
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

				const styleIndex = seriesKeys ? seriesKeys.indexOf( entry.key ) : index;
				const { stroke, ...lineShapeStyle } =
					seriesStyles[ styleIndex ] || seriesStyles[ index ] || seriesStyles[ 0 ];
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
								<RectShape
									fill={ stroke || 'currentColor' }
									height={ 8 }
									width={ 8 }
									style={ { opacity: lineShapeStyle.opacity } }
								/>
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
