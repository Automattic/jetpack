import { getScriptData } from '@automattic/jetpack-script-data';
import {
	AnalyticsQueryClientProvider,
	useStatsAppPlanUsage,
} from '@jetpack-premium-analytics/data';
import {
	Card,
	Link,
	Spinner,
	Stack,
	Text,
	VisuallyHidden,
} from '@jetpack-premium-analytics/externals';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ConsentCard } from '../consent-card';
import { PlanUsageCard } from '../plan-usage-card';
import { SettingsForm } from '../settings-form';
import styles from './stats-settings.module.scss';
import type { JSX } from 'react';

// Long enough for a usual plan usage answer, short enough that a slow one leaves the settings usable.
const PLAN_USAGE_HOLD_MS = 2000;

/**
 * The Settings page: the plan usage, the Stats settings, and where to switch Stats off.
 *
 * @return The Settings page content.
 */
export function StatsSettingsPanel(): JSX.Element {
	return (
		// Outside any widget, so outside the provider `WidgetRoot` mounts for widgets.
		<AnalyticsQueryClientProvider>
			<StatsSettingsContent />
		</AnalyticsQueryClientProvider>
	);
}

/**
 * The Settings page's cards, once it is known whether the plan usage card is among them.
 *
 * @return The Settings page content.
 */
function StatsSettingsContent(): JSX.Element {
	const { isLoading: isLoadingPlanUsage, failureCount } = useStatsAppPlanUsage();
	// Latched: the card refetches a failed usage on mount, which must not swap the page back and unmount it.
	const [ isHolding, setHolding ] = useState( isLoadingPlanUsage );
	// After a failed attempt, the card shows the retries rather than the whole page waiting them out.
	if ( isHolding && ( ! isLoadingPlanUsage || failureCount > 0 ) ) {
		setHolding( false );
	}
	useEffect( () => {
		if ( ! isHolding ) {
			return;
		}
		const timer = setTimeout( () => setHolding( false ), PLAN_USAGE_HOLD_MS );
		return () => clearTimeout( timer );
	}, [ isHolding ] );

	const statsSettings = getScriptData()?.premium_analytics?.stats_settings;
	const featuresUrl = statsSettings?.features_url;
	const featuresScreen = statsSettings?.features_screen;

	// A plan without a view limit has no usage card, so briefly hold the whole page rather than shift it once that is known.
	if ( isHolding ) {
		return (
			<Stack direction="column" align="center" className={ styles.root } aria-busy="true">
				<Spinner />
				<VisuallyHidden role="status">
					{ __( 'Loading your Stats settings…', 'jetpack-premium-analytics-pkg' ) }
				</VisuallyHidden>
			</Stack>
		);
	}

	return (
		<Stack direction="column" gap="xl" className={ styles.root }>
			<PlanUsageCard />
			<SettingsForm />
			<ConsentCard />
			{ featuresUrl && (
				<Card.Root>
					<Card.Header>
						<Card.Title>{ __( 'Activation', 'jetpack-premium-analytics-pkg' ) }</Card.Title>
					</Card.Header>
					<Card.Content>
						<Text>
							{ createInterpolateElement(
								'modules' === featuresScreen
									? __(
											'Stats is a Jetpack feature. Activate or deactivate it from <link>Jetpack modules</link>.',
											'jetpack-premium-analytics-pkg'
										)
									: __(
											'Stats is a Jetpack feature. Activate or deactivate it from <link>Jetpack features</link>.',
											'jetpack-premium-analytics-pkg'
										),
								{ link: <Link href={ featuresUrl } /> }
							) }
						</Text>
					</Card.Content>
				</Card.Root>
			) }
		</Stack>
	);
}
