import {
	Button,
	Card,
	CardBody,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, link } from '@wordpress/icons';
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
		<Card className="podcast-connect-prompt">
			<CardBody>
				<VStack spacing={ 4 } alignment="center" className="podcast-connect-prompt__inner">
					<span className="podcast-connect-prompt__icon" aria-hidden="true">
						<Icon icon={ link } />
					</span>
					<VStack spacing={ 2 } alignment="center">
						<h2 className="podcast-connect-prompt__title">{ title }</h2>
						<Text variant="muted" className="podcast-connect-prompt__description">
							{ description }
						</Text>
					</VStack>
					<Button variant="primary" href={ getConnectUrl() } __next40pxDefaultSize>
						{ __( 'Connect Jetpack', 'jetpack-podcast' ) }
					</Button>
				</VStack>
			</CardBody>
		</Card>
	);
};

export default ConnectPrompt;
