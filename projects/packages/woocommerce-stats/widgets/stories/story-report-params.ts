import type { ReportParams } from '@automattic/jetpack-premium-analytics-sdk';

const startOfDay = ( date: string ) => `${ date }T00:00:00.000+00:00`;
const endOfDay = ( date: string ) => `${ date }T23:59:59.999+00:00`;

interface StoryReportParamsOptions {
	withComparison?: boolean;
	interval?: string;
}

/**
 * Fixed report params for a story, with no `preset` so the dates stay put.
 *
 * @param options                - The window options.
 * @param options.withComparison - Add the previous-period comparison window.
 * @param options.interval       - The bucket interval of the report.
 * @return The report params.
 */
export function storyReportParams( {
	withComparison = false,
	interval = 'day',
}: StoryReportParamsOptions = {} ): ReportParams {
	const params: ReportParams = {
		from: startOfDay( '2026-10-01' ),
		to: endOfDay( '2026-10-30' ),
		interval,
	};

	if ( ! withComparison ) {
		return params;
	}

	return {
		...params,
		comp: '1',
		compare_from: startOfDay( '2026-09-01' ),
		compare_to: endOfDay( '2026-09-30' ),
	};
}
