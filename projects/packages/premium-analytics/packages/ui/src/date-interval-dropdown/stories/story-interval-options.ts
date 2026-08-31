import type { IntervalType, PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

/*
 * Story stand-in for `getAllowedIntervalsForPreset` (in the data package, not
 * a dependency here). Covers the presets the date surfaces offer; anything
 * else, custom ranges included, falls back to a few-weeks range's options.
 */
const STORY_INTERVAL_OPTIONS: Partial< Record< PrimaryPresetId, IntervalType[] > > = {
	'last-24-hours': [ 'hour', 'day' ],
	'last-7-days': [ 'day' ],
	'last-30-days': [ 'day', 'week' ],
	'last-12-months': [ 'month' ],
	'all-time': [ 'month', 'year' ],
};

/**
 * The buckets a preset allows, finest first.
 */
export function getStoryIntervalOptions( presetId?: PrimaryPresetId ): IntervalType[] {
	const fallback: IntervalType[] = [ 'day', 'week' ];

	if ( ! presetId ) {
		return fallback;
	}

	// A calendar year is long enough to bucket by month, but not by year.
	if ( presetId.startsWith( 'year-' ) ) {
		return [ 'month' ];
	}

	return STORY_INTERVAL_OPTIONS[ presetId ] ?? fallback;
}

/**
 * Apply the coercion the report params apply: keep a pick the range still
 * allows, otherwise fall back to the finest one it does.
 */
export function resolveStoryInterval(
	picked: IntervalType | undefined,
	options: IntervalType[]
): IntervalType {
	return picked && options.includes( picked ) ? picked : options[ 0 ];
}
