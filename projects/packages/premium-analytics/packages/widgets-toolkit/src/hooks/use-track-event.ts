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
import { useCallback, useMemo, useRef } from 'react';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

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

/**
 * The page a tracked event came from.
 */
export type TrackingSurface = 'dashboard' | 'post_detail' | 'author_detail' | 'video_detail';

/**
 * The widgets in one layout whose instances the other lacks, in layout order.
 *
 * @param layout - The layout to list from.
 * @param other  - The layout to compare against.
 * @return The widgets, in layout order.
 */
function widgetsMissingFrom( layout: DashboardWidget[], other: DashboardWidget[] ) {
	const uuids = new Set( other.map( widget => widget.uuid ) );

	return layout.filter( widget => ! uuids.has( widget.uuid ) );
}

/**
 * The widgets' types, comma-joined.
 *
 * @param widgets - The widgets to list.
 * @return The widget types, in the given order.
 */
function joinTypes( widgets: DashboardWidget[] ) {
	return widgets.map( widget => widget.type ).join( ',' );
}

/**
 * Tracks the customize lifecycle (`customize_start`, `customize_save`, `customize_exit`,
 * `customize_reset`) and every widget a commit adds or removes (`widget_add`, `widget_remove`).
 *
 * @param surface - The page being customized.
 * @param section - The dashboard section, on the dashboard only.
 * @return Callbacks to call from the page's own customize handlers.
 */
export function useTrackCustomize( surface?: TrackingSurface, section?: string ) {
	const trackEvent = useTrackEvent();
	const pendingSave = useRef< Record< string, unknown > | null >( null );

	return useMemo( () => {
		const properties = { surface, ...( section ? { section } : {} ) };

		return {
			start: () => trackEvent( 'jetpack_premium_analytics_customize_start', properties ),

			layoutChange: ( previous: DashboardWidget[], next: DashboardWidget[] ) => {
				const added = widgetsMissingFrom( next, previous );
				const removed = widgetsMissingFrom( previous, next );

				// Not held like the save below: a commit with no exit behind it carries no
				// added or removed widget, so there is nothing to discard.
				const recordEach = ( eventName: string, widgets: DashboardWidget[] ) => {
					for ( const widget of widgets ) {
						trackEvent( eventName, {
							...properties,
							widget_type: widget.type,
							widget_count: next.length,
						} );
					}
				};
				recordEach( 'jetpack_premium_analytics_widget_add', added );
				recordEach( 'jetpack_premium_analytics_widget_remove', removed );

				/*
				 * The save is held until the end of the tick rather than recorded here: Done commits
				 * the layout and leaves edit mode in one call, while an inline widget edit saving
				 * itself — which upstream flushes on entering edit mode — arrives with no exit behind it.
				 */
				pendingSave.current = {
					widget_count: next.length,
					widgets_added: joinTypes( added ),
					widgets_removed: joinTypes( removed ),
				};
				queueMicrotask( () => {
					pendingSave.current = null;
				} );
			},

			exit: () => {
				const save = pendingSave.current;
				pendingSave.current = null;

				if ( save ) {
					trackEvent( 'jetpack_premium_analytics_customize_save', { ...properties, ...save } );
				}
				trackEvent( 'jetpack_premium_analytics_customize_exit', { ...properties, saved: !! save } );
			},

			reset: () => trackEvent( 'jetpack_premium_analytics_customize_reset', properties ),
		};
	}, [ section, surface, trackEvent ] );
}

type DateRangeApplyContext = {
	surface: TrackingSurface;

	/** The dashboard section slug. */
	section?: string;

	/** Whether the surface shows the comparison; detail pages keep it in the URL but never draw it. */
	offersComparison: boolean;
};

type DateRangeState = Pick<
	ReportDateFilters,
	'presetId' | 'range' | 'interval' | 'comparisonPresetId' | 'appliedComparisonRange'
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
	{ presetId, range, interval, comparisonPresetId, appliedComparisonRange }: DateRangeState,
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
		// A comparison linked without a preset commits as the previous period, so test the range too.
		const comparison =
			offersComparison && ( comparisonPresetId || appliedComparisonRange )
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
		appliedComparisonRange,
		trackEvent,
		surface,
		section,
		offersComparison,
	] );

	return { trackedOnChange, trackedOnApply };
}
