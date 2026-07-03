/**
 * External dependencies
 */
import {
	calculateDelta,
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useSearchTermViews from './use-search-term-views';
import widgetDefinition, { type SearchTermsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type SearchTermsRenderAttributes = Partial< ReportParamsFieldAttributes > & SearchTermsAttributes;
type SearchTermsWidgetProps = WidgetRenderProps< SearchTermsRenderAttributes > & {
	showTitle?: boolean;
};

function SearchTermsHeaderTitle() {
	return (
		<span className={ styles.headerTitle }>
			<Icon icon={ widgetDefinition.icon } size={ 20 } className={ styles.headerIcon } />
			<span>{ __( 'Top Search Terms', 'jetpack-premium-analytics' ) }</span>
		</span>
	);
}

/**
 * Search Terms widget inner component. Reads report params from WidgetRoot context.
 *
 * @param props           - Render props.
 * @param props.max       - Maximum number of rows to display.
 * @param props.showTitle - Whether to render the widget title inside the render module.
 * @return The rendered widget content.
 */
function SearchTermsInner( { max = 10, showTitle }: { max?: number; showTitle: boolean } ) {
	const { reportParams } = useWidgetRootContext();

	const { data, isLoading, isError, hasComparison } = useSearchTermViews( { reportParams, max } );

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

	const header = showTitle ? (
		<Stack direction="row" align="center" className={ styles.widgetHeader }>
			<Text variant="heading-md" render={ <h3 /> }>
				<SearchTermsHeaderTitle />
			</Text>
		</Stack>
	) : null;

	if ( isError ) {
		return (
			<Stack className={ styles.root }>
				{ header }
				<div className={ styles.content }>
					<Stack align="center" justify="center" className={ styles.placeholder }>
						<Text>{ __( 'Could not load search terms data.', 'jetpack-premium-analytics' ) }</Text>
					</Stack>
				</div>
			</Stack>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return (
			<Stack className={ styles.root }>
				{ header }
				<div className={ styles.content }>
					<WidgetLoadingOverlay />
				</div>
			</Stack>
		);
	}

	return (
		<Stack className={ styles.root }>
			{ header }
			<div className={ styles.content }>
				<LeaderboardChart
					data={ leaderboardData }
					loading={ isLoading }
					withComparison={ hasComparison }
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
 * @param props            - Render props.
 * @param props.attributes - Widget attributes (max, reportParams).
 * @param props.showTitle  - Whether to render the widget title inside the render module.
 * @return The rendered Search Terms widget.
 */
export default function SearchTerms( {
	attributes = {},
	showTitle = true,
}: SearchTermsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SearchTermsInner max={ attributes.max } showTitle={ showTitle } />
		</WidgetRoot>
	);
}
