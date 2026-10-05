/**
 * External dependencies
 */
import { LineShape, RectShape, Stack } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import { TooltipRow } from './tooltip-row';
import { exactFormatOf, isChartDatumEntry } from './utils';
import type { DataFormat } from '../../types';

/** Swatch box per indicator type. */
const INDICATOR_SIZE = {
	line: { width: 16, height: 15 },
	rect: { width: 8, height: 8 },
} as const;

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
type DatumWithValue = { value: number | null };

// The default extractors assume the common datum shape; charts with other
// shapes (dates on line charts, for one) pass their own via `getLabel`.
function defaultGetLabel( datum: unknown ): string {
	return ( datum as DatumWithLabel ).label ?? '';
}

function defaultGetValue( datum: unknown ): number | null {
	return ( datum as DatumWithValue ).value ?? null;
}

export type ChartTooltipProps< TDatum = unknown > = {
	/** Tooltip data from the visx chart. */
	tooltipData?: {
		datumByKey?: Record< string, unknown >;
	};

	dataFormat: DataFormat;

	/** One style per series, indexed by series position. */
	seriesStyles: TooltipStyle[];

	indicatorType: 'line' | 'rect';

	/**
	 * `value` is the row's value spelled out in full; `rawValue` picks a plural
	 * form. Both are null for a bucket with no reading.
	 */
	getLabel?: (
		datum: TDatum,
		index: number,
		key: string,
		value: string | null,
		rawValue: number | null
	) => string;

	getValue?: ( datum: TDatum ) => number | null;
};

export function SeriesIndicator( {
	indicatorType,
	style,
}: {
	indicatorType: ChartTooltipProps[ 'indicatorType' ];
	style: TooltipStyle;
} ) {
	const { stroke, ...lineShapeStyle } = style;

	return indicatorType === 'line' ? (
		<LineShape
			fill={ stroke || 'currentColor' }
			width={ INDICATOR_SIZE.line.width }
			height={ INDICATOR_SIZE.line.height }
			style={ lineShapeStyle }
		/>
	) : (
		<RectShape
			fill={ stroke || 'currentColor' }
			height={ INDICATOR_SIZE.rect.height }
			width={ INDICATOR_SIZE.rect.width }
			style={ { opacity: lineShapeStyle.opacity } }
		/>
	);
}

/**
 * Chart tooltip for label/value rows, one per series. Indicators use the chart
 * library's own `LineShape` / `RectShape` so they match the series they
 * describe. Date-bucketed charts use `DatedTooltip` instead.
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
		<Stack direction="column" gap="xs">
			{ datumEntries.map( ( entry, index ) => {
				if ( ! isChartDatumEntry< TDatum >( entry ) ) {
					return null;
				}

				const value = getValue( entry.datum );
				const exactFormat = exactFormatOf( dataFormat );
				const label = getLabel(
					entry.datum,
					index,
					entry.key,
					value === null ? null : formatMetricValue( value, exactFormat.type, exactFormat.options ),
					value
				);

				return (
					<TooltipRow
						key={ entry.key }
						indicator={
							<SeriesIndicator
								indicatorType={ indicatorType }
								style={ seriesStyles[ index ] || seriesStyles[ 0 ] }
							/>
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
