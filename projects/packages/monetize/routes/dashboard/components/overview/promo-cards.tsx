import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { currencyDollar, envelope, lock, megaphone, payment, tip } from '@wordpress/icons';
import { Button, ButtonLink, Card, Icon, Link, Stack, Text } from '@wordpress/ui';
import { useIsStripeConnected } from '../../data/memberships';
import { trackOverviewClick } from '../../data/tracking';
import { getDocUrl } from './docs';
import { getOverviewState } from './state';
import type { DocKey } from './docs';
import type { TabValue } from '../../data/tabs';
import type { ComponentProps, ReactNode } from 'react';

interface PromoCardProps {
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
	children: ReactNode;
	actions: ReactNode;
}

/**
 * One way to earn, with what to do about it.
 *
 * @param props          - Component props.
 * @param props.icon     - The card's icon.
 * @param props.title    - The card's title.
 * @param props.children - The card's description.
 * @param props.actions  - The card's buttons.
 * @return The card.
 */
function PromoCard( { icon, title, children, actions }: PromoCardProps ) {
	return (
		<Card.Root className="jp-monetize-overview__promo">
			<Card.Content>
				<Stack direction="column" gap="md">
					<Icon icon={ icon } />
					<Text variant="heading-md" render={ <h3 /> }>
						{ title }
					</Text>
					<Text render={ <div /> }>{ children }</Text>
					<Stack direction="row" gap="sm" align="center" wrap="wrap">
						{ actions }
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

interface TrackedProps {
	/** The `feature` the click is recorded under. */
	feature: string;
}

/**
 * A support doc, styled as the card's button.
 *
 * @param props         - Component props.
 * @param props.doc     - The doc.
 * @param props.feature - The `feature` the click is recorded under.
 * @param props.asLink  - Render as a plain link beside another button.
 * @return The link.
 */
function LearnMore( { doc, feature, asLink }: TrackedProps & { doc: DocKey; asLink?: boolean } ) {
	const onClick = useCallback( () => trackOverviewClick( feature, 'learn-more' ), [ feature ] );
	const label = __( 'Learn more', 'jetpack-monetize' );

	return asLink ? (
		<Link href={ getDocUrl( doc ) } openInNewTab onClick={ onClick }>
			{ label }
		</Link>
	) : (
		<ButtonLink
			variant="outline"
			size="compact"
			href={ getDocUrl( doc ) }
			openInNewTab
			onClick={ onClick }
		>
			{ label }
		</ButtonLink>
	);
}

/**
 * The upgrade button, or nothing when there's nowhere to upgrade to.
 *
 * @param props         - Component props.
 * @param props.feature - The `feature` the click is recorded under.
 * @return The link.
 */
function Upgrade( { feature }: TrackedProps ) {
	const { upgradeUrl } = getOverviewState();
	const onClick = useCallback( () => trackOverviewClick( feature, 'upgrade' ), [ feature ] );

	return upgradeUrl ? (
		<ButtonLink variant="solid" size="compact" href={ upgradeUrl } onClick={ onClick }>
			{ __( 'Upgrade', 'jetpack-monetize' ) }
		</ButtonLink>
	) : null;
}

/**
 * The Ads card: the Ads tab once ads are on, Settings to turn them on, an upsell without the plan.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The card.
 */
function AdsCard( { openTab }: { openTab: ( tab: TabValue ) => void } ) {
	const { hasWordAds, isWordAdsActive } = getOverviewState();
	const open = useCallback( () => {
		trackOverviewClick( 'ads', 'open' );
		openTab( isWordAdsActive ? 'ads' : 'settings' );
	}, [ openTab, isWordAdsActive ] );
	const title = isWordAdsActive
		? __( 'View ad dashboard', 'jetpack-monetize' )
		: __( 'Earn ad revenue', 'jetpack-monetize' );

	return (
		<PromoCard
			icon={ megaphone }
			title={ title }
			actions={
				hasWordAds || isWordAdsActive ? (
					<Button variant="outline" size="compact" onClick={ open }>
						{ title }
					</Button>
				) : (
					<>
						<Upgrade feature="ads" />
						<LearnMore doc="ads" feature="ads" asLink />
					</>
				)
			}
		>
			{ isWordAdsActive ? (
				__(
					"Check out your ad earnings history, including total earnings, total paid to date, and the amount that you've still yet to be paid.",
					'jetpack-monetize'
				)
			) : (
				<>
					{ __(
						'Make money each time someone visits your site by displaying ads on your posts and pages.',
						'jetpack-monetize'
					) }
					{ ! hasWordAds && (
						<>
							{ ' ' }
							<em>
								{ __( 'Available with Jetpack Creator, or a bundled plan.', 'jetpack-monetize' ) }
							</em>
						</>
					) }
				</>
			) }
		</PromoCard>
	);
}

/**
 * Every way the site can earn, in Calypso's order.
 *
 * @param props             - Component props.
 * @param props.canUseWpcom - Whether the page can ask WordPress.com about Stripe.
 * @param props.openTab     - Opens another of the page's tabs.
 * @return The cards.
 */
export default function PromoCards( {
	canUseWpcom,
	openTab,
}: {
	canUseWpcom: boolean;
	openTab: ( tab: TabValue ) => void;
} ) {
	const { hasSimplePayments } = getOverviewState();
	const { data: isStripeConnected = false } = useIsStripeConnected( canUseWpcom );

	return (
		<div className="jp-monetize-overview__promos">
			<PromoCard
				icon={ payment }
				title={ __( 'Collect payments', 'jetpack-monetize' ) }
				actions={ <LearnMore doc="payments" feature="recurring-payments" /> }
			>
				{ isStripeConnected
					? __(
							'Let visitors pay for digital goods and services or make quick, pre-set donations by inserting the Payment Button block.',
							'jetpack-monetize'
						)
					: __(
							'Let visitors pay for digital goods and services or make quick, pre-set donations by enabling the Payment Button block.',
							'jetpack-monetize'
						) }
			</PromoCard>
			<PromoCard
				icon={ tip }
				title={ __( 'Receive donations and tips', 'jetpack-monetize' ) }
				actions={ <LearnMore doc="donations" feature="donations" /> }
			>
				{ __(
					'The Donations Form block lets you accept credit and debit card payments for one-time donations, contributions, and tips.',
					'jetpack-monetize'
				) }
			</PromoCard>
			<PromoCard
				icon={ lock }
				title={ __( 'Create subscriber-only content', 'jetpack-monetize' ) }
				actions={ <LearnMore doc="premiumContent" feature="premium-content" /> }
			>
				{ __(
					'Create paid subscription options and gate access to text, video, image, or any other kind of content.',
					'jetpack-monetize'
				) }
			</PromoCard>
			<PromoCard
				icon={ envelope }
				title={ __( 'Set up a paid newsletter', 'jetpack-monetize' ) }
				actions={ <LearnMore doc="paidNewsletter" feature="learn-paid-newsletters" /> }
			>
				{ __(
					'Reach and grow your audience with a newsletter and earn with paid subscriptions, gated content options, and one-time offerings.',
					'jetpack-monetize'
				) }
			</PromoCard>
			<PromoCard
				icon={ currencyDollar }
				title={ __( 'Collect PayPal payments', 'jetpack-monetize' ) }
				actions={
					hasSimplePayments ? (
						<LearnMore doc="paypal" feature="simple-payments" />
					) : (
						<Upgrade feature="simple-payments" />
					)
				}
			>
				{ __(
					'Accept credit and debit card payments via PayPal for physical products, services, donations, tips, or memberships.',
					'jetpack-monetize'
				) }
			</PromoCard>
			<AdsCard openTab={ openTab } />
		</div>
	);
}
