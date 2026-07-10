/**
 * External dependencies
 */
import { megaphone } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useWordAdsChart, { type WordAdsPeriod } from './use-wordads-chart';
import type { WordAdsChartTabsAttributes, WordAdsChartTabsGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type WordAdsChartTabsRenderAttributes = WordAdsChartTabsAttributes &
	Partial< ReportParamsFieldAttributes >;
type WordAdsChartTabsWidgetProps = WidgetRenderProps< WordAdsChartTabsRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Default granularity for the dashboard interval: opens the control at the
 * granularity the range implies (and, until the user picks one explicitly,
 * keeps following the range). The dropdown offers day/week/month/year, so a
 * dashboard quarter interval collapses onto month.
 *
 * @param interval - The dashboard-derived interval.
 * @return The matching selectable granularity.
 */
function defaultPeriodForInterval( interval?: string ): WordAdsPeriod {
	switch ( interval ) {
		case 'week':
			return 'week';
		case 'month':
		case 'quarter':
			return 'month';
		case 'year':
			return 'year';
		default:
			return 'day';
	}
}

type WordAdsChartTabsInnerProps = {
	/**
	 * Selected granularity; `auto` follows the dashboard range.
	 */
	granularity: WordAdsChartTabsGranularity;
};

/**
 * WordAds chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()` and hands the per-metric tabs (Ads
 * Served, Average CPM, Revenue) to the shared `MetricTabsChart`, with the
 * loading/error/empty states rendered through `WidgetState`. The "Group by"
 * control is the `granularity` attribute (`relevance: 'high'`), rendered by
 * the widget host; it only chooses the bucket size within the dashboard range.
 *
 * @param {WordAdsChartTabsInnerProps} props - The component props.
 * @return The widget body.
 */
function WordAdsChartTabsInner( { granularity }: WordAdsChartTabsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// `auto` means "follow the dashboard range"; an explicit value sticks
	// across range changes, so a wide range doesn't stay stuck on `day`
	// granularity (and blow up the bucket count) while the user hasn't picked
	// a granularity themselves.
	const period: WordAdsPeriod =
		granularity === 'auto' ? defaultPeriodForInterval( reportParams.interval ) : granularity;

	const { metrics, isLoading, isFetching, isError, isEmpty, refetch } = useWordAdsChart(
		reportParams,
		period
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ isEmpty }
				error={ {
					description: __(
						"We couldn't load WordAds data. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: megaphone,
					description: __( 'No WordAds data in this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ DATA_FORMAT }
					groupLabel={ __( 'WordAds metric', 'jetpack-premium-analytics' ) }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * `WidgetRoot` provides the analytics query client and resolves the dashboard's
 * `reportParams`; the inner component reads that range/comparison state. The
 * granularity is the `granularity` attribute (`relevance: 'high'`), exposed as
 * a control by the widget host.
 *
 * @param {WordAdsChartTabsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function WordAdsChartTabs( { attributes = {} }: WordAdsChartTabsWidgetProps ) {
	const granularity = attributes.granularity ?? 'auto';

	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<WordAdsChartTabsInner granularity={ granularity } />
		</WidgetRoot>
	);
}
