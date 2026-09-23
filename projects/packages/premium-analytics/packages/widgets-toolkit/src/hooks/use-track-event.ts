/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { resolveIntervalForRange } from '@jetpack-premium-analytics/data';
import { PRESET_CUSTOM } from '@jetpack-premium-analytics/datetime';
import {
	deriveComparisonRange,
	encodeRangeToSearchParams,
	type ReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import { useCallback, useRef } from 'react';

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

type DateRangeState = Pick<
	ReportDateFilters,
	'presetId' | 'range' | 'interval' | 'comparisonPresetId'
>;

type StagedRange = Parameters< ReportDateFilters[ 'onChange' ] >;

/**
 * Records `jetpack_premium_analytics_date_range_apply`. Call `trackedOnChange` beside the date filters'
 * `onChange`: a quick preset stages and applies in one tick, before `state` catches up.
 *
 * @param {DateRangeState}        state   - The date filters' rendered range, interval and comparison.
 * @param {DateRangeApplyContext} context - Where the range is applied.
 * @return `trackedOnChange` to remember a staged range, and `trackedOnApply` to record its apply.
 */
export function useTrackedDateRangeApply(
	{ presetId, range, interval, comparisonPresetId }: DateRangeState,
	{ surface, section, offersComparison }: DateRangeApplyContext
) {
	const trackEvent = useTrackEvent();
	const staged = useRef< StagedRange | null >( null );

	const trackedOnChange = useCallback( ( ...args: StagedRange ) => {
		staged.current = args;
	}, [] );

	const trackedOnApply = useCallback( () => {
		const [ stagedRange, stagedPresetId, options ] = staged.current ?? [];
		staged.current = null;

		const appliedPresetId = stagedPresetId ?? presetId;
		const appliedRange = stagedRange?.from && stagedRange.to ? stagedRange : range;

		if ( ! appliedRange.from || ! appliedRange.to ) {
			return;
		}

		// Encoded and resolved the way `buildRangePatch` stages them, so the event matches the URL.
		const { from, to } = encodeRangeToSearchParams(
			{ from: appliedRange.from, to: appliedRange.to },
			{ presetId: appliedPresetId, exactRange: options?.exactRange }
		);
		const isCustom = ! appliedPresetId || appliedPresetId === PRESET_CUSTOM;
		const comparison =
			offersComparison && comparisonPresetId
				? deriveComparisonRange( {
						comp: '1',
						from,
						to,
						preset: appliedPresetId,
						compare_preset: comparisonPresetId,
					} )?.compare_preset
				: undefined;

		trackEvent( 'jetpack_premium_analytics_date_range_apply', {
			surface,
			...( section ? { section } : {} ),
			range_type: isCustom ? 'custom' : 'preset',
			...( isCustom ? {} : { preset: appliedPresetId } ),
			interval: resolveIntervalForRange( appliedPresetId, from, to, interval ),
			comparison: comparison ?? 'none',
		} );
	}, [
		presetId,
		range,
		interval,
		comparisonPresetId,
		trackEvent,
		surface,
		section,
		offersComparison,
	] );

	return { trackedOnChange, trackedOnApply };
}
