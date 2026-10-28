import {
	Button,
	Card,
	Link,
	ButtonLink,
	Meter,
	Stack,
	Text,
	Spinner,
	VisuallyHidden,
} from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { getOverLimitMessage, usePlanUpgradeLinkProps } from './plan-usage';
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
	const usageText = formatMetricValue( usage, 'number', { decimals: 0 } );
	const limitText = formatMetricValue( limit, 'number', { decimals: 0 } );
	const label = sprintf(
		/* translators: 1: views used in the current cycle, 2: the plan's views limit. */
		__( '%1$s / %2$s views', 'jetpack-premium-analytics-pkg' ),
		usageText,
		limitText
	);
	const spokenLabel = sprintf(
		/* translators: Read by screen readers. 1: views used in the current cycle, 2: the plan's views limit. */
		__( '%1$s of %2$s views used', 'jetpack-premium-analytics-pkg' ),
		usageText,
		limitText
	);
	const formatLabel = useCallback( () => label, [ label ] );
	const formatSpokenLabel = useCallback( () => spokenLabel, [ spokenLabel ] );

	return (
		<Meter.Root
			value={ usage }
			max={ limit }
			aria-label={ __( 'Billable views', 'jetpack-premium-analytics-pkg' ) }
			getAriaValueText={ formatSpokenLabel }
		>
			<Stack direction="row" justify="space-between" align="baseline" gap="md">
				<Meter.Value className={ styles.usageCount }>{ formatLabel }</Meter.Value>
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
			<Meter.Track>
				<Meter.Indicator tone="brand" />
			</Meter.Track>
		</Meter.Root>
	);
}

/**
 * The Settings tab's "Your current plan" card.
 *
 * @return The card.
 */
export function PlanUsageCard(): JSX.Element {
	const { data, isLoading, isError, refetch, limit, overLimitMonths } = usePlanUsage();
	const overLimitMessage = getOverLimitMessage( overLimitMonths );
	const trackEvent = useTrackEvent();
	const upgradeLink = usePlanUpgradeLinkProps();
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
				{ overLimitMessage && <Text className={ styles.usageWarning }>{ overLimitMessage }</Text> }
				<Text className={ styles.usageNote }>
					{ __(
						'Billable views are the page views counted against your plan each cycle. Excluded logged-in role views are not counted.',
						'jetpack-premium-analytics-pkg'
					) }{ ' ' }
					<Link href={ TIERED_BILLING_URL } openInNewTab>
						{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
					</Link>
				</Text>
				{ upgradeLink && (
					<ButtonLink { ...upgradeLink } onClick={ trackUpgrade }>
						{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
					</ButtonLink>
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
