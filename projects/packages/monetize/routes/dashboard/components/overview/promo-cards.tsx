import { isSimpleSite, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { currencyDollar, envelope, lock, megaphone, payment, people, tip } from '@wordpress/icons';
import {
	Button,
	ButtonLink,
	Card,
	Icon,
	InputControl,
	Link,
	Notice,
	Stack,
	Text,
} from '@wordpress/ui';
import { showSuccessSnackbar } from '../../data/notices';
import { useEnableReferral, useReferralLink } from '../../data/referral';
import { getPageData } from '../../data/state';
import { trackOverviewClick } from '../../data/tracking';
import { useStoredAdsValues } from '../../data/use-ads-settings';
import { useSiteHasFeature } from '../../data/use-site-feature';
import { useAdsAccount } from '../../data/wordads';
import { getDocUrl } from './docs';
import { getOverviewState } from './state';
import type { DocKey } from './docs';
import type { ReferralState } from './state';
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
	const { upgradeUrl } = getPageData();
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
	const state = getOverviewState();
	const simple = isSimpleSite();
	// Simple switches ads on WordPress.com, so only it knows whether they are on there.
	const account = useAdsAccount( simple );
	// Never fetched here: Settings fills this cache and updates it when ads are switched.
	const stored = useStoredAdsValues( false );
	const isWordAdsActive = simple
		? Boolean( account.data?.active )
		: ( stored.data?.wordads ?? state.isWordAdsActive );
	const hasWordAds = useSiteHasFeature( 'wordads', state.hasWordAds );
	const open = useCallback( () => {
		trackOverviewClick( 'ads', 'open' );
		openTab( isWordAdsActive ? 'ads' : 'settings' );
	}, [ openTab, isWordAdsActive ] );
	const title = isWordAdsActive
		? __( 'View ad dashboard', 'jetpack-monetize' )
		: __( 'Earn ad revenue', 'jetpack-monetize' );

	let actions: ReactNode = null;
	// No action until WordPress.com says whether ads are on, so it can't point at the wrong tab.
	const activeKnown = ! simple || ! account.isPending;
	if ( activeKnown && ( hasWordAds || isWordAdsActive ) ) {
		actions = (
			<Button variant="outline" size="compact" onClick={ open }>
				{ title }
			</Button>
		);
	} else if ( hasWordAds === false ) {
		actions = (
			<>
				<Upgrade feature="ads" />
				<LearnMore doc="ads" feature="ads" asLink />
			</>
		);
	}

	return (
		<PromoCard icon={ megaphone } title={ title } actions={ actions }>
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
					{ hasWordAds === false && (
						<>
							{ ' ' }
							<em>
								{ isWpcomPlatformSite()
									? __( 'Available with an upgraded plan.', 'jetpack-monetize' )
									: __( 'Available with Jetpack Creator, or a bundled plan.', 'jetpack-monetize' ) }
							</em>
						</>
					) }
				</>
			) }
		</PromoCard>
	);
}

/**
 * The Refer a friend card: the user's referral link, the switch that creates it, or an annual plan upsell.
 *
 * @param props          - Component props.
 * @param props.referral - Whether the plan allows referrals, and where to upgrade.
 * @return The card.
 */
