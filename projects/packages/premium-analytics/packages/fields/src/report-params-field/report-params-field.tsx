/**
 * External dependencies
 */
import {
	ReportScopeProvider,
	chartInterval,
	drawableIntervals,
	getAllowedIntervalsForPreset,
	getDefaultPreset,
	getDefaultReportParams,
	getStoreInfo,
	hasComparisonEnabled,
	normalizeReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	type IntervalType,
	QUICK_SURFACE_PRESETS,
	type QuickSurfacePresetId,
	reportingTimeZone,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import {
	decodeDateSearchParam,
	deriveComparisonRange,
	encodeDateToSearchParam,
	encodeRangeToSearchParams,
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
	/**
	 * The quick presets to offer, in display order. Defaults to every rolling window.
	 */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * The bucket sizes the widget's chart draws — the same list it clamps against.
	 * Only affects the interval control.
	 */
	periods?: readonly [ StatsPeriod, ...StatsPeriod[] ];
};

type ReportParamsFieldOptions = {
	/**
	 * Whether to offer the chart bucket control.
	 */
	withIntervalControl?: boolean;

	/**
	 * How fine the widget's report is.
	 */
	grain?: ReportGrain;
	/** Omit to inherit the host's scope. */
	offersComparison?: boolean;
};

/**
 * The params a widget that owns its date range starts on, clamped to its grain.
 *
 * The store default follows how long the site has been live, so a site launched
 * today starts on `today` — a window a widget whose report has no sub-daily
 * bucket does not offer, and would draw as a single point.
 *
 * @param grain           - How fine the widget's report is.
 * @param grain.presetIds - The windows the widget offers.
 * @return The starting report params.
 */
export function defaultReportParamsForGrain( { presetIds }: ReportGrain = {} ): ReportParams {
	const { preset } = getDefaultReportParams();

	return presetIds && ! ( presetIds as readonly string[] ).includes( preset )
		? { preset: presetIds[ 0 ] }
		: { preset };
}

// A widget saved before the field existed carries no params; the picker falls
// back to the store defaults through `normalizeReportParams`.
const NO_REPORT_PARAMS: ReportParams = {};

/**
 * Build a widget-owned report params field. Called once at module scope, so the
 * component identity is stable across renders.
 *
 * @param {ReportParamsFieldOptions} options - Field options.
 * @return A DataForm control component.
 */
function createReportParamsField( {
	withIntervalControl,
	grain,
	offersComparison = true,
}: ReportParamsFieldOptions = {} ) {
	return function ReportParamsFieldControl(
		props: DataFormControlProps< Partial< ReportParamsFieldAttributes > >
	) {
		const control = (
			<ReportParamsControl
				{ ...props }
				withIntervalControl={ withIntervalControl }
				grain={ grain }
			/>
		);

		/*
		 * The host renders this outside the widget tree, so it inherits the section's
		 * scope: on a comparison-enabled section it would offer and save a comparison
		 * the widget body then discards.
		 */
		return offersComparison ? (
			control
		) : (
			<ReportScopeProvider offersComparison={ false }>{ control }</ReportScopeProvider>
		);
	};
}

/**
 * The "Date range" attribute a widget declares to host its own date controls.
 *
 * Options travel through this factory, not the descriptor: dataviews rebuilds a
 * normalized field from a fixed set of keys and drops the rest.
 *
 * @param {ReportParamsFieldOptions} options - Field options.
 * @return The attribute descriptor.
 */
export function reportParamsAttributeField<
	Attributes extends Partial< ReportParamsFieldAttributes >,
>( options: ReportParamsFieldOptions = {} ): WidgetAttributeField< Attributes > {
	return {
		// `Attributes` is unresolved here, so TS cannot see that it carries
		// `reportParams`: the key and the control both need the cast.
		id: 'reportParams' as keyof Attributes & string,
		label: __( 'Date range', 'jetpack-premium-analytics-pkg' ),
		// The host renders a high-relevance field in the widget's own header.
		relevance: 'high',
		Edit: createReportParamsField( options ) as WidgetAttributeField< Attributes >[ 'Edit' ],
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
	const { preset: fallbackPreset } = defaultReportParamsForGrain( grain );

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
		( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
			const patch: Partial< ReportParams > = {};

			if ( nextRange?.from && nextRange?.to ) {
				Object.assign(
					patch,
					encodeRangeToSearchParams(
						{ from: nextRange.from, to: nextRange.to },
						{ presetId: nextPresetId }
					)
				);
			}

			if ( nextPresetId ) {
				patch.preset = nextPresetId;
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
