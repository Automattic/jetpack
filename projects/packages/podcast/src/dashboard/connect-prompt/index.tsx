import { __ } from '@wordpress/i18n';
import { Icon, link } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { getConnectUrl } from '../connection';
import './style.scss';

export type ConnectPromptVariant = 'stats' | 'episodes';

const COPY: Record< ConnectPromptVariant, { title: string; description: string } > = {
	stats: {
		title: __( 'Connect Jetpack to see your podcast stats', 'jetpack-podcast' ),
		description: __(
			'Your podcast feed already works. Connect this site to WordPress.com to track downloads by episode, app, and country.',
			'jetpack-podcast'
		),
	},
	episodes: {
		title: __( 'Connect Jetpack to manage your episodes', 'jetpack-podcast' ),
		description: __(
			'Your podcast feed already works. Connect this site to WordPress.com to manage your catalog and plays from one dashboard.',
			'jetpack-podcast'
		),
	},
};

const ConnectPrompt = ( { variant }: { variant: ConnectPromptVariant } ) => {
	const { title, description } = COPY[ variant ];

	return (
		<Card.Root className="podcast-connect-prompt">
			<Card.Content>
				<Stack direction="column" gap="md" align="center" className="podcast-connect-prompt__inner">
					<span className="podcast-connect-prompt__icon" aria-hidden="true">
						<Icon icon={ link } size={ 28 } />
					</span>
					<Stack direction="column" gap="sm" align="center">
						<Text variant="heading-xl" render={ <h2 /> }>
							{ title }
						</Text>
						<Text variant="body-md" className="podcast-connect-prompt__description">
							{ description }
						</Text>
					</Stack>
					<Button
						variant="solid"
						className="podcast-connect-prompt__cta"
						render={ <a href={ getConnectUrl() } /> }
					>
						{ __( 'Connect Jetpack', 'jetpack-podcast' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default ConnectPrompt;
