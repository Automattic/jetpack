import type { IntervalType, PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

/*
 * Story stand-in for `getAllowedIntervalsForPreset`, which needs a range the
 * year-filter story does not keep. Covers the presets it answers by name alone;
 * anything else, custom ranges included, falls back to a few-weeks range's options.
 */
const STORY_INTERVAL_OPTIONS: Partial< Record< PrimaryPresetId, IntervalType[] > > = {
	today: [ 'hour' ],
	yesterday: [ 'hour' ],
	'last-24-hours': [ 'hour' ],
	'last-7-days': [ 'day' ],
	'last-30-days': [ 'day', 'week' ],
	'last-month': [ 'day', 'week' ],
	'last-90-days': [ 'week', 'month' ],
	'last-365-days': [ 'month', 'week', 'quarter' ],
	'last-12-months': [ 'month', 'week', 'quarter' ],
	'last-year': [ 'month', 'week', 'quarter' ],
	'last-3-years': [ 'year', 'month', 'quarter' ],
	'all-time': [ 'month', 'quarter', 'year' ],
};

/**
 * The buckets a preset allows, default first.
 */
export function getStoryIntervalOptions( presetId?: PrimaryPresetId ): IntervalType[] {
	const fallback: IntervalType[] = [ 'day', 'week' ];

	if ( ! presetId ) {
		return fallback;
	}

	// A calendar year buckets by month, week or quarter, but not by year.
	if ( presetId.startsWith( 'year-' ) ) {
		return [ 'month', 'week', 'quarter' ];
	}

	return STORY_INTERVAL_OPTIONS[ presetId ] ?? fallback;
}

/**
 * Apply the coercion the report params apply: keep a pick the range still
 * allows, otherwise fall back to the range default.
 */
export function resolveStoryInterval(
	picked: IntervalType | undefined,
	options: IntervalType[]
): IntervalType {
	return picked && options.includes( picked ) ? picked : options[ 0 ];
}
