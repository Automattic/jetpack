import { useMemo } from 'react';
import { useChartFormatting } from '../../providers';
import { buildCalendarHeatmapData } from './private';
import type { CalendarHeatmapOptions, CalendarHeatmapResult } from './private';
import type { DataPointDate } from '../../types';

/**
 * `buildCalendarHeatmapData` with the locale and zone taken from
 * `GlobalChartsProvider` where the caller names neither.
 *
 * @param series  - Points to bucket.
 * @param options - As for `buildCalendarHeatmapData`; `locale` and `timeZone` win over the provider.
 * @return Columns and row labels for `HeatmapChart`.
 */
export const useCalendarHeatmapData = (
	series: DataPointDate[],
	options: CalendarHeatmapOptions = {}
): CalendarHeatmapResult => {
	const formatting = useChartFormatting();

	// `??` rather than a spread, so an explicit `undefined` in `options` reads as
	// "unset" and still picks the provider up.
	const locale = options.locale ?? formatting.locale;
	const timeZone = options.timeZone ?? formatting.timeZone;
	const { weekStartsOn, hideOutOfRangeDays } = options;
	const gridStart = options.gridSpan?.start;
	const gridEnd = options.gridSpan?.end;

	// Every dependency is a primitive: an options object is rebuilt on each render,
	// even by a caller that memoized its own, and would defeat this memo.
	return useMemo(
		() =>
			buildCalendarHeatmapData( series, {
				locale,
				timeZone,
				weekStartsOn,
				hideOutOfRangeDays,
				gridSpan: { start: gridStart, end: gridEnd },
			} ),
		[ series, locale, timeZone, weekStartsOn, hideOutOfRangeDays, gridStart, gridEnd ]
	);
};
