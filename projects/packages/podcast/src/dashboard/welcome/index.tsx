import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getSiteData } from '@automattic/jetpack-script-data';
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
import { __ } from '@wordpress/i18n';
import { Icon, check, globe, layout, megaphone } from '@wordpress/icons';
import './style.scss';

interface WelcomeProps {
	onEnable: () => void;
}

// Prefer `site.suffix` since it preserves the full Calypso site fragment
// (e.g. `example.com::path` for mapped subdirectory sites). Fall back to
// the admin_url host as a safety net in case suffix is unexpectedly absent.
const getSiteSlug = (): string => {
	const data = getSiteData();
	if ( data?.suffix ) {
		return data.suffix;
	}
	const adminUrl = data?.admin_url ?? '';
	if ( ! adminUrl ) {
		return '';
	}
	try {
		return new URL( adminUrl ).host;
	} catch {
		return '';
	}
};

const getPremiumCheckoutUrl = (): string => {
	const slug = getSiteSlug();
	const adminUrl = getSiteData()?.admin_url ?? '';
	// `tab=settings` bypasses the welcome gate so buyers continue configuring
	// the podcast instead of re-seeing this same pricing card after checkout.
	const returnTo = adminUrl
		? `${ adminUrl.replace( /\/$/, '' ) }/admin.php?page=jetpack-podcast&tab=settings`
		: '';
	const base = slug
		? `https://wordpress.com/checkout/${ slug }/premium`
		: 'https://wordpress.com/checkout/premium';
	return returnTo ? `${ base }?redirect_to=${ encodeURIComponent( returnTo ) }` : base;
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

const FREE_FEATURES: ReadonlyArray< string > = [
	__( 'Publish a podcast with audio hosted on another site', 'jetpack-podcast' ),
	__( 'Distribute to Apple, Spotify, and every major app', 'jetpack-podcast' ),
	__( 'Submission-ready RSS feed for every directory', 'jetpack-podcast' ),
];

const PREMIUM_FEATURES: ReadonlyArray< string > = [
	__( 'Host your podcast on WordPress.com with 13 GB of storage', 'jetpack-podcast' ),
	__( 'Distribute to Apple, Spotify, and every major app', 'jetpack-podcast' ),
	__( 'Submission-ready RSS feed for every directory', 'jetpack-podcast' ),
	__( 'Podcast stats including downloads by app and country', 'jetpack-podcast' ),
	__( 'Episode dashboard', 'jetpack-podcast' ),
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

const Welcome = ( { onEnable }: WelcomeProps ) => {
	const onPremiumClick = useCallback( () => {
		const currentPlan = getSiteData()?.plan?.product_slug;
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_premium_upgrade_clicked', {
			current_plan: currentPlan ?? '',
		} );
		window.location.href = getPremiumCheckoutUrl();
	}, [] );

	return (
		<VStack spacing={ 8 }>
			<section className="podcast__welcome-hero">
				<VStack spacing={ 4 } className="podcast__welcome-hero-copy">
					<h2 className="podcast__welcome-title">
						{ __( 'Your podcast belongs with your blog', 'jetpack-podcast' ) }
					</h2>
					<Text variant="muted">
						{ __(
							'Publish your show on the same site as your blog and newsletter. Reach fans on Apple, Spotify, Pocket Casts, and every major podcast app.',
							'jetpack-podcast'
						) }
					</Text>
					<HStack justify="flex-start" expanded={ false }>
						<Button variant="primary" onClick={ onEnable }>
							{ __( 'Enable podcasting', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			</section>

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
									{ FREE_FEATURES.map( feature => (
										<li key={ feature } className="podcast__welcome-plan-feature">
											<Icon icon={ check } size={ 20 } />
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
											{ __( 'Premium', 'jetpack-podcast' ) }
										</Text>
										<span className="podcast__welcome-plan-badge">
											{ __( 'Popular', 'jetpack-podcast' ) }
										</span>
									</HStack>
									<Text variant="muted">
										{ __(
											'Host your podcast at WordPress.com and get all the advanced features.',
											'jetpack-podcast'
										) }
									</Text>
								</VStack>
								<Button variant="primary" onClick={ onPremiumClick }>
									{ __( 'Start your premium podcast', 'jetpack-podcast' ) }
								</Button>
								<ul className="podcast__welcome-plan-features">
									{ PREMIUM_FEATURES.map( feature => (
										<li key={ feature } className="podcast__welcome-plan-feature">
											<Icon icon={ check } size={ 20 } />
											<Text>{ feature }</Text>
										</li>
									) ) }
								</ul>
							</VStack>
						</CardBody>
					</Card>
				</HStack>
			</section>

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
