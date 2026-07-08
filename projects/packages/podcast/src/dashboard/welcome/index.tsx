import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getAdminUrl, getSiteData, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardBody,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check, globe, layout, megaphone } from '@wordpress/icons';
import {
	buildUpgradeCheckoutUrl,
	getUpgradeProductSlug,
	getUpgradePlanName,
	withPurchaseReturnMarker,
} from '../upgrade';
import './style.scss';

interface WelcomeProps {
	onEnable: () => void;
	/** Whether the site already includes the paid podcast surfaces. */
	hasAccess: boolean;
}

const CHECKOUT_SOURCE = 'jetpack-podcast-welcome';

const getUpgradeCheckoutUrl = (): string => {
	const data = getSiteData();
	const adminUrl = data?.admin_url ?? '';

	// Prefer `site.suffix` since it preserves the full Calypso site fragment
	// (e.g. `example.com::path` for mapped subdirectory sites). Fall back to
	// the admin_url host as a safety net in case suffix is unexpectedly absent.
	let slug = data?.suffix ?? '';
	if ( ! slug && adminUrl ) {
		try {
			slug = new URL( adminUrl ).host;
		} catch {
			// Leave slug empty; we'll fall back to the generic plan picker below.
		}
	}

	// `tab=settings` bypasses the welcome gate so buyers continue configuring
	// the podcast instead of re-seeing this same pricing card after checkout;
	// the purchase marker busts the server's cached plan so access flips on
	// arrival.
	const returnTo = adminUrl
		? withPurchaseReturnMarker( getAdminUrl( 'admin.php?page=jetpack-podcast&tab=settings' ) )
		: '';

	return buildUpgradeCheckoutUrl( {
		siteSlug: slug,
		returnUrl: returnTo,
		// Calypso threads `source` through its downstream Tracks events.
		params: { source: CHECKOUT_SOURCE },
		noSiteSlugUrl: `https://wordpress.com/checkout/${ getUpgradeProductSlug() }`,
	} );
};

const BENEFITS: ReadonlyArray< { icon: JSX.Element; title: string; body: string } > = [
	{
		icon: <Icon icon={ megaphone } />,
		title: __( 'Reach listeners in every app', 'jetpack-podcast' ),
		body: __(
			'One feed distributes to Apple Podcasts, Spotify, Overcast, Pocket Casts, and every directory that accepts RSS.',
			'jetpack-podcast'
		),
	},
	{
		icon: <Icon icon={ layout } />,
		title: __( 'One home for writing, email, and audio', 'jetpack-podcast' ),
		body: __(
			'One site, one audience, one subscriber list. Your posts, newsletters, and episodes all live in the same place.',
			'jetpack-podcast'
		),
	},
	{
		icon: <Icon icon={ globe } />,
		title: __( 'Own your feed forever', 'jetpack-podcast' ),
		body: __(
			'Your podcast lives on your domain with your data and your subscribers. Everything can move with you at any time.',
			'jetpack-podcast'
		),
	},
];

// WordPress.com hosts the audio (and sells storage); self-hosted Jetpack sites
// serve audio from their own media library, so the plan copy differs by host.
const FREE_FEATURES_WPCOM: ReadonlyArray< string > = [
	__( 'Publish a podcast with audio hosted on another site', 'jetpack-podcast' ),
	__( 'Distribute to Apple, Spotify, and every major app', 'jetpack-podcast' ),
	__( 'Submission-ready RSS feed for every directory', 'jetpack-podcast' ),
];

const FREE_FEATURES_SELF_HOSTED: ReadonlyArray< string > = [
	__( 'Publish a podcast with audio from your own media library', 'jetpack-podcast' ),
	__( 'Distribute to Apple, Spotify, and every major app', 'jetpack-podcast' ),
	__( 'Submission-ready RSS feed for every directory', 'jetpack-podcast' ),
];

