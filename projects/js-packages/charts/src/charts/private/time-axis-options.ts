import {
	getFormatter,
	getMaxTicksForWidth,
	getSeriesExtent,
	getTimeAxisTickValues,
	guessOptimalNumTicks,
} from './time-axis';
import type { useChartDataTransform } from '../../hooks';
import type { AxisOptions, ChartFormatting, OrientationType, ScaleOptions } from '../../types';

type ChartSeries = ReturnType< typeof useChartDataTransform >[ number ];

type BuildTimeAxisOptionsArgs = {
	dataSorted: ReturnType< typeof useChartDataTransform >;
	width: number;
	axisOptions?: AxisOptions;
	scaleDomain?: ScaleOptions[ 'domain' ];
	zoomDomain?: [ Date, Date ] | null;
	formatting: ChartFormatting;
	isSeriesRendered?: ( series: ChartSeries ) => boolean;
};

// A numeric domain is a legal `xScale.domain` that d3 coerces for itself, but
// the helpers below read `Date` methods off its members.
const toDateDomain = ( domain?: ScaleOptions[ 'domain' ] ): [ Date, Date ] | undefined =>
	domain ? [ new Date( domain[ 0 ] ), new Date( domain[ 1 ] ) ] : undefined;

/**
 * The x-axis options for a continuous time chart, shared by LineChart and AreaChart.
 *
 * Kept in one place so the tick-selection logic isn't duplicated between them.
 *
 * @param args                  - Named arguments.
 * @param args.dataSorted       - Series as returned by `useChartDataTransform`.
 * @param args.width            - Chart width in pixels, which bounds how many ticks fit.
 * @param args.axisOptions      - The caller's `options.axis.x`.
 * @param args.scaleDomain      - The caller's `options.xScale.domain`.
 * @param args.zoomDomain       - The chart's current zoom window, when zoomed.
 * @param args.formatting       - Host locale and time zone.
 * @param args.isSeriesRendered - Whether visx mounts a series, i.e. the legend shows it. Defaults to all of them.
 * @return Options ready to spread into the chart's `axis.x`; `orientation` is always set.
 */
export const buildTimeAxisOptions = ( {
	dataSorted,
	width,
	axisOptions,
	scaleDomain,
	zoomDomain,
	formatting,
	isSeriesRendered,
}: BuildTimeAxisOptionsArgs ): AxisOptions & { orientation: OrientationType } => {
	// Every key we resolve ourselves is destructured out: an own-but-undefined
	// key surviving in `rest` would clobber the derived value, as in #51531.
	const {
		tickResolution,
		tickFormat,
		tickValues: callerTickValues,
		numTicks: callerNumTicks,
		orientation: callerOrientation,
		display: callerDisplay,
		...rest
	} = axisOptions ?? {};

	// A series visx never mounts is absent from the scale it builds, so a tick
	// chosen from one would be placed outside the domain.
	const rendered = isSeriesRendered ? dataSorted.filter( isSeriesRendered ) : dataSorted;

	// The same precedence the scale resolves: a zoom window wins, then the
	// caller's domain, then the extent of what is drawn.
	const effectiveDomain = zoomDomain ?? toDateDomain( scaleDomain ) ?? getSeriesExtent( rendered );

	const ownFormatter = getFormatter( rendered, tickResolution, formatting, effectiveDomain );
	const formatter = tickFormat || ownFormatter;

	// Only for our own formatter: a caller's tickFormat wasn't written for
	// these values. Mirrors the guard in `use-bar-chart-options.ts`.
	const ownTickValues = tickFormat
		? null
		: getTimeAxisTickValues(
				rendered,
				effectiveDomain,
				ownFormatter,
				callerNumTicks ?? getMaxTicksForWidth( width )
		  );

	// An empty selection means the domain holds no point to tick, not that the
	// axis wants no ticks: visx reads `[]` as the latter and labels nothing.
	const tickValues = callerTickValues ?? ( ownTickValues?.length ? ownTickValues : undefined );

	// With no tick values to place, visx falls back to a fixed ten whatever the
	// chart's width; count what fits under the formatter in play instead.
	const numTicks =
		callerNumTicks ??
		( tickValues ? undefined : guessOptimalNumTicks( rendered, width, formatter ) );

	return {
		orientation: callerOrientation ?? 'bottom',
		tickFormat: formatter,
		display: callerDisplay ?? true,
		...rest,
		...( tickValues ? { tickValues } : {} ),
		...( numTicks === undefined ? {} : { numTicks } ),
	};
};
