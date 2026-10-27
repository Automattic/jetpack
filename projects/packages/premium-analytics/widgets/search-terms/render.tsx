/**
 * External dependencies
 */
import {
	WIDGET_ROW_LIMIT,
	Leaderboard,
	WidgetRoot,
	describeError,
	searchTermsCsvExporter,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import useSearchTermViews from './use-search-term-views';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type SearchTermsAttributes = Record< never, never >;

type SearchTermsRenderAttributes = Partial< ReportParamsFieldAttributes > & SearchTermsAttributes;

type SearchTermsWidgetProps = WidgetRenderProps< SearchTermsRenderAttributes >;

/**
 * Search Terms widget inner component. Reads report params from WidgetRoot context.
 */
function SearchTermsInner() {
	const { reportParams } = useWidgetRootContext();
	const { data, isLoading, isFetching, isError, isPrimaryError, error, hasComparison, refetch } =
		useSearchTermViews( {
			reportParams,
			max: WIDGET_ROW_LIMIT,
		} );

	const rows = useMemo< LeaderboardRowInput[] >(
		() =>
			data.map( ( term, index ) => ( {
				id: `${ index }-${ term.label }`,
				label: term.label,
				value: term.views,
				previousValue: term.previousViews,
			} ) ),
		[ data ]
	);
	const emptyState = useNoViewsEmptyState(
		{ isLoading, isError, isEmpty: rows.length === 0 },
		__( 'You don’t have search terms recorded yet.', 'jetpack-premium-analytics-pkg' )
	);

	useReportActions( {
		csv: {
			exporter: searchTermsCsvExporter,
			status: { isLoading, isFetching, isError: isPrimaryError },
			rowCount: rows.length,
		},
	} );

	return (
		<Leaderboard
			chartTitle={ __( 'Top searched terms', 'jetpack-premium-analytics-pkg' ) }
			rows={ rows }
			columns={ { label: __( 'Search terms', 'jetpack-premium-analytics-pkg' ), metric: 'views' } }
			status={ {
				isLoading: emptyState.isLoading,
				isFetching,
				isError,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load search terms. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ emptyState.empty }
		/>
	);
}

/**
 * Search Terms widget: the top search queries visitors used to reach the site,
 * ranked by view count. Ported from the Jetpack Stats "Search Terms" module.
 */
export default function SearchTerms( { attributes = {} }: SearchTermsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SearchTermsInner />
		</WidgetRoot>
	);
}
