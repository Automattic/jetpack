/**
 * External dependencies
 */
import { Icon, Sparkline } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import { describeError } from '../../helpers';
import { MetricValue } from '../metric-value';
import { useWidgetRootContext } from '../widget-root';
import { WidgetState } from '../widget-state';
import styles from './stats-total-metric.module.scss';
import { useStatsTotalMetric, type StatsTotalMetricField } from './use-stats-total-metric';
import type { DataFormat } from '../../types';
import type { ComponentProps } from 'react';

// One decimal, unlike `site-overview`'s tile format. `useMultipliers` rounds to
// `decimals`, so `decimals: 0` renders 291,900 as "292K" and 1,200,000 as "1M".
// The prototype's headline is "291.9k" / "1.2M" / "441.6k", so this card needs
// the extra digit; the small tiles do not.
const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 1 },
};

export type StatsTotalMetricWidgetProps = {
	/**
	 * The traffic field to display.
	 */
	field: StatsTotalMetricField;
	/**
	 * Glyph for the empty state.
	 */
	emptyIcon: ComponentProps< typeof Icon >[ 'icon' ];
	/**
	 * Copy for the empty state.
	 */
	emptyDescription: string;
	/**
	 * Copy for the retryable error state. This component is generic over
	 * `field`, so the copy comes from the caller; a permission-gated 403 gets
	 * neutral copy from `describeError` instead.
	 */
	retryDescription: string;
};

/**
 * One traffic metric as a large period total over an area sparkline. Backs the
 * `jpa/total-views` and `jpa/total-visitors` cards, which differ only in `field`
 * and copy. Must render inside a `<WidgetRoot>`.
 *
 * @param {StatsTotalMetricWidgetProps} props - The component props.
 * @return The widget body.
 */
export function StatsTotalMetricWidget( {
	field,
	emptyIcon,
	emptyDescription,
	retryDescription,
}: StatsTotalMetricWidgetProps ) {
	const { reportParams } = useWidgetRootContext();
	const { total, points, isLoading, isFetching, isError, error, refetch } = useStatsTotalMetric(
		reportParams,
		field
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ points.length === 0 }
				error={ describeError( error, { retryDescription, onRetry: refetch } ) }
				empty={ { icon: emptyIcon, description: emptyDescription } }
			>
				<div className={ styles.body }>
					<MetricValue
						value={ total }
						dataFormat={ COUNT_FORMAT }
						fontSize="2xl"
						title={ formatMetricValue( total, 'number', { decimals: 0 } ) }
					/>
					<div className={ styles.chart }>
						{ /*
						 * `withResponsive` caps the drawn width at its `maxWidth` default of
						 * 1200px, which leaves dead space on a wider card. A sparkline is
						 * card-width chrome, not a standalone chart, so it has no reason to
						 * stop growing.
						 */ }
						<Sparkline data={ points } withGradientFill maxWidth={ Infinity } />
					</div>
				</div>
			</WidgetState>
		</div>
	);
}
