import { getDate } from '@wordpress/date';
import { bucketHistoryDays, type HistoryWindow } from './history-days';
import type { PerformanceHistoryData } from './use-performance-history';

// Thirty days of overall scores for the free-plan preview, following the upsell design.
const desktopScores = [
	80, 80, 60, 60, 60, 60, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 88, 88, 88, 88, 88, 88,
	88, 88, 88, 95, 95, 95,
];
const mobileScores = [
	30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 55, 55, 55, 55, 55, 65, 65, 65, 65, 65, 65, 90,
	90, 90, 68, 68, 68, 68,
];

export function buildSampleHistory( window: HistoryWindow ): PerformanceHistoryData {
	const days = bucketHistoryDays( [], window );
	return {
		...window,
		annotations: [],
		periods: days.map( ( day, index ) => {
			const sample = Math.floor( ( index * desktopScores.length ) / days.length );
			return {
				timestamp: getDate( `${ day.date }T12:00:00` ).getTime(),
				dimensions: {
					desktop_overall_score: desktopScores[ sample ],
					mobile_overall_score: mobileScores[ sample ],
					desktop_lcp: 1.2,
					desktop_tbt: 0.1,
					desktop_cls: 0.02,
					mobile_lcp: 2.8,
					mobile_tbt: 0.4,
					mobile_cls: 0.05,
				},
			};
		} ),
	};
}
