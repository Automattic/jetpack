import { __ } from '@wordpress/i18n';
import { Card, ButtonLink, Stack, Text } from '@wordpress/ui';

const ConnectCard = ( { connectUrl }: { connectUrl: string } ) => (
	<Card.Root>
		<Card.Header>
			<Card.Title>{ __( 'Connect Jetpack to set up Send', 'jetpack-send-pkg' ) }</Card.Title>
		</Card.Header>
		<Card.Content>
			<Stack direction="column" gap="md">
				<Text variant="body-md" render={ <p /> }>
					{ __(
						'Send delivers the emails your site sends, like password resets and order receipts, through a dedicated email service so they reach the inbox. It needs a Jetpack connection to create your sending account.',
						'jetpack-send-pkg'
					) }
				</Text>
				{ connectUrl ? (
					<div>
						<ButtonLink href={ connectUrl }>
							{ __( 'Connect Jetpack', 'jetpack-send-pkg' ) }
						</ButtonLink>
					</div>
				) : (
					<Text variant="body-md" render={ <p /> }>
						{ __( 'Install and connect the Jetpack plugin to use Send.', 'jetpack-send-pkg' ) }
					</Text>
				) }
			</Stack>
		</Card.Content>
	</Card.Root>
);

export default ConnectCard;
