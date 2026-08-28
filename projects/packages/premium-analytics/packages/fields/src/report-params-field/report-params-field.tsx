/**
 * External dependencies
 */
import {
	getAllowedIntervalsForPreset,
	getDefaultPreset,
	getStoreInfo,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	endOfDayTZ,
	type IntervalType,
	isPrimaryPreset,
	QUICK_SURFACE_PRESETS,
	type QuickSurfacePresetId,
	siteTimeZone,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import {
	decodeDateSearchParam,
	deriveComparisonRange,
	encodeDateToSearchParam,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

/*
 * The editor lives here rather than in widgets-toolkit so widget metadata
 * modules can consume it through this package's script module: the toolkit is
 * bundled-from-source and its scss graph cannot enter the widget metadata build.
 *
 * `getStoreInfo()` is imported rather than read from context because the control
 * renders as host chrome outside the widget tree, where `WidgetRootContext` is
 * unreachable.
 */

type ReportParams = NonNullable< Parameters< typeof normalizeReportParams >[ 0 ] >;

export type ReportParamsFieldAttributes = {
	reportParams: ReportParams;
};

type ReportParamsFieldOptions = {
	withIntervalControl?: boolean;
	presetIds?: readonly QuickSurfacePresetId[];
};

/**
 * Build a widget-owned report params field.
 *
 * @param options                     - Field options.
 * @param options.withIntervalControl - Whether to offer the chart bucket control.
 * @param options.presetIds           - The quick presets to offer, in display
 *                                    order. Defaults to every rolling window.
 * @return A DataForm control component.
 */
export function createReportParamsField( {
	withIntervalControl,
	presetIds,
}: ReportParamsFieldOptions = {} ) {
	return function ReportParamsFieldControl(
		props: DataFormControlProps< ReportParamsFieldAttributes >
	) {
		return (
			<ReportParamsControl
				{ ...props }
				withIntervalControl={ withIntervalControl }
				presetIds={ presetIds }
			/>
		);
	};
}

function ReportParamsControl( {
	data: attributes,
	onChange,
	withIntervalControl,
	presetIds,
}: DataFormControlProps< ReportParamsFieldAttributes > & ReportParamsFieldOptions ) {
	const [ stagedReportParams, setStagedReportParams ] = useState< ReportParams >(
		attributes?.reportParams
	);

	/*
	 * `DateRangeFilter` applies a quick preset by calling `onChange` and then
	 * `onApply` in the same tick, so the commit below cannot read the state that
	 * `onChange` just queued — it would write the previous selection back over
	 * the new one, leaving the widget a click behind. Mirror the staged params
	 * into a ref that every stage updates synchronously.
	 */
	const stagedRef = useRef< ReportParams >( stagedReportParams );

	const stage = useCallback( ( next: ReportParams ) => {
		stagedRef.current = next;
		setStagedReportParams( next );
	}, [] );

	/*
	 * Realign the draft when the params change from outside this control — an
	 * undo, a dashboard reset, another surface saving the same widget. Without
	 * it `commit` writes the stale draft back over that change. Key on the
	 * value, not the object: a host that builds the attribute during render
	 * would otherwise wipe the draft on every render.
	 */
	const committed = attributes?.reportParams;
	const committedKey = JSON.stringify( committed ?? null );

	useEffect( () => {
		stagedRef.current = committed;
		setStagedReportParams( committed );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ committedKey ] );

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	const reportParams = normalizeReportParams( stagedReportParams, defaultPreset );

	const range = {
		from: decodeDateSearchParam( reportParams.from ),
		to: decodeDateSearchParam( reportParams.to ),
	};

	// What the widget is actually showing. Without it an open draft clears the
	// preset, and the pill row reports no selection at all.
	const appliedParams = normalizeReportParams( committed, defaultPreset );

	const appliedRange = {
		from: decodeDateSearchParam( appliedParams.from ),
		to: decodeDateSearchParam( appliedParams.to ),
	};

	/*
	 * Migrate an instance saved on a window this widget stopped offering: left
	 * alone it highlights no pill, reads "Custom", and keeps a bucket menu scoped
	 * to that window. A custom range or a year is not ours to rewrite.
	 */
	const offeredPresetIds = presetIds as readonly string[] | undefined;
	const fallbackPreset = offeredPresetIds?.includes( defaultPreset )
		? defaultPreset
		: presetIds?.[ 0 ];

	const appliedPreset = appliedParams.preset;
	const isUnofferedPreset =
		!! offeredPresetIds &&
		!! appliedPreset &&
		( QUICK_SURFACE_PRESETS as readonly string[] ).includes( appliedPreset ) &&
		! offeredPresetIds.includes( appliedPreset );

	const hasMigratedPreset = useRef( false );

	useEffect( () => {
		if ( hasMigratedPreset.current || ! isUnofferedPreset || ! fallbackPreset ) {
			return;
		}
		hasMigratedPreset.current = true;
		// A preset alone, the shape `getDefaultReportParams` writes: the stored
		// window and bucket describe a range this widget no longer offers.
		const migrated = { ...committed, preset: fallbackPreset };
		delete migrated.from;
		delete migrated.to;
		delete migrated.interval;
		onChange( { reportParams: migrated } );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isUnofferedPreset, fallbackPreset ] );

	const stageDateRange = useCallback(
		( nextRange?: DateRange, nextPresetId?: string ) => {
			const nextReportParams = { ...stagedReportParams };

			if ( nextRange?.from && nextRange?.to ) {
				nextReportParams.from = encodeDateToSearchParam( nextRange.from );
				nextReportParams.to = encodeDateToSearchParam(
					// The site's day boundary, not the visitor's (see build-range-patch).
					endOfDayTZ( nextRange.to, siteTimeZone() )
				);
			}

			if ( nextPresetId && isPrimaryPreset( nextPresetId ) ) {
				nextReportParams.preset = nextPresetId;
			} else if ( nextPresetId ) {
				delete nextReportParams.preset;
			}

			if ( reportParams.comp === '1' ) {
				const derived = deriveComparisonRange( nextReportParams );
				if ( derived ) {
					nextReportParams.compare_from = derived.compare_from;
					nextReportParams.compare_to = derived.compare_to;
				}
			}

			stage( nextReportParams );
		},
		[ stagedReportParams, reportParams.comp, stage ]
	);

	const isDateRangeDirty = useMemo( () => {
		return (
			attributes?.reportParams?.from !== stagedReportParams?.from ||
			attributes?.reportParams?.to !== stagedReportParams?.to ||
			attributes?.reportParams?.preset !== stagedReportParams?.preset
		);
	}, [
		attributes?.reportParams?.from,
		attributes?.reportParams?.to,
		attributes?.reportParams?.preset,
		stagedReportParams?.from,
		stagedReportParams?.to,
		stagedReportParams?.preset,
	] );

	const changeComparisonRange = useCallback(
		( nextComparisonRange?: DateRange, nextComparisonPresetId?: ComparisonPresetId ) => {
			const next = {
				...stagedReportParams,
				compare_from: encodeDateToSearchParam( nextComparisonRange?.from ),
				compare_to: encodeDateToSearchParam( nextComparisonRange?.to ),
				compare_preset: nextComparisonPresetId,
				comp: nextComparisonRange ? ( '1' as const ) : undefined,
			};
			stage( next );

			// Rides along with an open range draft, so changing the comparison
			// never applies a range the user has not committed.
			if ( ! isDateRangeDirty ) {
				onChange( { reportParams: next } );
			}
		},
		[ stagedReportParams, isDateRangeDirty, onChange, stage ]
	);

	const commit = useCallback( () => {
		onChange( { reportParams: stagedRef.current } );
	}, [ onChange ] );

	const clear = useCallback( () => {
		stage( attributes?.reportParams );
	}, [ stage, attributes ] );

	/*
	 * Options and checked value both come from the staged params, so the checked
	 * bucket is always a listed one — `normalizeReportParams` already resolved
	 * `interval` against this very range. Reading the options from the committed
	 * range instead would let the menu offer a bucket the drafted range cannot
	 * hold, and the resolve below would then silently drop the click.
	 */
	const intervalOptions = useMemo(
		() =>
			getAllowedIntervalsForPreset(
				reportParams.preset,
				reportParams.from ?? '',
				reportParams.to ?? ''
			),
		[ reportParams.preset, reportParams.from, reportParams.to ]
	);

	const changeInterval = useCallback(
		( nextInterval: IntervalType ) => {
			const next = { ...stagedReportParams, interval: nextInterval };
			stage( next );

			// Applies on click, the way the preset pills do — unless a range draft
			// is open, in which case it rides along and commits on Apply.
			if ( ! isDateRangeDirty ) {
				onChange( { reportParams: next } );
			}
		},
		[ stagedReportParams, isDateRangeDirty, onChange, stage ]
	);

	return (
		<Stack direction="column" gap="sm">
			<DateFiltersPanel
				range={ range }
				presetId={ stagedReportParams?.preset ?? reportParams.preset }
				appliedPresetId={ appliedParams.preset }
				appliedRange={ appliedRange }
				comparisonPresetId={ stagedReportParams?.compare_preset }
				onChange={ stageDateRange }
				onComparisonChange={ changeComparisonRange }
				onApply={ commit }
				canApply={ isDateRangeDirty }
				onCancel={ clear }
				timeZone={ siteTimeZone() }
				presetIds={ presetIds }
				withIntervalControl={ withIntervalControl }
				interval={ reportParams.interval }
				intervalOptions={ intervalOptions }
				onIntervalChange={ changeInterval }
			/>
		</Stack>
	);
}
