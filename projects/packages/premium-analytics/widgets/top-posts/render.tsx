/**
 * External dependencies
 */
import {
	useStatsTopPosts,
	type StatsNormalizedReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import {
	useWidgetError,
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
	type WidgetErrorConfig,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { TopPostsWidget } from './top-posts-widget';
import type { TopPostRow } from './types';

type TopPostsRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: ( error: WidgetErrorConfig | true | null ) => void;
};

type TopPostsReport = StatsNormalizedReport< StatsTopPostsItem >;

function getTopPostsItems( report?: TopPostsReport ): StatsTopPostsItem[] {
	return report?.data?.[ 0 ]?.items ?? [];
}

function getTopPostKey( item: StatsTopPostsItem ): string {
	return String( item.id ?? item.link ?? item.label ?? '' );
}

function mapTopPostsRows(
	primaryReport?: TopPostsReport,
	comparisonReport?: TopPostsReport
): TopPostRow[] {
	const comparisonViews = new Map(
		getTopPostsItems( comparisonReport ).map( item => [ getTopPostKey( item ), item.views ] )
	);

	return getTopPostsItems( primaryReport )
		.filter( item => typeof item.link === 'string' && item.link.length > 0 )
		.map( item => {
			const key = getTopPostKey( item );

			return {
				label: typeof item.label === 'string' ? item.label : '',
				value: item.views,
				previousValue: comparisonViews.get( key ),
				href: item.link as string,
				type: typeof item.type === 'string' ? item.type : 'post',
			};
		} );
}

function TopPostsDashboardWidget() {
	const { reportParams } = useWidgetRootContext();
	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useStatsTopPosts( reportParams );

	const rows = useMemo(
		() =>
			mapTopPostsRows(
				primary.data as TopPostsReport | undefined,
				comparison.data as TopPostsReport | undefined
			),
		[ primary.data, comparison.data ]
	);
	const hasError = useWidgetError( isError, error, refetch );

	if ( hasError ) {
		return null;
	}

	return (
		<TopPostsWidget
			rows={ rows }
			isLoading={ ( isLoading && ! hasData ) || ( isFetching && hasData ) }
			withComparison={ hasComparison }
		/>
	);
}

/**
 * Renders the Top Posts & Pages dashboard widget.
 *
 * @param props           - Component props.
 * @param props.attributes - Widget attributes.
 * @param props.setError   - Dashboard error setter.
 * @return The rendered widget.
 */
export default function TopPostsRender( { attributes, setError }: TopPostsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TopPostsDashboardWidget />
		</WidgetRoot>
	);
}
