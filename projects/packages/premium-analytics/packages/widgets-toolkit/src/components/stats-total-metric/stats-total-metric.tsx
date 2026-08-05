/**
 * External dependencies
 */
import { Icon, Sparkline, Text } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import { describeError } from '../../helpers';
import { useWidgetRootContext } from '../widget-root';
import { WidgetState } from '../widget-state';
import styles from './stats-total-metric.module.scss';
import { useStatsTotalMetric, type StatsTotalMetricField } from './use-stats-total-metric';
import type { ComponentProps } from 'react';

// `decimals: 0` would round 291,900 to "292K"; the prototype's headline keeps
// the digit ("291.9k" / "1.2M").
const HEADLINE_OPTIONS = { useMultipliers: true, decimals: 1 };

export type StatsTotalMetricWidgetProps = {
	field: StatsTotalMetricField;
	emptyIcon: ComponentProps< typeof Icon >[ 'icon' ];
	emptyDescription: string;
	/** Retryable errors only — `describeError` supplies the 403 copy. */
	retryDescription: string;
};

/**
 * A period total over an area sparkline. Backs the `jpa/total-views` and
 * `jpa/total-visitors` cards. Must render inside a `<WidgetRoot>`.
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
					{ /* Not `MetricValue`: it pins a 20px line-height at any font size, which
					    clips 32px glyphs. `heading-2xl` pairs 32px with 40px. */ }
					<Text
						variant="heading-2xl"
						title={ formatMetricValue( total, 'number', { decimals: 0 } ) }
					>
						{ formatMetricValue( total, 'number', HEADLINE_OPTIONS ) }
					</Text>
					<div className={ styles.chart }>
						{ /* `withResponsive` caps width at 1200px by default, stranding space on a
						    wider card. */ }
						<Sparkline data={ points } withGradientFill maxWidth={ Infinity } />
					</div>
				</div>
			</WidgetState>
		</div>
	);
}