const PAID_FEATURES_WPCOM: ReadonlyArray< string > = [
	__( 'Host your podcast on WordPress.com with 13 GB of storage', 'jetpack-podcast' ),
	__( 'Distribute to Apple, Spotify, and every major app', 'jetpack-podcast' ),
	__( 'Submission-ready RSS feed for every directory', 'jetpack-podcast' ),
	__( 'Podcast stats including downloads by app and country', 'jetpack-podcast' ),
	__( 'Episode dashboard', 'jetpack-podcast' ),
	__( 'Episode player block for your posts', 'jetpack-podcast' ),
];

const PAID_FEATURES_SELF_HOSTED: ReadonlyArray< string > = [
	__( 'Everything in the free plan', 'jetpack-podcast' ),
	__( 'Podcast stats including downloads by app and country', 'jetpack-podcast' ),
	__( 'Episode dashboard to manage your catalog', 'jetpack-podcast' ),
	__( 'Episode player block for your posts', 'jetpack-podcast' ),
];

const STEPS: ReadonlyArray< { number: string; title: string; body: string } > = [
	{
		number: '1',
		title: __( 'Pick a category', 'jetpack-podcast' ),
		body: __( 'Choose or create the category that holds your episodes.', 'jetpack-podcast' ),
	},
	{
		number: '2',
		title: __( 'Publish a post with audio', 'jetpack-podcast' ),
		body: __(
			'Add an audio or podcast episode block to any post and assign it to your podcast category.',
			'jetpack-podcast'
		),
	},
	{
		number: '3',
		title: __( 'Submit your feed', 'jetpack-podcast' ),
		body: __(
			"Use our simple distribution tool to submit to Apple, Spotify, and others. That's it!",
			'jetpack-podcast'
		),
	},
];

