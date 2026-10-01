/**
 * External dependencies
 */
import {
	WIDGET_ROW_LIMIT,
	Leaderboard,
	ReportLink,
	WidgetRoot,
	describeError,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useSearchTermViews from './use-search-term-views';
import { type SearchTermsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type SearchTermsRenderAttributes = Partial< ReportParamsFieldAttributes > & SearchTermsAttributes;

type SearchTermsWidgetProps = WidgetRenderProps< SearchTermsRenderAttributes >;

/**
 * Search Terms widget inner component. Reads report params from WidgetRoot context.
 */
function SearchTermsInner() {
	const { reportParams } = useWidgetRootContext();
	const { data, isLoading, isFetching, isError, error, hasComparison, refetch } =
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

	return (
		<Leaderboard
			rows={ rows }
			status={ { isLoading, isFetching, isError, hasComparison, refetch } }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load search terms. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			footer={ <ReportLink report="search-terms" /> }
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
