/**
 * External dependencies
 */
import {
	calculateDelta,
	LeaderboardChart,
	WidgetRoot,
	WidgetState,
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

	const { data, isLoading, isFetching, isError, hasComparison, refetch } = useSearchTermViews( {
		reportParams,
		max,
	} );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...data.map( t => t.views ), 0 );
		const prevMaxValue = Math.max( ...data.map( t => t.previousViews ), 0 );

		return data.map( ( term, index ) => ( {
			id: `${ index }-${ term.label }`,
			label: (
				<Stack align="center" className={ styles.itemLabel }>
					<Text className={ styles.itemLabelText }>{ term.label }</Text>
				</Stack>
			),
			currentValue: term.views,
			previousValue: term.previousViews,
			currentShare: maxValue > 0 ? ( term.views / maxValue ) * 100 : 0,
			previousShare: prevMaxValue > 0 ? ( term.previousViews / prevMaxValue ) * 100 : 0,
			delta: hasComparison ? calculateDelta( term.views, term.previousViews ) : 0,
		} ) );
	}, [ data, hasComparison ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ {
						description: __(
							"We couldn't load search terms. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: search,
						description: __( 'No search terms in this period.', 'jetpack-premium-analytics' ),
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
