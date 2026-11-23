/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type StatsArchivesComparisonItem,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	ExporterCsvAction,
	archivesCsvExporter,
	getPostsReportQueryParams,
	postsPagesCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useReportParams } from '../../use-report-params';
import type { JSX, ReactNode } from 'react';

const ARCHIVES_SECTION = 'archives';

const NO_POSTS: StatsTopPostsComparisonItem[] = [];
const NO_ARCHIVES: StatsArchivesComparisonItem[] = [];

/**
 * The Download CSV action of the All pages report: the rows of the open section, read from
 * the request its table already made.
 *
 * @return The action, once the section's rows have loaded.
 */
function PostsCsvAction(): JSX.Element {
	const reportParams = useReportParams();
	const { section } = useSearch( { strict: false } ) as { section?: string };
	const isArchives = section === ARCHIVES_SECTION;

	const recordsParams = useMemo(
		() => getPostsReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const posts = useStatsTopPosts( recordsParams, { enabled: ! isArchives } );
	const archives = useStatsArchives( recordsParams, { enabled: isArchives } );

	return isArchives ? (
		<ExporterCsvAction
			exporter={ archivesCsvExporter }
			items={ archives.comparisonRows?.rows ?? NO_ARCHIVES }
			status={ archives }
			reportParams={ reportParams }
		/>
	) : (
		<ExporterCsvAction
			exporter={ postsPagesCsvExporter }
			items={ posts.comparisonRows?.rows ?? NO_POSTS }
			status={ posts }
			reportParams={ reportParams }
		/>
	);
}

/**
 * The actions beside the Stats options on the All pages report.
 *
 * @return The Download CSV action.
 */
export function postsHeaderActions(): ReactNode {
	return <PostsCsvAction />;
}