function ReferralCard( { referral }: { referral: ReferralState } ) {
	const { eligible, upgradeUrl } = referral;
	const linkQuery = useReferralLink( eligible );
	const enable = useEnableReferral();
	const link = linkQuery.data ?? '';

	const onEnable = useCallback( () => {
		trackOverviewClick( 'peer-referral-wpcom', 'enable' );
		enable.mutate();
	}, [ enable ] );
	const onCopy = useCallback( async () => {
		trackOverviewClick( 'peer-referral-wpcom', 'copy' );
		try {
			await navigator.clipboard.writeText( link );
			showSuccessSnackbar( __( 'Referral link copied.', 'jetpack-monetize' ) );
		} catch {
			// The link stays selectable in its field.
		}
	}, [ link ] );
	const onUpgrade = useCallback( () => trackOverviewClick( 'peer-referral', 'upgrade' ), [] );

	const pitch = __(
		'Share WordPress.com with friends, family, and website visitors. For every paying customer you send our way, you’ll both earn US$25 in free credits.',
		'jetpack-monetize'
	);

	let body: ReactNode = (
		<>
			{ pitch } <em>{ __( 'This feature requires an annual plan.', 'jetpack-monetize' ) }</em>
		</>
	);
	let actions: ReactNode = (
		<ButtonLink variant="solid" size="compact" href={ upgradeUrl } onClick={ onUpgrade }>
			{ __( 'Upgrade', 'jetpack-monetize' ) }
		</ButtonLink>
	);

	if ( eligible && link ) {
		body = __(
			'Share the link below and, for every paying customer you send our way, you’ll both earn US$25 in credits.',
			'jetpack-monetize'
		);
		actions = (
			<Stack direction="row" gap="sm" align="end" className="jp-monetize-overview__referral-link">
				<div className="jp-monetize-overview__referral-input">
					<InputControl
						label={ __( 'Your referral link', 'jetpack-monetize' ) }
						hideLabelFromVision
						value={ link }
						readOnly
					/>
				</div>
				<Button variant="outline" size="compact" onClick={ onCopy }>
					{ __( 'Copy', 'jetpack-monetize' ) }
				</Button>
			</Stack>
		);
	} else if ( eligible ) {
		body = (
			<Stack direction="column" gap="md">
				<span>
					{ createInterpolateElement(
						__(
							'Share WordPress.com with friends, family, and website visitors. For every paying customer you send our way, you’ll both earn US$25 in free credits. By clicking “Earn free credits”, you agree to <a>these terms</a>.',
							'jetpack-monetize'
						),
						{ a: <Link href="https://wordpress.org/about/privacy/" openInNewTab /> }
					) }
				</span>
				{ enable.isError && (
					<Notice.Root intent="error">
						<Notice.Description>
							{ enable.error.message ||
								__( 'Referrals could not be turned on. Try again later.', 'jetpack-monetize' ) }
						</Notice.Description>
					</Notice.Root>
				) }
			</Stack>
		);
		// No button until WordPress.com says whether the user already has a link.
		actions = linkQuery.isPending ? null : (
			<Button
				variant="outline"
				size="compact"
				onClick={ onEnable }
				loading={ enable.isPending }
				disabled={ enable.isPending || enable.isError }
			>
				{ __( 'Earn free credits', 'jetpack-monetize' ) }
			</Button>
		);
	}

	return (
		<PromoCard
			icon={ people }
			title={ __( 'Refer a friend', 'jetpack-monetize' ) }
			actions={ actions }
		>
			{ body }
		</PromoCard>
	);
}

/**
 * Every way the site can earn, in Calypso's order.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The cards.
 */
export default function PromoCards( { openTab }: { openTab: ( tab: TabValue ) => void } ) {
	const state = getOverviewState();
	const hasSimplePayments = useSiteHasFeature( 'simple-payments', state.hasSimplePayments );
	// Undefined while WordPress.com is asked, so neither button flashes before the answer.
	let paypalAction: ReactNode = null;
	if ( hasSimplePayments ) {
		paypalAction = <LearnMore doc="paypal" feature="simple-payments" />;
	} else if ( hasSimplePayments === false ) {
		paypalAction = <Upgrade feature="simple-payments" />;
	}

	return (
		<div className="jp-monetize-overview__promos">
			<PromoCard
				icon={ payment }
				title={ __( 'Collect payments', 'jetpack-monetize' ) }
				actions={ <LearnMore doc="payments" feature="recurring-payments" /> }
			>
				{ __(
					'Let visitors pay for digital goods and services or make quick, pre-set donations with the Payment Button block.',
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
				actions={ paypalAction }
			>
				{ __(
					'Accept credit and debit card payments via PayPal for physical products, services, donations, tips, or memberships.',
					'jetpack-monetize'
				) }
			</PromoCard>
			<AdsCard openTab={ openTab } />
			{ state.referral && <ReferralCard referral={ state.referral } /> }
		</div>
	);
}
