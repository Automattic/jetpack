/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { getScriptData } from '@automattic/jetpack-script-data';
import { formatNumberCompact } from '@automattic/number-formatters';
import {
	getStatsCheckoutUrl,
	useStatsAppPlanUsage,
	useStatsUpgradeTiers,
} from '@jetpack-premium-analytics/data';
import {
	Button,
	ButtonLink,
	Card,
	Notice,
	Skeleton,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon, StatsTierSlider } from '@jetpack-premium-analytics/ui';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { speak } from '@wordpress/a11y';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link as RouteLink, useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getPlanLimitStatus } from '../../plan-limit-status';
import { useStatsOwnership } from '../use-stats-ownership';
import { Showcase } from './showcase';
import { StatsBenefits } from './stats-benefits';
import styles from './upgrade-page.module.scss';
import type { JSX } from 'react';

const DASHBOARD_PATH = 'admin.php?page=jetpack-premium-analytics-wp-admin';

/**
 * The admin path back to this page, keeping the report window, tab and entry point it was opened with.
 *
 * @param search - The page's search params.
 * @return The admin-relative path.
 */
function getUpgradePath( search: Record< string, unknown > | undefined ): string {
	const query = new URLSearchParams();
	for ( const [ key, value ] of Object.entries( search ?? {} ) ) {
		if ( typeof value === 'string' || typeof value === 'number' ) {
			query.set( key, String( value ) );
		}
	}
	const queryString = query.toString();
	const path = queryString ? `/upgrade?${ queryString }` : '/upgrade';
	return `${ DASHBOARD_PATH }&p=${ encodeURIComponent( path ) }`;
}

/**
 * Why a site that already holds a tier should upgrade it.
 *
 * @param isOver - Whether the site is past its limit; `undefined` when not near it.
 * @return The lead sentence.
 */
function upgradeLead( isOver: boolean | undefined ): string {
	if ( isOver ) {
		return __(
			'Your site has reached its views limit. Upgrade your tier to restore full access to advanced stats features.',
			'jetpack-premium-analytics-pkg'
		);
	}

	if ( isOver === false ) {
		return __(
			'Your site is close to its monthly views limit. Upgrade your tier now to avoid any disruption to advanced stats features.',
			'jetpack-premium-analytics-pkg'
		);
	}

	return __(
		'Upgrade and increase your site views limit to continue using our advanced stats features.',
		'jetpack-premium-analytics-pkg'
	);
}

/**
 * The Stats upgrade page: what a commercial tier includes, and a tier to buy.
 *
 * @return The upgrade page.
 */
