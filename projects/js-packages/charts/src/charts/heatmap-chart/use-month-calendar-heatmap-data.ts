import { useMemo } from 'react';
import { useChartFormatting } from '../../providers';
import { buildMonthCalendarHeatmapData } from './build-month-calendar-data';
import type {
	MonthCalendarHeatmapOptions,
	MonthCalendarHeatmapRange,
	MonthCalendarHeatmapResult,
} from './types';

/**
 * `buildMonthCalendarHeatmapData` with the locale taken from `GlobalChartsProvider`
 * where the caller names none.
 *
 * @param valueByDay - Value per `yyyy-MM-dd`. Held by reference, so a caller that rebuilds it each render defeats the memo.
 * @param range      - As for `buildMonthCalendarHeatmapData`.
 * @param options    - As for `buildMonthCalendarHeatmapData`; `locale` wins over the provider.
 * @return Columns and groups for `HeatmapChart`.
 */
export const useMonthCalendarHeatmapData = (
	valueByDay: Record< string, number | null >,
	range: MonthCalendarHeatmapRange,
	options: MonthCalendarHeatmapOptions = {}
): MonthCalendarHeatmapResult => {
	const formatting = useChartFormatting();
	const locale = options.locale ?? formatting.locale;
	const { weekStartsOn } = options;
	const { start, end } = range;

	// Spread into primitives: the option and range objects are rebuilt on each render.
	return useMemo(
		() => buildMonthCalendarHeatmapData( valueByDay, { start, end }, { locale, weekStartsOn } ),
		[ valueByDay, start, end, locale, weekStartsOn ]
	);
};
