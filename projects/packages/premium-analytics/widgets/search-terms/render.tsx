/**
 * External dependencies
 */
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useSearchTermViews from './use-search-term-views';
import type { SearchTermsAttributes } from './widget';

type SearchTermsRenderAttributes = Partial< ReportParamsFieldAttributes > & SearchTermsAttributes;

/**
 * Search Terms widget inner component. Reads report params from WidgetRoot context.
 *
 * @param root0     - Render props.
 * @param root0.max - Maximum number of rows to display.
 * @return The rendered widget content.
 */
function SearchTermsInner( { max = 10 }: { max?: number } ) {
	const { reportParams } = useWidgetRootContext();

	const { data, isLoading, isError } = useSearchTermViews( { reportParams, max } );

	const leaderboardData = useMemo( () => {
		const maxValue = Math.max( ...data.map( t => t.views ), 0 );

		return data.map( term => ( {
			id: term.label,
			label: (
				<Stack align="center" className={ styles.itemLabel }>
					<Text>{ term.label }</Text>
				</Stack>
			),
			currentValue: term.views,
			previousValue: 0,
			currentShare: maxValue > 0 ? ( term.views / maxValue ) * 100 : 0,
			previousShare: 0,
			delta: 0,
		} ) ) as LeaderboardChartData;
	}, [ data ] );

	if ( isError ) {
		return (
			<Stack
				align="center"
				justify="center"
				className={ `${ styles.root } ${ styles.placeholder }` }
			>
				<Text>{ __( 'Could not load search terms data.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<Stack className={ styles.root }>
			<Stack direction="row" align="center" className={ styles.widgetHeader }>
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'Top Search Terms', 'jetpack-premium-analytics' ) }
				</Text>
			</Stack>
			<div className={ styles.content }>
				<LeaderboardChart
					data={ leaderboardData }
					loading={ isLoading }
					withOverlayLabel
					showLegend={ false }
					emptyStateText={ __( 'No search terms in this period.', 'jetpack-premium-analytics' ) }
					dataFormat={ {
						type: 'number',
						options: { useMultipliers: true, decimals: 0 },
					} }
				/>
			</div>
		</Stack>
	);
}

/**
 * Search Terms widget: the top search queries visitors used to reach the site,
 * ranked by view count. Ported from the Jetpack Stats "Search Terms" module.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (max, reportParams).
 * @return The rendered Search Terms widget.
 */
export default function SearchTerms( {
	attributes = {},
}: {
	attributes?: SearchTermsRenderAttributes;
} ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SearchTermsInner max={ attributes.max } />
		</WidgetRoot>
	);
}
