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
import { __ } from '@wordpress/i18n';
import { Icon, globe, layout, megaphone } from '@wordpress/icons';
import './style.scss';

interface WelcomeProps {
	onEnable: () => void;
}

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

const Welcome = ( { onEnable }: WelcomeProps ) => (
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

export default Welcome;
