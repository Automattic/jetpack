import {
	getFormatter,
	getMaxTicksForWidth,
	getSeriesExtent,
	getTimeAxisTickValues,
	guessOptimalNumTicks,
} from './time-axis';
import type { useChartDataTransform } from '../../hooks';
import type { AxisOptions, ChartFormatting, OrientationType } from '../../types';

type ChartSeries = ReturnType< typeof useChartDataTransform >[ number ];

type BuildTimeAxisOptionsArgs = {
	/** Series as returned by `useChartDataTransform`. */
	dataSorted: ReturnType< typeof useChartDataTransform >;
	/** Chart width in pixels, which bounds how many ticks fit. */
	width: number;
	/** The caller's `options.axis.x`. */
	axisOptions?: AxisOptions;
	/** The caller's `options.xScale.domain`. */
	scaleDomain?: [ Date, Date ];
	/** The chart's current zoom window, when zoomed. */
	zoomDomain?: [ Date, Date ];
	/** Host locale and time zone. */
	formatting: ChartFormatting;
	/** Whether visx mounts a series, i.e. the legend shows it. Defaults to all of them. */
	isSeriesRendered?: ( series: ChartSeries ) => boolean;
};

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
 * @param args.isSeriesRendered - Whether visx mounts a series, i.e. the legend shows it.
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
	const { tickResolution, tickFormat, ...rest } = axisOptions ?? {};

	// A series visx never mounts is absent from the scale it builds, so a tick
	// chosen from one would be placed outside the domain.
	const rendered = isSeriesRendered ? dataSorted.filter( isSeriesRendered ) : dataSorted;

	// The same precedence the scale resolves: a zoom window wins, then the
	// caller's domain, then the extent of what is drawn.
	const effectiveDomain = zoomDomain ?? scaleDomain ?? getSeriesExtent( rendered );

	const ownFormatter = getFormatter( dataSorted, tickResolution, formatting, effectiveDomain );
	const formatter = tickFormat || ownFormatter;

	// Only for our own formatter: a caller's tickFormat wasn't written for
	// these values. Mirrors the guard in `use-bar-chart-options.ts`.
	const tickValues =
		tickFormat || rest.tickValues
			? null
			: getTimeAxisTickValues(
					rendered,
					effectiveDomain,
					ownFormatter,
					rest.numTicks ?? getMaxTicksForWidth( width )
			  );

	// An axis with no tick values of ours falls back to visx's fixed default of
	// ten, whatever the chart's width; count what fits under the caller's own
	// formatter instead.
	const numTicks = tickFormat
		? rest.numTicks ?? guessOptimalNumTicks( rendered, width, formatter )
		: undefined;

	return {
		orientation: 'bottom',
		...( tickValues ? { tickValues } : {} ),
		...( numTicks === undefined ? {} : { numTicks } ),
		tickFormat: formatter,
		display: true,
		...rest,
	};
};
