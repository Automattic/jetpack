/**
 * External dependencies
 */
import {
	calculateDelta,
	describeError,
	getCombinedPeriodMax,
	LeaderboardChart,
	ReportLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	sharePercentage,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { search } from '@jetpack-premium-analytics/icons';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useSearchTermViews from './use-search-term-views';
import { type SearchTermsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type SearchTermsRenderAttributes = Partial< ReportParamsFieldAttributes > & SearchTermsAttributes;
type SearchTermsWidgetProps = WidgetRenderProps< SearchTermsRenderAttributes >;

/**
 * Search Terms widget inner component. Reads report params from WidgetRoot context.
 *
 * @param {SearchTermsAttributes} attributes - The widget attributes.
 * @return The rendered widget content.
 */
function SearchTermsInner( { max = 10 }: SearchTermsAttributes ) {
	const { reportParams } = useWidgetRootContext();

	const { data, isLoading, isFetching, isError, error, hasComparison, refetch } =
		useSearchTermViews( {
			reportParams,
			max,
		} );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = getCombinedPeriodMax(
			data.map( term => term.views ),
			hasComparison ? data.map( term => term.previousViews ) : []
		);

		return data.map( ( term, index ) => {
			const previousViews = term.previousViews;

			return {
				id: `${ index }-${ term.label }`,
				label: (
					<Stack align="center" className={ styles.itemLabel }>
						<Text className={ styles.itemLabelText }>{ term.label }</Text>
					</Stack>
				),
				currentValue: term.views,
				previousValue: previousViews,
				currentShare: sharePercentage( term.views, maxValue ),
				previousShare:
					hasComparison && previousViews !== undefined
						? sharePercentage( previousViews, maxValue )
						: undefined,
				delta:
					hasComparison && previousViews !== undefined
						? calculateDelta( term.views, previousViews )
						: undefined,
			};
		} );
	}, [ data, hasComparison ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load search terms. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={ {
						icon: search,
						description: __( 'No search terms in this period.', 'jetpack-premium-analytics-pkg' ),
					} }
				>
					<LeaderboardChart
						data={ leaderboardData }
						withComparison={ hasComparison }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ {
							type: 'number',
							options: { useMultipliers: true, decimals: 0 },
						} }
					/>
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="search-terms" />
			</WidgetFooter>
		</Stack>
	);
}

/**
 * Search Terms widget: the top search queries visitors used to reach the site,
 * ranked by view count. Ported from the Jetpack Stats "Search Terms" module.
 *
 * @param {SearchTermsWidgetProps} props - The widget render props.
 * @return The rendered Search Terms widget.
 */
export default function SearchTerms( { attributes = {} }: SearchTermsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SearchTermsInner max={ attributes.max } />
		</WidgetRoot>
	);
}
