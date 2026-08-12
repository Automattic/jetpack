/**
 * External dependencies
 */
import {
	getDefaultPreset,
	normalizeReportParams,
	localTZDate,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	isPrimaryPreset,
	siteTimeZone,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import { Stack, type DataFormControlProps } from '@jetpack-premium-analytics/externals';
import { deriveComparisonRange, encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { endOfDay, isValid } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { getStoreInfo } from '../../helpers/store-info';

/**
 * Inferred types
 */
type ReportParams = NonNullable< Parameters< typeof normalizeReportParams >[ 0 ] >;

export type ReportParamsFieldAttributes = {
	reportParams: ReportParams;
};

/**
 * Parse a stored report-param date for the picker.
 *
 * `normalizeReportParams` passes `from`/`to` through untouched, so a malformed
 * value reaches this far. The picker renders an invalid date through
 * `formatToTimezoneNaiveString`, which throws, so drop it instead.
 *
 * @param value - The stored `from` or `to`.
 * @return The parsed date, or undefined when it is missing or malformed.
 */
function toPickerDate( value?: string ) {
	if ( ! value ) {
		return undefined;
	}

	const date = localTZDate( value );

	return isValid( date ) ? date : undefined;
}

export function ReportParamsField( {
	data: attributes,
	onChange,
}: DataFormControlProps< ReportParamsFieldAttributes > ) {
	const [ stagedReportParams, setStagedReportParams ] = useState< ReportParams >(
		attributes?.reportParams
	);

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	const reportParams = normalizeReportParams( stagedReportParams, defaultPreset );

	const range = {
		from: toPickerDate( reportParams.from ),
		to: toPickerDate( reportParams.to ),
	};

	const stageDateRange = useCallback(
		( nextRange?: DateRange, nextPresetId?: string ) => {
			const nextReportParams = { ...stagedReportParams };

			if ( nextRange?.from && nextRange?.to ) {
				nextReportParams.from = encodeDateToSearchParam( nextRange.from );
				nextReportParams.to = encodeDateToSearchParam( endOfDay( nextRange.to ) );
			}

			if ( nextPresetId && isPrimaryPreset( nextPresetId ) ) {
				nextReportParams.preset = nextPresetId;
			} else if ( nextPresetId ) {
				delete nextReportParams.preset;
			}

			/*
			 * Derive comparison range from primary range and preset,
			 * when comparison is enabled.
			 */
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
			/>
		</Stack>
	);
}
