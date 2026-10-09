import {
	Button,
	Card,
	Link,
	LinkButton,
	Stack,
	Text,
	Spinner,
	VisuallyHidden,
} from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { ProgressBar } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { getOverLimitMessage, getPlanUpgradeUrl } from './plan-usage';
import styles from './stats-settings.module.scss';
import { usePlanUsage } from './use-plan-usage';
import type { JSX } from 'react';

const TIERED_BILLING_URL =
	'https://jetpack.com/support/jetpack-stats/free-or-paid/paid-stats-tier-billing/';

/**
 * The usage meter: views used against the plan's limit, and when the cycle restarts.
 *
 * @param props             - Component props.
 * @param props.limit       - The plan's billable views limit for the cycle.
 * @param props.usage       - The billable views counted so far this cycle.
 * @param props.daysToReset - Days until the cycle restarts.
 * @return The meter.
 */
function UsageMeter( {
	limit,
	usage = 0,
	daysToReset,
}: {
	limit: number;
	usage?: number;
	daysToReset?: number;
} ): JSX.Element {
	const label = sprintf(
		/* translators: 1: views used in the current cycle, 2: the plan's views limit. */
		__( '%1$s / %2$s views', 'jetpack-premium-analytics-pkg' ),
		formatMetricValue( usage, 'number', { decimals: 0 } ),
		formatMetricValue( limit, 'number', { decimals: 0 } )
	);

	return (
		<Stack direction="column" gap="sm">
			<Stack direction="row" justify="space-between" align="baseline" gap="md">
				<Text className={ styles.usageCount }>{ label }</Text>
				{ daysToReset !== undefined && (
					<Text className={ styles.usageReset }>
						{ sprintf(
							/* translators: %d: number of days until the billing cycle resets. */
							_n(
								'Restarts in %d day',
								'Restarts in %d days',
								daysToReset,
								'jetpack-premium-analytics-pkg'
							),
							daysToReset
						) }
					</Text>
				) }
			</Stack>
			{ /* Until the @wordpress/ui update (Automattic/jetpack#53004) ships `Meter`, which fits usage against a limit; switch to it then. */ }
			<ProgressBar
				className={ styles.usageBar }
				value={ Math.min( 100, ( usage / limit ) * 100 ) }
				aria-label={ label }
			/>
		</Stack>
	);
}

/**
 * The Settings tab's "Your current plan" card.
 *
 * @return The card.
 */
export function PlanUsageCard(): JSX.Element {
	const { data, isLoading, isError, refetch, limit, overLimitMonths } = usePlanUsage();
	const trackEvent = useTrackEvent();
	const upgradeUrl = getPlanUpgradeUrl();
	const retry = useCallback( () => refetch(), [ refetch ] );
	const trackUpgrade = useCallback(
		() => trackEvent( 'jetpack_premium_analytics_plan_upgrade_click' ),
		[ trackEvent ]
	);

	let content: JSX.Element;
	if ( isLoading ) {
		content = (
			<>
				<Spinner />
				<VisuallyHidden role="status">
					{ __( 'Loading your plan usage…', 'jetpack-premium-analytics-pkg' ) }
				</VisuallyHidden>
			</>
		);
	} else if ( ! data && isError ) {
		content = (
			<Stack direction="column" align="start" gap="md">
				<Text>
					{ __(
						"We couldn't load plan usage. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				</Text>
				<Button variant="outline" onClick={ retry }>
					{ __( 'Retry', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			</Stack>
		);
	} else if ( limit === null ) {
		content = (
			<Text>
				{ __(
					"Plan usage isn't available for your current plan.",
					'jetpack-premium-analytics-pkg'
				) }
			</Text>
		);
	} else {
		content = (
			<Stack direction="column" align="start" gap="lg">
				<div className={ styles.usageMeter }>
					<UsageMeter
						limit={ limit }
						usage={ data?.current_usage?.views_count }
						daysToReset={ data?.current_usage?.days_to_reset }
					/>
				</div>
				{ overLimitMonths ? (
					<Text className={ styles.usageWarning }>{ getOverLimitMessage( overLimitMonths ) }</Text>
				) : null }
				<Text className={ styles.usageNote }>
					{ __(
						'Billable views are the page views counted against your plan each cycle. Excluded logged-in role views are not counted.',
						'jetpack-premium-analytics-pkg'
					) }{ ' ' }
					<Link href={ TIERED_BILLING_URL } openInNewTab>
						{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
					</Link>
				</Text>
				{ upgradeUrl && (
					<LinkButton href={ upgradeUrl } onClick={ trackUpgrade }>
						{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
					</LinkButton>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Your current plan', 'jetpack-premium-analytics-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
