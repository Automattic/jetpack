/**
 * External dependencies
 */
import {
	fetchStatsEmailSummaryRows,
	type StatsEmailSummaryItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	getClicksRateSignals,
	getKnownEmailRate,
	getOpensRateSignals,
} from '../helpers/format-email-rate';
import type { UndatedReportCsvExporter } from './types';

/** The summary endpoint's maximum; it resets anything above it to 10. */
export const EMAILS_REPORT_ROW_LIMIT = 30;

export const emailsCsvExporter: UndatedReportCsvExporter<
	StatsEmailSummaryItem,
	StatsEmailSummaryItem
> = {
	filenamePrefix: 'emails',
	hasDateRange: false,
	fetchItems: () => fetchStatsEmailSummaryRows( { quantity: EMAILS_REPORT_ROW_LIMIT } ),
	toCsvRows: items =>
		[ ...items ].sort( ( a, b ) => String( b.date ?? '' ).localeCompare( String( a.date ?? '' ) ) ),
	getColumns: () => [
		{
			label: __( 'Email', 'jetpack-premium-analytics-pkg' ),
			getValue: row => String( row.label ?? '' ),
		},
		{
			label: __( 'Sent', 'jetpack-premium-analytics-pkg' ),
			getValue: row => String( row.date ?? '' ),
		},
		{ label: __( 'Opens', 'jetpack-premium-analytics-pkg' ), getValue: row => row.opens },
		{
			label: __( 'Open rate', 'jetpack-premium-analytics-pkg' ),
			getValue: row => getKnownEmailRate( row.opens_rate, getOpensRateSignals( row ) ),
		},
		{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ), getValue: row => row.clicks },
		{
			label: __( 'Click rate', 'jetpack-premium-analytics-pkg' ),
			getValue: row => getKnownEmailRate( row.clicks_rate, getClicksRateSignals( row ) ),
		},
	],
};
