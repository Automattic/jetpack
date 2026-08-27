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
	hasPrimaryDateDraft,
	useStagedValue,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
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

// A widget saved before the field existed carries no params; the picker falls
// back to the store defaults through `normalizeReportParams`.
const NO_REPORT_PARAMS: ReportParams = {};

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
	const committed = attributes?.reportParams ?? NO_REPORT_PARAMS;

	const saveReportParams = useCallback(
		( next: ReportParams ) => onChange( { reportParams: next } ),
		[ onChange ]
	);

	const {
		staged: stagedReportParams,
		stage,
		commit,
		revert,
	} = useStagedValue< ReportParams >( committed, saveReportParams );

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
			const patch: Partial< ReportParams > = {};

			if ( nextRange?.from && nextRange?.to ) {
				patch.from = encodeDateToSearchParam( nextRange.from );
				patch.to = encodeDateToSearchParam(
					// The site's day boundary, not the visitor's (see build-range-patch).
					endOfDayTZ( nextRange.to, siteTimeZone() )
				);
			}

			if ( nextPresetId ) {
				patch.preset = isPrimaryPreset( nextPresetId ) ? nextPresetId : undefined;
			}

			if ( reportParams.comp === '1' ) {
				const derived = deriveComparisonRange( { ...stagedReportParams, ...patch } );
				if ( derived ) {
					patch.compare_from = derived.compare_from;
					patch.compare_to = derived.compare_to;
				}
			}

			stage( patch );
		},
		[ stagedReportParams, reportParams.comp, stage ]
	);

	const isDateRangeDirty = useMemo(
		() => hasPrimaryDateDraft( committed, stagedReportParams ),
		[ committed, stagedReportParams ]
	);

	const changeComparisonRange = useCallback(
		( nextComparisonRange?: DateRange, nextComparisonPresetId?: ComparisonPresetId ) => {
			stage( {
				compare_from: encodeDateToSearchParam( nextComparisonRange?.from ),
				compare_to: encodeDateToSearchParam( nextComparisonRange?.to ),
				compare_preset: nextComparisonPresetId,
				comp: nextComparisonRange ? ( '1' as const ) : undefined,
			} );

			// Rides along with an open range draft, so changing the comparison
			// never applies a range the user has not committed.
			if ( ! isDateRangeDirty ) {
				commit();
			}
		},
		[ isDateRangeDirty, commit, stage ]
	);

	// Listed and checked against the range being edited — see
	// `getAllowedIntervalsForPreset`. `normalizeReportParams` already resolved
	// `interval` against this very range, so the checked bucket is a listed one.
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
			stage( { interval: nextInterval } );

			// Applies on click, the way the preset pills do — unless a range draft
			// is open, in which case it rides along and commits on Apply.
			if ( ! isDateRangeDirty ) {
				commit();
			}
		},
		[ isDateRangeDirty, commit, stage ]
	);

	return (
		<Stack direction="column" gap="sm">
			<DateFiltersPanel
				range={ range }
				presetId={ stagedReportParams.preset ?? reportParams.preset }
				appliedPresetId={ appliedParams.preset }
				appliedRange={ appliedRange }
				comparisonPresetId={ stagedReportParams.compare_preset }
				onChange={ stageDateRange }
				onComparisonChange={ changeComparisonRange }
				onApply={ commit }
				canApply={ isDateRangeDirty }
				onCancel={ revert }
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
