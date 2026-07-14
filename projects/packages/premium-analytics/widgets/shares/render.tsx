/**
 * External dependencies
 */
import {
	LeaderboardChart,
	WidgetRoot,
	WidgetState,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { megaphone } from '@jetpack-premium-analytics/icons';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useShareViews from './use-share-views';
import { type SharesAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type SharesRenderAttributes = Partial< ReportParamsFieldAttributes > & SharesAttributes;
type SharesWidgetProps = WidgetRenderProps< SharesRenderAttributes >;

/**
 * Shares widget inner component. The share counts come from the all-time site
 * summary, so there is no date range or comparison period to read from context.
 *
 * @param {SharesAttributes} attributes - The widget attributes.
 * @return The rendered widget content.
 */
function SharesInner( { max = 10 }: SharesAttributes ) {
	const { data, isLoading, isFetching, isError, refetch } = useShareViews( { max } );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...data.map( s => s.value ), 0 );

		return data.map( ( service, index ) => ( {
			id: `${ index }-${ service.service }`,
			label: (
				<Stack align="center" className={ styles.itemLabel }>
					<Text className={ styles.itemLabelText }>{ service.label }</Text>
				</Stack>
			),
			currentValue: service.value,
			currentShare: maxValue > 0 ? ( service.value / maxValue ) * 100 : 0,
		} ) );
	}, [ data ] );

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
							"We couldn't load shares. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: megaphone,
						description: __(
							'Learn where your content has been shared the most.',
							'jetpack-premium-analytics'
						),
					} }
				>
					<LeaderboardChart
						data={ leaderboardData }
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
 * Shares widget: the number of times the site's content was shared to each social
 * network, ranked by share count. Ported from the Jetpack Stats "Shares" module.
 *
 * @param {SharesWidgetProps} props - The widget render props.
 * @return The rendered Shares widget.
 */
export default function Shares( { attributes = {} }: SharesWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SharesInner max={ attributes.max } />
		</WidgetRoot>
	);
}
