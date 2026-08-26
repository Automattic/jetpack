/**
 * External dependencies
 */
import {
	getAllowedIntervalsForPreset,
	getDefaultPreset,
	normalizeReportParams,
	resolveIntervalForRange,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	endOfDayTZ,
	type IntervalType,
	isPrimaryPreset,
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
import { useCallback, useMemo, useState } from 'react';
import { getStoreInfo } from '../helpers/store-info';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

/*
 * Copied from widgets-toolkit `fields/date-report-params-field` so widget
 * metadata modules can consume it through this package's script module
 * (the toolkit is bundled-from-source and its scss graph cannot enter the
 * widget metadata build). The toolkit copy remains for render-side use
 * until fields fully owns the editors; keep the two in sync or delete the
 * toolkit copy when the toolkit dissolves.
 */

type ReportParams = NonNullable< Parameters< typeof normalizeReportParams >[ 0 ] >;

export type ReportParamsFieldAttributes = {
	reportParams: ReportParams;
};

export type ReportParamsFieldOptions = {
	/**
	 * Whether to offer the chart bucket control beside the range. Only a widget
	 * whose body is bucketed by it — a chart, not a records table — should.
	 */
	withIntervalControl?: boolean;
};

/**
 * Build the widget-header control for a widget that owns its own report params.
 *
 * The control is declared as a `relevance: 'high'` attribute in the widget's
 * `widget.ts`; the dashboard renders it inline in the widget header and saves
 * edits onto the widget instance. `WidgetRoot` already prefers
 * `attributes.reportParams` over the URL, so the control and the widget body
 * read one source with no further wiring.
 *
 * Comparison is not an option here: the panel takes it from the surrounding
 * `ReportScopeProvider`, which the dashboard declares once per section from
 * `date_filter_options.with_date_comparison`.
 *
 * @param options                     - Field options.
 * @param options.withIntervalControl - Whether to offer the chart bucket control.
 * @return A DataForm control component.
 */
export function createReportParamsField( { withIntervalControl }: ReportParamsFieldOptions = {} ) {
	return function ReportParamsFieldControl(
		props: DataFormControlProps< ReportParamsFieldAttributes >
	) {
		return <ReportParamsControl { ...props } withIntervalControl={ withIntervalControl } />;
	};
}

function ReportParamsControl( {
	data: attributes,
	onChange,
	withIntervalControl,
}: DataFormControlProps< ReportParamsFieldAttributes > & ReportParamsFieldOptions ) {
	const [ stagedReportParams, setStagedReportParams ] = useState< ReportParams >(
		attributes?.reportParams
	);

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	const reportParams = normalizeReportParams( stagedReportParams, defaultPreset );

	const range = {
		from: decodeDateSearchParam( reportParams.from ),
		to: decodeDateSearchParam( reportParams.to ),
	};

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

			setStagedReportParams( nextReportParams );
		},
		[ stagedReportParams, reportParams.comp ]
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

	const commitComparisonRange = useCallback(
		( nextComparisonRange?: DateRange, nextComparisonPresetId?: ComparisonPresetId ) => {
			onChange( {
				reportParams: {
					...reportParams,
					compare_from: encodeDateToSearchParam( nextComparisonRange?.from ),
					compare_to: encodeDateToSearchParam( nextComparisonRange?.to ),
					compare_preset: nextComparisonPresetId,
					comp: '1' as const,
				},
			} );
		},
		[ onChange, reportParams ]
	);

	const commit = useCallback( () => {
		onChange( { reportParams: stagedReportParams } );
	}, [ onChange, stagedReportParams ] );

	const clear = useCallback( () => {
		setStagedReportParams( attributes?.reportParams );
	}, [ setStagedReportParams, attributes ] );

	/*
	 * The bucket menu reads the committed range, not the draft: the control sits
	 * outside the picker, so a range being edited must not reshape it, and
	 * resolving the value through the same range that produced the options keeps
	 * the checked item a listed one. Same reasoning as `useReportDateFilters`.
	 */
	const applied = normalizeReportParams( attributes?.reportParams, defaultPreset );

	const intervalOptions = useMemo(
		() => getAllowedIntervalsForPreset( applied.preset, applied.from ?? '', applied.to ?? '' ),
		[ applied.preset, applied.from, applied.to ]
	);

	const interval = useMemo(
		() =>
			resolveIntervalForRange(
				applied.preset,
				applied.from ?? '',
				applied.to ?? '',
				reportParams.interval
			),
		[ applied.preset, applied.from, applied.to, reportParams.interval ]
	);

	const changeInterval = useCallback(
		( nextInterval: IntervalType ) => {
			const next = { ...stagedReportParams, interval: nextInterval };
			setStagedReportParams( next );

			// Applies on click, the way the preset pills do — unless a range draft
			// is open, in which case it rides along and commits on Apply.
			if ( ! isDateRangeDirty ) {
				onChange( { reportParams: next } );
			}
		},
		[ stagedReportParams, isDateRangeDirty, onChange ]
	);

	return (
		<Stack direction="column" gap="sm">
			<DateFiltersPanel
				range={ range }
				presetId={ stagedReportParams?.preset ?? reportParams.preset }
				comparisonPresetId={ attributes?.reportParams?.compare_preset }
				onChange={ stageDateRange }
				onComparisonChange={ commitComparisonRange }
				onApply={ commit }
				canApply={ isDateRangeDirty }
				onCancel={ clear }
				timeZone={ siteTimeZone() }
				withIntervalControl={ withIntervalControl }
				interval={ interval }
				intervalOptions={ intervalOptions }
				onIntervalChange={ changeInterval }
			/>
		</Stack>
	);
}

/**
 * The default control: range and comparison, no bucket control.
 */
export const ReportParamsField = createReportParamsField();