const Welcome = ( { onEnable, hasAccess }: WelcomeProps ) => {
	const upgradeCheckoutUrl = ! hasAccess ? getUpgradeCheckoutUrl() : '';
	const planName = ! hasAccess ? getUpgradePlanName() : '';
	const isWpcom = isWpcomPlatformSite();

	const freeFeatures = isWpcom ? FREE_FEATURES_WPCOM : FREE_FEATURES_SELF_HOSTED;
	const paidFeatures = isWpcom ? PAID_FEATURES_WPCOM : PAID_FEATURES_SELF_HOSTED;
	const paidDescription = isWpcom
		? __(
				'Host your podcast at WordPress.com and get all the advanced features.',
				'jetpack-podcast'
		  )
		: __(
				'Unlock podcast stats, the episode dashboard, and the episode block.',
				'jetpack-podcast'
		  );
	// Shown when the site already owns the paid surfaces, so the plan comparison
	// is replaced by confirmation copy instead of a checkout CTA.
	const includedDescription = isWpcom
		? __(
				'Audio hosting, stats, the episode dashboard, and the episode block are all unlocked.',
				'jetpack-podcast'
		  )
		: __(
				'Podcast stats, the episode dashboard, and the episode block are all unlocked.',
				'jetpack-podcast'
		  );

	// Fire-and-forget Tracks; the anchor handles navigation so middle/cmd-click
	// still opens checkout in a new tab and "copy link address" shows the URL.
	const onUpgradeClick = useCallback( () => {
		const currentPlan = getSiteData()?.plan?.product_slug;
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_premium_upgrade_clicked', {
			current_plan: currentPlan ?? '',
		} );
	}, [] );

	return (
		<VStack spacing={ 8 }>
			<section className="podcast__welcome-hero">
				<VStack spacing={ 4 } className="podcast__welcome-hero-copy">
					{ hasAccess ? (
						<VStack spacing={ 2 }>
							<HStack justify="flex-start" alignment="center" spacing={ 2 } expanded={ false }>
								<span className="podcast__welcome-plan-check" aria-hidden="true">
									<Icon icon={ check } size={ 24 } />
								</span>
								<Text as="h2" size="title" weight={ 500 }>
									{ __( 'Podcast is included with your plan', 'jetpack-podcast' ) }
								</Text>
							</HStack>
							<Text variant="muted">{ includedDescription }</Text>
						</VStack>
					) : (
						<>
							<h2 className="podcast__welcome-title">
								{ __( 'Your podcast belongs with your blog', 'jetpack-podcast' ) }
							</h2>
							<Text variant="muted">
								{ __(
									'Publish your show on the same site as your blog and newsletter. Reach fans on Apple, Spotify, Pocket Casts, and every major podcast app.',
									'jetpack-podcast'
								) }
							</Text>
						</>
					) }
					<HStack justify="flex-start" expanded={ false }>
						<Button variant="primary" onClick={ onEnable }>
							{ __( 'Enable podcasting', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			</section>

			{ ! hasAccess && (
				<section className="podcast__welcome-plans">
					<HStack alignment="stretch" spacing={ 4 } wrap>
						<Card className="podcast__welcome-plan" style={ { flex: '1 1 320px' } }>
							<CardBody>
								<VStack spacing={ 4 }>
									<VStack spacing={ 2 }>
										<Text size="title" weight={ 500 }>
											{ __( 'Free', 'jetpack-podcast' ) }
										</Text>
										<Text variant="muted">
											{ __(
												'Publish your podcast alongside your blog and newsletter.',
												'jetpack-podcast'
											) }
										</Text>
									</VStack>
									<Button variant="secondary" onClick={ onEnable }>
										{ __( 'Start your podcast', 'jetpack-podcast' ) }
									</Button>
									<ul className="podcast__welcome-plan-features">
										{ freeFeatures.map( feature => (
											<li key={ feature } className="podcast__welcome-plan-feature">
												<span aria-hidden="true">
													<Icon icon={ check } size={ 20 } />
												</span>
												<Text>{ feature }</Text>
											</li>
										) ) }
									</ul>
								</VStack>
							</CardBody>
						</Card>

						<Card
							className="podcast__welcome-plan podcast__welcome-plan--premium"
							style={ { flex: '1 1 320px' } }
						>
							<CardBody>
								<VStack spacing={ 4 }>
									<VStack spacing={ 2 }>
										<HStack justify="space-between" alignment="center">
											<Text size="title" weight={ 500 }>
												{ planName }
											</Text>
											<span className="podcast__welcome-plan-badge">
												{ __( 'Popular', 'jetpack-podcast' ) }
											</span>
										</HStack>
										<Text variant="muted">{ paidDescription }</Text>
									</VStack>
									<Button variant="primary" href={ upgradeCheckoutUrl } onClick={ onUpgradeClick }>
										{ sprintf(
											/* translators: %s is the plan name, e.g. "Growth" or "Premium". */
											__( 'Start your %s podcast', 'jetpack-podcast' ),
											planName
										) }
									</Button>
									<ul className="podcast__welcome-plan-features">
										{ paidFeatures.map( feature => (
											<li key={ feature } className="podcast__welcome-plan-feature">
												<span aria-hidden="true">
													<Icon icon={ check } size={ 20 } />
												</span>
												<Text>{ feature }</Text>
											</li>
										) ) }
									</ul>
								</VStack>
							</CardBody>
						</Card>
					</HStack>
				</section>
			) }

			<HStack alignment="stretch" spacing={ 4 } wrap>
				{ BENEFITS.map( b => (
					<Card key={ b.title } style={ { flex: '1 1 280px' } }>
						<CardBody>
							<VStack spacing={ 3 }>
								<span className="podcast__welcome-benefit-icon" aria-hidden="true">
									{ b.icon }
								</span>
								<Text size="title" weight={ 500 }>
									{ b.title }
								</Text>
								<Text variant="muted">{ b.body }</Text>
							</VStack>
						</CardBody>
					</Card>
				) ) }
			</HStack>

			<Card>
				<CardBody>
					<VStack spacing={ 5 }>
						<Text size="title" weight={ 500 }>
							{ __( 'How it works', 'jetpack-podcast' ) }
						</Text>
						<ol className="podcast__welcome-steps">
							{ STEPS.map( step => (
								<li key={ step.number } className="podcast__welcome-step">
									<span className="podcast__welcome-step-circle">{ step.number }</span>
									<Text weight={ 500 }>{ step.title }</Text>
									<Text variant="muted">{ step.body }</Text>
								</li>
							) ) }
						</ol>
					</VStack>
				</CardBody>
			</Card>
		</VStack>
	);
};

export default Welcome;
