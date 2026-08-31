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

/** Mirrors the `SeriesStyle` shape the chart components use. */
export type TooltipStyle = {
	stroke: string;

	strokeWidth?: string | number;

	strokeDasharray?: string | number;

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
	/** Tooltip data from the visx chart. */
	tooltipData?: {
		datumByKey?: Record< string, unknown >;
	};

	dataFormat: DataFormat;

	/** One style per series, indexed by series position. */
	seriesStyles: TooltipStyle[];

	/**
	 * Series keys in the same order as `seriesStyles`, pairing a row with its style by
	 * key rather than position — charts emit rows in their own order, so a positional
	 * lookup hands rows the wrong swatch. Omit when rows arrive in series order.
	 */
	seriesKeys?: string[];

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

				// No positional fallback once `seriesKeys` is given: that lookup is the bug
				// the prop exists to fix, and on a miss it paints a plausible wrong swatch.
				const style = seriesKeys
					? seriesStyles[ seriesKeys.indexOf( entry.key ) ]
					: seriesStyles[ index ];
				const { stroke, ...lineShapeStyle } = style || seriesStyles[ 0 ];
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
