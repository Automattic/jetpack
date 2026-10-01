/**
 * Internal dependencies
 */
import {
	mergeStatsArchivesComparisonRows,
	mergeStatsClicksComparisonRows,
	mergeStatsFileDownloadsComparisonRows,
	mergeStatsReferrersComparisonRows,
	mergeStatsTopAuthorsComparisonRows,
	mergeStatsTopPostsComparisonRows,
	mergeStatsVideoPlaysComparisonRows,
	type StatsArchivesComparisonItem,
	type StatsClicksComparisonItem,
	type StatsCommentsResponse,
	type StatsEmailSummaryItem,
	type StatsFileDownloadsComparisonItem,
	type StatsInsightsYear,
	type StatsNormalizedReport,
	type StatsReferrersComparisonItem,
	type StatsSearchTermsItem,
	type StatsTagsItem,
	type StatsTopAuthorsComparisonItem,
	type StatsTopPostsComparisonItem,
	type StatsVideoPlaysComparisonItem,
} from '../processing/stats';
import { queryClient } from '../providers/query-client-provider';
import { withoutComparison } from '../utils/without-comparison';
import { statsArchivesQuery } from './stats-archives-query';
import { statsClicksQuery } from './stats-clicks-query';
import { statsCommentsQuery } from './stats-comments-query';
import { statsEmailSummaryQuery, type StatsEmailSummaryParams } from './stats-email-summary-query';
import { statsFileDownloadsQuery } from './stats-file-downloads-query';
import { statsInsightsQuery } from './stats-insights-query';
import { statsReferrersQuery } from './stats-referrers-query';
import { statsSearchTermsQuery } from './stats-search-terms-query';
import { statsTagsQuery, type StatsTagsParams } from './stats-tags-query';
import { statsTopAuthorsQuery } from './stats-top-authors-query';
import { statsTopPostsQuery } from './stats-top-posts-query';
import { statsVideoPlaysSummaryQuery } from './stats-video-plays-summary-query';
import type { StatsReportParams } from './stats-query';

// Same primary query key and row processing as the report hooks; no comparison
// request, because exports carry no previous-period columns.

// A click can be retried, so a failed download should report at once, not after backoff.
const fetchReport: typeof queryClient.fetchQuery = options =>
	queryClient.fetchQuery( { ...options, retry: false } );

/** Fetch every top-posts row for a report window, ranked as the report ranks them. */
export async function fetchStatsTopPostsRows(
	params: StatsReportParams
): Promise< StatsTopPostsComparisonItem[] > {
	const report = await fetchReport( statsTopPostsQuery( withoutComparison( params ) ) );
	return mergeStatsTopPostsComparisonRows( report, undefined ).rows;
}

/** Fetch the archives tree for a report window, sorted as the report sorts it. */
export async function fetchStatsArchivesRows(
	params: StatsReportParams
): Promise< StatsArchivesComparisonItem[] > {
	const report = await fetchReport( statsArchivesQuery( withoutComparison( params ) ) );
	return mergeStatsArchivesComparisonRows( report, undefined ).rows;
}

/** Fetch every file-download row for a report window. */
export async function fetchStatsFileDownloadsRows(
	params: StatsReportParams
): Promise< StatsFileDownloadsComparisonItem[] > {
	const report = await fetchReport( statsFileDownloadsQuery( withoutComparison( params ) ) );
	return mergeStatsFileDownloadsComparisonRows( report, undefined ).rows;
}

/** Fetch the raw search-terms report; its Unknown row is built by the caller. */
export function fetchStatsSearchTermsReport(
	params: StatsReportParams
): Promise< StatsNormalizedReport< StatsSearchTermsItem > > {
	return fetchReport( statsSearchTermsQuery( withoutComparison( params ) ) );
}

/** Fetch the complete-stats video summary the Videos report shows. */
export async function fetchStatsVideoPlaysSummaryRows(
	params: StatsReportParams
): Promise< StatsVideoPlaysComparisonItem[] > {
	const report = await fetchReport( statsVideoPlaysSummaryQuery( withoutComparison( params ) ) );
	return mergeStatsVideoPlaysComparisonRows( report, undefined ).rows;
}

/** Fetch every click group and URL for a report window. */
export async function fetchStatsClicksRows(
	params: StatsReportParams
): Promise< StatsClicksComparisonItem[] > {
	const report = await fetchReport( statsClicksQuery( withoutComparison( params ) ) );
	return mergeStatsClicksComparisonRows( report, undefined ).rows;
}

/** Fetch the referrer tree for a report window. */
export async function fetchStatsReferrersRows(
	params: StatsReportParams
): Promise< StatsReferrersComparisonItem[] > {
	const report = await fetchReport( statsReferrersQuery( withoutComparison( params ) ) );
	return mergeStatsReferrersComparisonRows( report, undefined ).rows;
}

/** Fetch every author and their posts for a report window. */
export async function fetchStatsTopAuthorsRows(
	params: StatsReportParams
): Promise< StatsTopAuthorsComparisonItem[] > {
	const report = await fetchReport( statsTopAuthorsQuery( withoutComparison( params ) ) );
	return mergeStatsTopAuthorsComparisonRows( report, undefined ).rows;
}

/** Fetch every year the Annual insights report lists. */
export async function fetchStatsInsightsYears(): Promise< StatsInsightsYear[] > {
	const report = await fetchReport( statsInsightsQuery() );
	// The sanitizer returns a bare object for a payload it does not recognize.
	return report.years ?? [];
}

/** Fetch the whole comments report; callers pick the authors or posts group. */
export function fetchStatsComments(): Promise< StatsCommentsResponse > {
	return fetchReport( statsCommentsQuery() );
}

/** Fetch the tags and categories the Tags report lists, up to `max`. */
export async function fetchStatsTagsRows( params: StatsTagsParams ): Promise< StatsTagsItem[] > {
	const report = await fetchReport( statsTagsQuery( params ) );
	return report.data?.[ 0 ]?.items ?? [];
}

/** Fetch the latest emails the Emails report lists, up to `quantity`. */
export async function fetchStatsEmailSummaryRows(
	params: StatsEmailSummaryParams
): Promise< StatsEmailSummaryItem[] > {
	const report = await fetchReport( statsEmailSummaryQuery( params ) );
	return report.data?.[ 0 ]?.items ?? [];
}
