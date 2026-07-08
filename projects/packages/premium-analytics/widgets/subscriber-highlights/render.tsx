/**
 * External dependencies
 */
import { useStatsSubscribersCounts } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { envelope, payment, people, share } from '@wordpress/icons';
import { Icon, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { SubscriberHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The subscribers/counts endpoint reports current totals and is not
// period-scoped, so the widget ignores the dashboard date range. Report params
// are still accepted at the WidgetRoot boundary (and Storybook may inject them)
// so the host contract holds.
type SubscriberHighlightsRenderAttributes = SubscriberHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type SubscriberHighlightsWidgetProps = WidgetRenderProps< SubscriberHighlightsRenderAttributes >;

/**
 * The enabled-metric flags from widget attributes, with defaults applied.
 */
type SubscriberHighlightsReportProps = Required< SubscriberHighlightsAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Fetches the subscriber counts through the designated `useStatsSubscribersCounts`
 * Stats hook and renders the totals as a grid of metric tiles. The counts module
 * has no comparison period, so each tile shows a bare formatted count. Which
 * tiles appear is controlled by the per-metric visibility attributes.
 *
 * @param {SubscriberHighlightsReportProps} props - The component props.
 * @return The widget content.
 */
function SubscriberHighlightsReport( {
	showTotal,
	showPaid,
	showFree,
	showSocial,
}: SubscriberHighlightsReportProps ) {
	const { data, isLoading, isError } = useStatsSubscribersCounts();

	if ( isError ) {
		return (
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>
					{ __( 'Unable to load subscriber highlights.', 'jetpack-premium-analytics' ) }
				</Text>
			</div>
		);
	}

	if ( isLoading && ! data ) {
		return (
			<div className={ styles.root }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	const tiles = [
		{
			key: 'total',
			icon: people,
			label: __( 'Total subscribers', 'jetpack-premium-analytics' ),
			value: data?.total_subscribers ?? 0,
			enabled: showTotal,
		},
		{
			key: 'paid',
			icon: payment,
			label: __( 'Paid subscribers', 'jetpack-premium-analytics' ),
			value: data?.paid_subscribers ?? 0,
			enabled: showPaid,
		},
		{
			key: 'free',
			icon: envelope,
			label: __( 'Free subscribers', 'jetpack-premium-analytics' ),
			value: data?.email_subscribers ?? 0,
			enabled: showFree,
		},
		{
			key: 'social',
			icon: share,
			label: __( 'Social followers', 'jetpack-premium-analytics' ),
			value: data?.social_followers ?? 0,
			enabled: showSocial,
		},
	].filter( tile => tile.enabled );

	return (
		<div className={ styles.root }>
			{ tiles.length === 0 ? (
				<Text className={ styles.placeholder }>
					{ __( 'Select at least one metric to display.', 'jetpack-premium-analytics' ) }
				</Text>
			) : (
				<div className={ styles.grid }>
					{ tiles.map( tile => (
						<div key={ tile.key } className={ styles.tile }>
							<div className={ styles.tileHeader }>
								<Icon icon={ tile.icon } size={ 24 } className={ styles.tileIcon } />
								<Text className={ styles.tileLabel }>{ tile.label }</Text>
							</div>
							<MetricWithComparison
								value={ tile.value }
								dataFormat={ COUNT_FORMAT }
								fontSize="xl"
								className={ styles.tileValue }
							/>
						</div>
					) ) }
				</div>
			) }
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded so any injected report params are
 * preserved even though the counts endpoint is not period-scoped.
 *
 * @param {SubscriberHighlightsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SubscriberHighlights( {
	attributes = {},
}: SubscriberHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SubscriberHighlightsReport
				showTotal={ attributes.showTotal ?? true }
				showPaid={ attributes.showPaid ?? true }
				showFree={ attributes.showFree ?? true }
				showSocial={ attributes.showSocial ?? true }
			/>
		</WidgetRoot>
	);
}
