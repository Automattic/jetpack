/**
 * External dependencies
 */
import {
	getDefaultPreset,
	normalizeReportParams,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { getStoreInfo } from '../helpers/store-info';
import type { ReportParamsFieldAttributes } from '../fields/date-report-params-field';

/**
 * Normalized report params for a widget surface: `attributes.reportParams`
 * when a host injects them (Storybook, previews), otherwise the matched
 * route's search params.
 */
export function useNormalizedReportParams(
	attributes?: Partial< ReportParamsFieldAttributes >
): ReportParams {
	let search: Record< string, unknown > = {};

	/*
	 * Read the search params of the current route. `{ strict: false }` returns
	 * whatever route is matched, so widgets pick up the date range (and the
	 * single-resource scope like `post_id`) on any page — not only the dashboard
	 * at `/`. `useSearch` throws when rendered outside a matched route (e.g.
	 * Storybook), so the empty fallback stands in there.
	 */
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
