/**
 * External dependencies
 */
import { LineShape, RectShape, Stack } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import styles from './chart-tooltip.module.scss';
import { TooltipRow } from './tooltip-row';
import { exactFormatOf, isChartDatumEntry } from './utils';
import type { DataFormat } from '../../types';

/** Swatch box per indicator type; a supplementary row's spacer takes the width. */
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

	/**
	 * Series keys in the same order as `seriesStyles`, pairing a row with its style by
	 * key rather than position — charts emit rows in their own order, so a positional
	 * lookup hands rows the wrong swatch. Omit when rows arrive in series order.
	 */
	seriesKeys?: string[];

	indicatorType: 'line' | 'rect';

	/**
	 * Rows read out for context rather than drawn, keyed by row key: no series
	 * swatch, and a format of their own where the chart's does not fit them (a
	 * count listed beside currencies). `undefined` keeps the chart's format.
	 */
	supplementaryRows?: Record< string, DataFormat | undefined >;

	/**
	 * `split` sets the label left and the value right; `inline` renders the label
	 * alone, for a `getLabel` that already spells the value into it.
	 */
	layout?: 'split' | 'inline';

	/**
	 * `value` is the row's value spelled out in full, in the row's own format;
	 * `rawValue` picks a plural form. Both are null for a bucket with no reading.
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

// No positional fallback once `seriesKeys` is given: that lookup is the bug
// the prop exists to fix, and on a miss it paints a plausible wrong swatch.
function seriesStyleFor(
	key: string,
	index: number,
	seriesStyles: TooltipStyle[],
	seriesKeys: string[] | undefined
): TooltipStyle {
	const style = seriesKeys ? seriesStyles[ seriesKeys.indexOf( key ) ] : seriesStyles[ index ];
	return style || seriesStyles[ 0 ];
}

function SeriesIndicator( {
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
 * Self-contained chart tooltip. Indicators use the chart library's own
 * `LineShape` / `RectShape` so they match the series they describe.
 */
export function ChartTooltip< TDatum >( {
	tooltipData,
	dataFormat,
	seriesStyles,
	seriesKeys,
	indicatorType,
	supplementaryRows,
	layout = 'split',
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

				const value = getValue( entry.datum );
				const isSupplementary = supplementaryRows !== undefined && entry.key in supplementaryRows;
				const rowFormat = ( isSupplementary && supplementaryRows[ entry.key ] ) || dataFormat;
				const exactFormat = exactFormatOf( rowFormat );
				const label = getLabel(
					entry.datum,
					index,
					entry.key,
					value === null ? null : formatMetricValue( value, exactFormat.type, exactFormat.options ),
					value
				);
				const rowValue = layout === 'inline' ? undefined : value;

				return (
					<TooltipRow
						key={ entry.key }
						indicator={
							isSupplementary ? (
								// Holds the swatch's width, so the labels stay aligned.
								<span
									className={ styles.indicatorSpacer }
									style={ { inlineSize: INDICATOR_SIZE[ indicatorType ].width } }
									aria-hidden="true"
								/>
							) : (
								<SeriesIndicator
									indicatorType={ indicatorType }
									style={ seriesStyleFor( entry.key, index, seriesStyles, seriesKeys ) }
								/>
							)
						}
						label={ label }
						value={ rowValue }
						dataFormat={ rowFormat }
					/>
				);
			} ) }
		</Stack>
	);
}
