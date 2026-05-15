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
import { Icon, audio, layout, megaphone } from '@wordpress/icons';
import './style.scss';

interface WelcomeProps {
	onEnable: () => void;
}

const BENEFITS: ReadonlyArray< { icon: JSX.Element; title: string; body: string } > = [
	{
		icon: <Icon icon={ megaphone } />,
		title: __( 'Reach listeners in every app', 'jetpack-podcast' ),
		body: __(
			'One feed distributes to Apple Podcasts, Spotify, Overcast, Pocket Casts, and every directory that accepts RSS.',
			'jetpack-podcast'
		),
	},
	{
		icon: <Icon icon={ audio } />,
		title: __( 'Works with the editor you already use', 'jetpack-podcast' ),
		body: __(
			'Drop an audio block into a post, assign the podcast category, hit publish. That is the whole workflow.',
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
			'Add an audio block to any post and assign it to your podcast category.',
			'jetpack-podcast'
		),
	},
	{
		number: '3',
		title: __( 'Submit your feed once', 'jetpack-podcast' ),
		body: __(
			'Copy the feed URL, submit it to Apple Podcasts and Spotify, and you are live.',
			'jetpack-podcast'
		),
	},
];

const Welcome = ( { onEnable }: WelcomeProps ) => (
	<VStack spacing={ 8 }>
		<section className="podcast__welcome-hero">
			<VStack spacing={ 4 } className="podcast__welcome-hero-copy">
				<h2 className="podcast__welcome-title">
					{ __( 'Turn your posts into a podcast', 'jetpack-podcast' ) }
				</h2>
				<Text variant="muted">
					{ __(
						'Publish audio alongside your writing and get distributed to Apple Podcasts, Spotify, and every major app, without leaving your site.',
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
