import { getFormatter, getMaxTicksForWidth, getTimeAxisTickValues } from './time-axis';
import type { useChartDataTransform } from '../../hooks';
import type { AxisOptions, ChartFormatting, OrientationType } from '../../types';

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
};

/**
 * The x-axis options for a continuous time chart, shared by LineChart and AreaChart.
 *
 * Kept in one place so the tick-selection logic isn't duplicated between them.
 *
 * @param args             - Named arguments.
 * @param args.dataSorted  - Series as returned by `useChartDataTransform`.
 * @param args.width       - Chart width in pixels, which bounds how many ticks fit.
 * @param args.axisOptions - The caller's `options.axis.x`.
 * @param args.scaleDomain - The caller's `options.xScale.domain`.
 * @param args.zoomDomain  - The chart's current zoom window, when zoomed.
 * @param args.formatting  - Host locale and time zone.
 * @return Options ready to spread into the chart's `axis.x`; `orientation` is always set.
 */
export const buildTimeAxisOptions = ( {
	dataSorted,
	width,
	axisOptions,
	scaleDomain,
	zoomDomain,
	formatting,
}: BuildTimeAxisOptionsArgs ): AxisOptions & { orientation: OrientationType } => {
	const { tickResolution, tickFormat, ...rest } = axisOptions ?? {};
	const ownFormatter = getFormatter( dataSorted, tickResolution, formatting );
	const formatter = tickFormat || ownFormatter;

	// The same precedence the scale resolves: a zoom window wins, then the
	// caller's domain, then the data's own extent.
	const effectiveDomain = zoomDomain ?? scaleDomain;

	// Only for our own formatter: a caller's tickFormat wasn't written for
	// these values. Mirrors the guard in `use-bar-chart-options.ts`.
	const tickValues = tickFormat
		? null
		: getTimeAxisTickValues(
				dataSorted,
				effectiveDomain,
				ownFormatter,
				rest.numTicks ?? getMaxTicksForWidth( width )
		  );

	return {
		orientation: 'bottom',
		...( tickValues ? { tickValues } : {} ),
		tickFormat: formatter,
		display: true,
		...rest,
	};
};
