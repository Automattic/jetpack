/**
 * External dependencies
 */
import {
	fetchStatsFileDownloadsRows,
	type StatsFileDownloadsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getSummarizedReportQueryParams } from './query-params';
import type { ReportCsvExporter } from './types';

type FileDownloadRow = StatsFileDownloadsComparisonItem;

export const fileDownloadsCsvExporter: ReportCsvExporter< FileDownloadRow, FileDownloadRow > = {
	filenamePrefix: 'file-downloads',
	hasDateRange: true,
	fetchItems: reportParams =>
		fetchStatsFileDownloadsRows( getSummarizedReportQueryParams( reportParams ) ),
	toCsvRows: items => [ ...items ].sort( ( a, b ) => b.downloads - a.downloads ),
	getColumns: () => [
		{
			label: __( 'File', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.shortLabel ?? String( row.label ?? '' ),
		},
		{ label: __( 'Downloads', 'jetpack-premium-analytics-pkg' ), getValue: row => row.downloads },
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	],
};
