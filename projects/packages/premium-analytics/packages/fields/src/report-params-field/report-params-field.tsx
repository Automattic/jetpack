/**
 * External dependencies
 */
import {
	chartInterval,
	drawableIntervals,
	getAllowedIntervalsForPreset,
	getDefaultPreset,
	getStoreInfo,
	hasComparisonEnabled,
	normalizeReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	endOfDayTZ,
	type IntervalType,
	isPrimaryPreset,
	QUICK_SURFACE_PRESETS,
	type QuickSurfacePresetId,
	reportingTimeZone,
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
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

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

/**
 * How fine the widget's report is. The control offers nothing the report cannot
 * fill: a window with no data behind it, or a bucket the chart would clamp away.
 */
export type ReportGrain = {
	/** The quick presets to offer, in display order. Defaults to every rolling window. */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * The bucket sizes the widget's chart draws — the same list it clamps against.
	 * Only affects the interval control.
	 */
	periods?: readonly [ StatsPeriod, ...StatsPeriod[] ];
};

type ReportParamsFieldOptions = {
	withIntervalControl?: boolean;
	grain?: ReportGrain;
};

// A widget saved before the field existed carries no params; the picker falls
// back to the store defaults through `normalizeReportParams`.
const NO_REPORT_PARAMS: ReportParams = {};

/**
 * Build a widget-owned report params field. Called once at module scope, so the
 * component identity is stable across renders.
 *
 * @param options                     - Field options.
 * @param options.withIntervalControl - Whether to offer the chart bucket control.
 * @param options.grain               - How fine the widget's report is.
 * @return A DataForm control component.
 */
function createReportParamsField( { withIntervalControl, grain }: ReportParamsFieldOptions = {} ) {
	return function ReportParamsFieldControl(
		props: DataFormControlProps< Partial< ReportParamsFieldAttributes > >
	) {
		return (
			<ReportParamsControl
				{ ...props }
				withIntervalControl={ withIntervalControl }
				grain={ grain }
			/>
		);
	};
}

/**
 * The "Date range" attribute a widget declares to host its own date controls.
 *
 * Options travel through this factory, not the descriptor: dataviews rebuilds a
 * normalized field from a fixed set of keys and drops the rest.
 *
 * @param options                     - Field options.
 * @param options.withIntervalControl - Whether to offer the chart bucket control.
 * @param options.grain               - How fine the widget's report is.
 * @return The attribute descriptor.
 */
export function reportParamsAttributeField<
	Attributes extends Partial< ReportParamsFieldAttributes >,
>( options: ReportParamsFieldOptions = {} ): WidgetAttributeField< Attributes > {
	return {
		// Only the key needs the cast: `Attributes` is unresolved here, so TS
		// cannot see that it carries `reportParams`.
		id: 'reportParams' as keyof Attributes & string,
		label: __( 'Date range', 'jetpack-premium-analytics-pkg' ),
		// The host renders a high-relevance field in the widget's own header.
		relevance: 'high',
		Edit: createReportParamsField( options ),
	};
}

function ReportParamsControl( {
	data: attributes,
	onChange,
	withIntervalControl,
	grain,
}: DataFormControlProps< Partial< ReportParamsFieldAttributes > > & ReportParamsFieldOptions ) {
	const { presetIds, periods } = grain ?? {};
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
					endOfDayTZ( nextRange.to, reportingTimeZone() )
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
					// May differ from the active preset: a preset the new range no
					// longer offers falls back to the previous period.
					patch.compare_preset = derived.compare_preset;
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

	// Staged, not committed: a range being drafted has to reshape the menu with
	// it, or the click is dropped on Apply.
	const intervalOptions = useMemo( () => {
		const allowed = getAllowedIntervalsForPreset(
			reportParams.preset,
			reportParams.from ?? '',
			reportParams.to ?? ''
		);

		return periods ? drawableIntervals( allowed, periods ) : allowed;
	}, [ reportParams.preset, reportParams.from, reportParams.to, periods ] );

	// Check what the chart draws, through the call the chart itself makes: a
	// stored bucket the widget clamps away is not what is on screen.
	const interval = periods ? chartInterval( reportParams, periods ) : reportParams.interval;

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
				appliedPresetId={ appliedParams.preset }
				appliedRange={ appliedRange }
				comparisonPresetId={
					hasComparisonEnabled( stagedReportParams ) ? stagedReportParams.compare_preset : undefined
				}
				onChange={ stageDateRange }
				onComparisonChange={ changeComparisonRange }
				onApply={ commit }
				canApply={ isDateRangeDirty }
				onCancel={ revert }
				timeZone={ reportingTimeZone() }
				presetIds={ presetIds }
				withIntervalControl={ withIntervalControl }
				interval={ interval }
				intervalOptions={ intervalOptions }
				onIntervalChange={ changeInterval }
			/>
		</Stack>
	);
}
