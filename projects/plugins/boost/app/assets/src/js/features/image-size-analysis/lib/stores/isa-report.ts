import api from '$lib/api/api';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { type isaGroupKeys } from '../isa-groups';
import { IsaReport, IsaCounts } from './types';

export const useIsaReport = () =>
	useDataSync( 'jetpack_boost_ds', 'image_size_analysis_summary', IsaReport.nullable().optional(), {
		query: {
			initialData: () => undefined,
			/**
			 * Automatically poll if the state is an active one.
			 * @param query
			 */
			refetchInterval: query => {
				const status = query.state.data?.status || '';
				return [ 'new', 'queued' ].includes( status ) ? 3000 : false;
			},
		},
	} );

export function getReportProgress( groups: Record< string, IsaCounts > ) {
	return Object.entries( groups ).map( ( [ group, data ] ) => {
		const progress = data.total_pages
			? Math.round( ( data.scanned_pages / data.total_pages ) * 100 )
			: 100;

		return {
			group: group as isaGroupKeys,
			progress,
			done: progress === 100,
			has_issues: data.issue_count > 0,
			...data,
		};
	} );
}

/**
 * Function tracking the total number of issues.
 * @param report
 */
export function getGroupedReports( report: IsaReport ) {
	const groups = Object.values( report?.groups || {} );
	const totalIssueCount = groups.map( group => group.issue_count ).reduce( ( a, b ) => a + b, 0 );
	const page_count = groups.map( group => group.total_pages ).reduce( ( a, b ) => a + b, 0 );
	const scanned_pages = groups.map( group => group.scanned_pages ).reduce( ( a, b ) => a + b, 0 );

	const dataGroupTabs = {
		all: {
			issue_count: totalIssueCount,
			scanned_pages,
			total_pages: page_count,
		},
		...report?.groups,
	};

	return dataGroupTabs;
}

/**
 * Request a new image size analysis.
 */
export async function requestImageAnalysis() {
	await api.post( '/image-size-analysis/start' );
	// await isaReportDS.refresh();// start polling?
}
