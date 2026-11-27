/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { toEdgePath, type EdgeScopeParams } from '../queries/edge-window';
import { toPostId } from '../utils/to-post-id';
import { useStatsPost } from './use-stats-post';
import type { ReportParams } from '../utils/search';

type EdgeReport = {
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => Promise< unknown >;
};

/**
 * The params an edge template reads: on a post's page, the post's path from its Stats permalink.
 *
 * The edge logs have no post ID, so a post-scoped report counts the post's path instead. Until the
 * path is known the report must not run, or it would count the whole site.
 *
 * @param params - The report params, scoped to a post by `post_id`.
 * @return The params to query with, and the state of the permalink lookup.
 */
export function useEdgeScope( params: ReportParams ) {
	const postId = toPostId( params.post_id );
	const isPostScoped = postId > 0;
	// The post page header reads the same query, so this is served from its cache.
	const post = useStatsPost( { postId, fields: [ 'post' ] }, { enabled: isPostScoped } );
	const url = isPostScoped ? toEdgePath( post.data?.post?.permalink ) : undefined;
	const scopedParams = useMemo< EdgeScopeParams >(
		() => ( url ? { ...params, url } : params ),
		[ params, url ]
	);
	const hasFailed = isPostScoped && ! url && post.isError;

	return {
		params: scopedParams,
		isReady: ! isPostScoped || !! url,
		isLoading: isPostScoped && post.isLoading,
		isError: hasFailed,
		error: hasFailed ? post.error : null,
		refetch: post.refetch,
	};
}

/**
 * A report's state with its permalink lookup folded in, so a widget reads one set of flags.
 *
 * @param report - The edge report.
 * @param scope  - The lookup from `useEdgeScope`.
 * @return The report, loading or failed while the lookup is.
 */
export function withEdgeScope< TReport extends EdgeReport >(
	report: TReport,
	scope: ReturnType< typeof useEdgeScope >
): TReport {
	if ( scope.isReady ) {
		return report;
	}

	return {
		...report,
		isLoading: report.isLoading || scope.isLoading,
		isError: report.isError || scope.isError,
		error: report.error ?? scope.error,
		refetch: scope.isError ? scope.refetch : report.refetch,
	};
}