export function UpgradePage(): JSX.Element {
	const site = getScriptData()?.site;
	const isUserConnected = !! getScriptData()?.connection?.connectionStatus?.isUserConnected;
	const dashboardLink = useDashboardLink();
	const trackEvent = useTrackEvent();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const from = typeof search?.source === 'string' ? search.source : undefined;

	const { tiers, currencyCode, isLoading, isError } = useStatsUpgradeTiers();
	const { data: usage } = useStatsAppPlanUsage();
	const ownership = useStatsOwnership();
	const { isCommercialOwned, hasAnyStatsPlan, bundledPlanName } = ownership;
	const [ tierIndex, setTierIndex ] = useState( 0 );
	const upgradePath = getUpgradePath( search );
	const { handleConnectUser } = useConnection( {
		from: 'jetpack_premium_analytics_upsell',
		redirectUri: upgradePath,
	} );
	// The connection store never clears its own "connecting" flag when the flow fails to start.
	const [ connectState, setConnectState ] = useState< 'idle' | 'connecting' | 'failed' >( 'idle' );
	const connectUser = useCallback( () => {
		setConnectState( 'connecting' );
		handleConnectUser().catch( () => setConnectState( 'failed' ) );
	}, [ handleConnectUser ] );

	useEffect( () => {
		trackEvent( 'jetpack_premium_analytics_upgrade_view', { from } );
	}, [ trackEvent, from ] );

	const needsUserConnection = hasAnyStatsPlan && ! isUserConnected;
	const selectedTier = tiers[ Math.min( tierIndex, tiers.length - 1 ) ];
	// Purchases pick the checkout branch, so they gate it too.
	const isPending = isLoading || ownership.isLoading;
	const hasError = isError || ownership.isError;

	const checkoutUrl =
		! isPending &&
		! hasError &&
		selectedTier &&
		site?.admin_url &&
		site.suffix &&
		site.wpcom?.blog_id &&
		! needsUserConnection
			? getStatsCheckoutUrl( {
					quantity: selectedTier.views,
					adminUrl: site.admin_url,
					siteSlug: site.suffix,
					blogId: site.wpcom.blog_id,
					isUserConnected,
					isUpgrade: hasAnyStatsPlan,
					redirectPath: DASHBOARD_PATH,
					backPath: upgradePath,
				} )
			: undefined;

	let pickerError: string | undefined;
	if ( isPending ) {
		pickerError = undefined;
	} else if ( isError ) {
		pickerError = __(
			'Unable to load plan tiers. Please make sure you have an active network connection and try reloading the page.',
			'jetpack-premium-analytics-pkg'
		);
	} else if ( ownership.isError ) {
		pickerError = __(
			'Unable to load your current purchases. Please make sure you have an active network connection and try reloading the page.',
			'jetpack-premium-analytics-pkg'
		);
	} else if ( ! currencyCode || ! tiers.length ) {
		pickerError = __(
			'No Stats tiers are available to buy for this site right now.',
			'jetpack-premium-analytics-pkg'
		);
	}
	const connectError =
		connectState === 'failed'
			? __(
					'Unable to start connecting your account. Please try again.',
					'jetpack-premium-analytics-pkg'
				)
			: undefined;

	useEffect( () => {
		if ( pickerError ) {
			speak( pickerError, 'polite' );
		}
	}, [ pickerError ] );

	useEffect( () => {
		if ( connectError ) {
			speak( connectError, 'assertive' );
		}
	}, [ connectError ] );

	const recordCheckout = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_upgrade_checkout_click', {
			from,
			tier_views: selectedTier?.views,
		} );
	}, [ trackEvent, from, selectedTier?.views ] );

	const recordPostpone = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_upgrade_postpone_click', { from } );
	}, [ trackEvent, from ] );

	const upgradeLabel = __( 'Upgrade now and continue', 'jetpack-premium-analytics-pkg' );

	let tierPicker: JSX.Element;
	if ( isPending ) {
		tierPicker = <Skeleton className={ styles.tierPlaceholder } />;
	} else if ( pickerError ) {
		tierPicker = (
			<Notice.Root intent="error">
				<Notice.Description>{ pickerError }</Notice.Description>
			</Notice.Root>
		);
	} else {
		tierPicker = (
			<Card.Root>
				<Card.Content>
					<StatsTierSlider
						tiers={ tiers }
						currencyCode={ currencyCode }
						value={ tierIndex }
						onChange={ setTierIndex }
					/>
				</Card.Content>
			</Card.Root>
		);
	}

	return (
		<Page
			visual={ <StatsPageIcon /> }
			breadcrumbs={
				<StatsBreadcrumbs
					items={ [ { label: __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) } ] }
				/>
			}
			className={ styles.page }
		>
			<div className={ styles.layout }>
				<Stack direction="column" gap="xl" className={ styles.pitch }>
					<Text variant="heading-2xl" render={ <h2 /> }>
						{ __(
							'Upgrade Jetpack Stats to unlock premium features',
							'jetpack-premium-analytics-pkg'
						) }
					</Text>
					{ bundledPlanName && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ /* With a commercial tier too, the limit already counts the plan's views. */ }
								{ ! isCommercialOwned && usage?.views_limit
									? sprintf(
											/* translators: %1$s: a plan name, e.g. "Jetpack Complete"; %2$s: a views count, e.g. "100K". */
											__(
												'Your %1$s plan already includes %2$s views per month for Stats. Views from this purchase will stack on top, so you keep what you already have.',
												'jetpack-premium-analytics-pkg'
											),
											bundledPlanName,
											formatNumberCompact( usage.views_limit )
										)
									: sprintf(
											/* translators: %s: a plan name, e.g. "Jetpack Complete". */
											__(
												'Your %s plan already includes views for Stats. Views from this purchase will stack on top, so you keep what you already have.',
												'jetpack-premium-analytics-pkg'
											),
											bundledPlanName
										) }
							</Notice.Description>
						</Notice.Root>
					) }
					{ /* Ownership picks the pitch, so it waits for it rather than swapping under the reader. */ }
					{ ownership.isLoading && <Skeleton className={ styles.pitchPlaceholder } /> }
					{ ! ownership.isLoading && isCommercialOwned && (
						<>
							<Notice.Root intent="info">
								<Notice.Description>
									{ __(
										'The remainder of your current plan will be credited towards the upgrade, ensuring you only pay the price difference. Starting from the next billing cycle, standard charges will apply.',
										'jetpack-premium-analytics-pkg'
									) }
								</Notice.Description>
							</Notice.Root>
							<Text variant="body-md">{ upgradeLead( getPlanLimitStatus( usage )?.isOver ) }</Text>
						</>
					) }
					{ ! ownership.isLoading && ! isCommercialOwned && (
						<>
							{ ! bundledPlanName && (
								<Text variant="body-md">
									{ __(
										'Unlock UTM stats, device stats, and region and city stats with a paid plan.',
										'jetpack-premium-analytics-pkg'
									) }
								</Text>
							) }
							<StatsBenefits />
						</>
					) }
					<Text variant="heading-lg" render={ <h3 /> }>
						{ __( 'Pick your Stats tier below:', 'jetpack-premium-analytics-pkg' ) }
					</Text>
					{ tierPicker }
					{ needsUserConnection && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ __(
									'Please connect your user account to upgrade Stats.',
									'jetpack-premium-analytics-pkg'
								) }
								{ connectError && <> { connectError }</> }
							</Notice.Description>
							<Notice.Actions>
								<Notice.ActionButton
									onClick={ connectUser }
									loading={ connectState === 'connecting' }
								>
									{ __( 'Connect your account', 'jetpack-premium-analytics-pkg' ) }
								</Notice.ActionButton>
							</Notice.Actions>
						</Notice.Root>
					) }
					<Stack direction="column" gap="sm">
						{ checkoutUrl ? (
							<ButtonLink href={ checkoutUrl } onClick={ recordCheckout }>
								{ upgradeLabel }
							</ButtonLink>
						) : (
							<Button variant="solid" disabled>
								{ upgradeLabel }
							</Button>
						) }
						<ButtonLink
							variant="outline"
							render={ <RouteLink to={ dashboardLink } /> }
							onClick={ recordPostpone }
						>
							{ __( 'I will do it later', 'jetpack-premium-analytics-pkg' ) }
						</ButtonLink>
					</Stack>
					<Text variant="body-sm" className={ styles.footnote }>
						{ __( '(*) 14-day money-back guarantee', 'jetpack-premium-analytics-pkg' ) }
					</Text>
				</Stack>
				<Showcase />
			</div>
		</Page>
	);
}
