/**
 * External dependencies
 */
import {
	getDefaultPreset,
	getStoreInfo,
	normalizeReportParams,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { ReportParamsFieldAttributes } from '../fields';

/**
 * Normalized report params for a widget surface: `attributes.reportParams`
 * when a host injects them (Storybook, previews), otherwise the matched
 * route's search params.
 */
export function useNormalizedReportParams(
	attributes?: Partial< ReportParamsFieldAttributes >
): ReportParams {
	let search: Record< string, unknown > = {};

	// `{ strict: false }` lets widgets read params on any matched route, not
	// only `/`; `useSearch` throws outside one (e.g. Storybook), hence the catch.
	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks -- useSearch may throw outside a matched route
		search = useSearch( { strict: false } );
	} catch {
		// Do nothing
	}

	const hasReportParams =
		!! attributes?.reportParams && Object.keys( attributes.reportParams ).length > 0;
	const rawReportParams = hasReportParams ? attributes.reportParams : search;

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	return useMemo(
		() => normalizeReportParams( rawReportParams, defaultPreset ),
		[ rawReportParams, defaultPreset ]
	);
}
