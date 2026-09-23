/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { hasComparisonEnabled, resolveIntervalForRange } from '@jetpack-premium-analytics/data';
import { PRESET_CUSTOM } from '@jetpack-premium-analytics/datetime';
import { useCallback } from 'react';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

// The tracker is a page-wide singleton: identify once per page load, not per event
// and not on every consumer's mount.
let hasIdentified = false;

/**
 * Reset the identify latch. Test-only.
 *
 * Module state outlives a render/unmount cycle by design, which is the point of the latch,
 * but it would otherwise leave every test after the first observing nothing.
 */
export function resetTracksIdentityForTesting() {
	hasIdentified = false;
}

/**
 * Identify the reader and pin `blog_id` onto every event from this page load.
 */
function identifyOnce() {
	if ( hasIdentified ) {
		return;
	}
	hasIdentified = true;

	const scriptData = getScriptData();
	const wpcomUser = scriptData?.user?.current_user?.wpcom;

	// Not `initialize()`: it routes through `setSuperProps`, which replaces rather than
	// merges, so it would wipe whatever another consumer on this page already pinned.
	if ( wpcomUser?.ID && wpcomUser?.login ) {
		jetpackAnalytics.setUser( wpcomUser.ID, wpcomUser.login );
		jetpackAnalytics.identifyUser();
	}

	const blogId = scriptData?.site?.wpcom?.blog_id;

	if ( blogId ) {
		jetpackAnalytics.assignSuperProps( { blog_id: blogId } );
	}
}

/**
 * Returns a stable callback for emitting `jetpack_premium_analytics_*` Tracks events.
 *
 * @return Callback recording a Tracks event by name, with optional properties.
 */
export function useTrackEvent() {
	return useCallback( ( eventName: string, properties?: Record< string, unknown > ) => {
		identifyOnce();

		jetpackAnalytics.tracks.recordEvent( eventName, properties );
	}, [] );
}

type DateRangeApplyContext = {
	surface: 'dashboard' | 'post_detail' | 'author_detail' | 'video_detail';

	/** The dashboard section slug. */
	section?: string;

	/** Whether the surface shows the comparison; detail pages keep it in the URL but never draw it. */
	offersComparison: boolean;
};

/**
 * Wraps a date-filter `onApply` to record `jetpack_premium_analytics_date_range_apply`
 * from the params it commits: the draft a same-tick quick preset stages is not yet in any render.
 *
 * @param {ReportDateFilters[ 'onApply' ]} onApply - The date-filter controller's `onApply`.
 * @param {DateRangeApplyContext}          context - Where the range is applied.
 * @return The wrapped `onApply`.
 */
export function useTrackedDateRangeApply(
	onApply: ReportDateFilters[ 'onApply' ],
	{ surface, section, offersComparison }: DateRangeApplyContext
): ReportDateFilters[ 'onApply' ] {
	const trackEvent = useTrackEvent();

	return useCallback( () => {
		const params = onApply();

		if ( ! params ) {
			return params;
		}

		const isCustom = ! params.preset || params.preset === PRESET_CUSTOM;

		trackEvent( 'jetpack_premium_analytics_date_range_apply', {
			surface,
			...( section ? { section } : {} ),
			range_type: isCustom ? 'custom' : 'preset',
			...( isCustom ? {} : { preset: params.preset } ),
			interval: resolveIntervalForRange(
				params.preset,
				params.from ?? '',
				params.to ?? '',
				params.interval
			),
			// Stored without a preset, a comparison is the previous period (see `deriveComparisonRange`).
			comparison:
				offersComparison && hasComparisonEnabled( params )
					? ( params.compare_preset ?? 'previous-period' )
					: 'none',
		} );

		return params;
	}, [ onApply, trackEvent, surface, section, offersComparison ] );
}
