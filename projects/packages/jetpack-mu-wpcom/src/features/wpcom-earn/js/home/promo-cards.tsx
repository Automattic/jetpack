import { useCopyToClipboard } from '@wordpress/compose';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { currencyDollar, envelope, lock, megaphone, payment, people, tip } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { Button, Card, Icon, Link, LinkButton, Notice, Stack, Text } from '@wordpress/ui';
import { useMembershipsStatus } from '../data/memberships.ts';
import { useEnablePeerReferral, usePeerReferral } from '../data/peer-referral.ts';
import { SECTIONS } from '../sections.ts';
import { getInitialState } from '../state.ts';
import { recordTracksEvent } from '../tracks.ts';
import { getPlansUrl } from '../upsell.ts';
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
 * @return The rendered card.
 */
function PromoCard( { icon, title, children, actions }: PromoCardProps ) {
	return (
		<Card.Root className="wpcom-earn-home__promo">
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

/**
 * A support doc link styled as the card's button, recorded as Calypso records it.
 *
 * @param props         - Component props.
 * @param props.href    - The doc.
 * @param props.event   - The Tracks event.
 * @param props.feature - The `feature` the event reports.
 * @return The rendered link.
 */
function LearnMore( {
	href,
	event = 'calypso_earn_page_cta_button_click',
	feature,
}: {
	href: string;
	event?: string;
	feature: string;
} ) {
	return (
		<LinkButton
			variant="outline"
			size="compact"
			href={ href }
			onClick={ () => recordTracksEvent( event, { feature } ) }
		>
			{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
		</LinkButton>
	);
}

/**
 * An upgrade button to the plans page, recorded as Calypso records it.
 *
 * @param props          - Component props.
 * @param props.feature  - The `feature` the event reports.
 * @param props.args     - Query args for the plans page.
 * @param props.interval - Open on the yearly plans.
 * @return The rendered link.
 */
function Upgrade( {
	feature,
	args = {},
	interval,
}: {
	feature: string;
	args?: Record< string, string >;
	interval?: 'yearly';
} ) {
	return (
		<LinkButton
			variant="solid"
			size="compact"
			href={ getPlansUrl( getInitialState().domain, args, interval ) }
			onClick={ () =>
				recordTracksEvent( 'calypso_earn_page_upgrade_button_click', { plan: 'plans', feature } )
			}
		>
			{ __( 'Upgrade', 'jetpack-mu-wpcom' ) }
		</LinkButton>
	);
}

/**
 * The referral link, with a button to copy it.
 *
 * @param props      - Component props.
 * @param props.link - The link.
 * @return The rendered field.
 */
function ReferralLink( { link }: { link: string } ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const ref = useCopyToClipboard< HTMLButtonElement >( link, () => setHasCopied( true ) );

	return (
		<Stack direction="row" gap="sm" align="center" className="wpcom-earn-home__referral-link">
			<input
				type="text"
				readOnly
				value={ link }
				aria-label={ __( 'Referral link', 'jetpack-mu-wpcom' ) }
			/>
			<Button ref={ ref } variant="outline" size="compact">
				{ hasCopied ? __( 'Copied!', 'jetpack-mu-wpcom' ) : __( 'Copy', 'jetpack-mu-wpcom' ) }
			</Button>
		</Stack>
	);
}

/**
 * The Refer a friend card. WordPress.com decides eligibility per user, from their plans.
 *
 * @return The rendered card.
 */
function PeerReferralCard() {
	const { data: referral } = usePeerReferral();
	const enable = useEnablePeerReferral();
	const terms = createInterpolateElement(
		__(
			'Share WordPress.com with friends, family, and website visitors. For every paying customer you send our way, you’ll both earn US$25 in free credits. By clicking “Earn free credits”, you agree to <a>these terms</a>.',
			'jetpack-mu-wpcom'
		),
		{ a: <Link href="https://wordpress.org/about/privacy/" openInNewTab /> }
	);

	let body: ReactNode = terms;
	let actions: ReactNode = null;

	if ( referral?.state === 'enabled' ) {
		body = __(
			'Share the link below and, for every paying customer you send our way, you’ll both earn US$25 in credits.',
			'jetpack-mu-wpcom'
		);
		actions = <ReferralLink link={ referral.link } />;
	} else if ( referral?.state === 'available' ) {
		actions = (
			<Button
				variant="outline"
				size="compact"
				disabled={ enable.isPending || enable.isError }
				onClick={ () => {
					recordTracksEvent( 'calypso_earn_page_cta_button_click', {
						feature: 'peer-referral-wpcom',
					} );
					enable.mutate();
				} }
			>
				{ __( 'Earn free credits', 'jetpack-mu-wpcom' ) }
			</Button>
		);
	} else if ( referral?.state === 'unavailable' ) {
		body = (
			<>
				{ __(
					'Share WordPress.com with friends, family, and website visitors. For every paying customer you send our way, you’ll both earn US$25 in free credits.',
					'jetpack-mu-wpcom'
				) }{ ' ' }
				<em>{ __( 'This feature requires an annual plan.', 'jetpack-mu-wpcom' ) }</em>
			</>
		);
		actions = <Upgrade feature="peer-referral" interval="yearly" />;
	}

	return (
		<PromoCard
			icon={ people }
			title={ __( 'Refer a friend', 'jetpack-mu-wpcom' ) }
			actions={ actions }
		>
			{ body }
			{ enable.isError && (
				<Notice.Root intent="error" className="wpcom-earn-home__notice">
					<Notice.Description>{ enable.error.message }</Notice.Description>
				</Notice.Root>
			) }
		</PromoCard>
	);
}

/**
 * The Ads card: the dashboard once ads are on, an upsell without the plan.
 *
 * @return The rendered card.
 */
function AdsCard() {
	const navigate = useNavigate();
	const { features, wordadsEnabled } = getInitialState();
	const canEarn = features.wordads || wordadsEnabled;
	const title = wordadsEnabled
		? __( 'View ad dashboard', 'jetpack-mu-wpcom' )
		: __( 'Earn ad revenue', 'jetpack-mu-wpcom' );

	const body = wordadsEnabled ? (
		__(
			"Check out your ad earnings history, including total earnings, total paid to date, and the amount that you've still yet to be paid.",
			'jetpack-mu-wpcom'
		)
	) : (
		<>
			{ __(
				'Make money each time someone visits your site by displaying ads on your posts and pages.',
				'jetpack-mu-wpcom'
			) }
			{ ! features.wordads && (
				<em>
					{ ' ' }
					{ sprintf(
						/* translators: 1, 2, 3: WordPress.com plan names. */
						__( 'Available only with a %1$s, %2$s, or %3$s plan.', 'jetpack-mu-wpcom' ),
						_x( 'Premium', 'WordPress.com plan name', 'jetpack-mu-wpcom' ),
						_x( 'Business', 'WordPress.com plan name', 'jetpack-mu-wpcom' ),
						_x( 'Commerce', 'WordPress.com plan name', 'jetpack-mu-wpcom' )
					) }
				</em>
			) }
		</>
	);

	const actions = canEarn ? (
		<Button
			variant="outline"
			size="compact"
			onClick={ () => {
				recordTracksEvent( 'calypso_earn_page_cta_button_click', { feature: 'ads' } );
				navigate( { href: SECTIONS.ads.path } );
			} }
		>
			{ title }
		</Button>
	) : (
		<>
			<Upgrade feature="ads" args={ { feature: 'wordads-instant', plan: 'value_bundle' } } />
			<Link
				href="https://wordads.co/"
				openInNewTab
				onClick={ () =>
					recordTracksEvent( 'calypso_earn_page_learn_link_click', { feature: 'ads' } )
				}
			>
				{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
			</Link>
		</>
	);

	return (
		<PromoCard icon={ megaphone } title={ title } actions={ actions }>
			{ body }
		</PromoCard>
	);
}

/**
 * Every way the site can earn, in Calypso's order.
 *
 * @return The rendered cards.
 */
export function PromoCards() {
	const { features } = getInitialState();
	const isConnected = useMembershipsStatus().data?.isConnected ?? false;

	return (
		<div className="wpcom-earn-home__promos">
			<PromoCard
				icon={ payment }
				title={ __( 'Collect payments', 'jetpack-mu-wpcom' ) }
				actions={
					<LearnMore
						href="https://wordpress.com/payments-donations/"
						feature="recurring-payments"
					/>
				}
			>
				{ isConnected
					? __(
							'Let visitors pay for digital goods and services or make quick, pre-set donations by inserting the Payment Button block.',
							'jetpack-mu-wpcom'
						)
					: __(
							'Let visitors pay for digital goods and services or make quick, pre-set donations by enabling the Payment Button block.',
							'jetpack-mu-wpcom'
						) }
			</PromoCard>
			<PromoCard
				icon={ tip }
				title={ __( 'Receive donations and tips', 'jetpack-mu-wpcom' ) }
				actions={
					<LearnMore href="https://wordpress.com/payments-donations/" feature="donations" />
				}
			>
				{ __(
					'The Donations Form block lets you accept credit and debit card payments for one-time donations, contributions, and tips.',
					'jetpack-mu-wpcom'
				) }
			</PromoCard>
			<PromoCard
				icon={ lock }
				title={ __( 'Create subscriber-only content', 'jetpack-mu-wpcom' ) }
				actions={
					<LearnMore
						href="https://wordpress.com/support/wordpress-editor/blocks/premium-content-block/"
						event="calypso_earn_page_learn_link_click"
						feature="premium-content"
					/>
				}
			>
				{ __(
					'Create paid subscription options and gate access to text, video, image, or any other kind of content.',
					'jetpack-mu-wpcom'
				) }
			</PromoCard>
			<PromoCard
				icon={ envelope }
				title={ __( 'Set up a paid newsletter', 'jetpack-mu-wpcom' ) }
				actions={
					<LearnMore
						href="https://wordpress.com/support/paid-newsletters/"
						feature="learn-paid-newsletters"
					/>
				}
			>
				{ __(
					'Reach and grow your audience with a newsletter and earn with paid subscriptions, gated content options, and one-time offerings.',
					'jetpack-mu-wpcom'
				) }
			</PromoCard>
			<PromoCard
				icon={ currencyDollar }
				title={ __( 'Collect PayPal payments', 'jetpack-mu-wpcom' ) }
				actions={
					features.simplePayments ? (
						<LearnMore
							href="https://wordpress.com/support/wordpress-editor/blocks/pay-with-paypal/"
							feature="simple-payments"
						/>
					) : (
						<Upgrade
							feature="simple-payments"
							args={ { feature: 'simple-payments', plan: 'value_bundle' } }
						/>
					)
				}
			>
				{ __(
					'Accept credit and debit card payments via PayPal for physical products, services, donations, tips, or memberships.',
					'jetpack-mu-wpcom'
				) }
			</PromoCard>
			<AdsCard />
			<PeerReferralCard />
		</div>
	);
}
