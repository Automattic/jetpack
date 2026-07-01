/**
 * External dependencies
 */
import {
	getDefaultPreset,
	normalizeReportParams,
	localTZDate,
	getSiteTimezone,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	isPrimaryPreset,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import { deriveComparisonRange, encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { Stack } from '@wordpress/ui';
import { endOfDay } from 'date-fns';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { getStoreInfo } from '../helpers/store-info';
import type { DataFormControlProps } from '@wordpress/dataviews';

/*
 * Copied from widgets-toolkit `fields/date-report-params-field` so widget
 * metadata modules can consume it through this package's script module
 * (the toolkit is bundled-from-source and its scss graph cannot enter the
 * widget metadata build). The toolkit copy remains for render-side use
 * until fields fully owns the editors; keep the two in sync or delete the
 * toolkit copy when the toolkit dissolves.
 */

/**
 * Inferred types
 */
type ReportParams = NonNullable< Parameters< typeof normalizeReportParams >[ 0 ] >;

export type ReportParamsFieldAttributes = {
	reportParams: ReportParams;
};

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
		from: localTZDate( reportParams.from ),
		to: localTZDate( reportParams.to ),
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

	// Basic check if the date range has been changed.
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
	 * Get the dashboard layout surface for responsive calculations.
	 * This is a temporary workaround until @automattic/dashboard exposes
	 * a Context provider. See WOOA7S-1008 for the upstream solution.
	 */
	const [ containerElement, setContainerElement ] = useState< HTMLElement | null >( null );

	useEffect( () => {
		const node = document.querySelector< HTMLElement >( '.next-admin-layout__surface' );
		setContainerElement( node );
	}, [] );

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
				timeZone={ getSiteTimezone() }
				containerElement={ containerElement }
			/>
		</Stack>
	);
}
