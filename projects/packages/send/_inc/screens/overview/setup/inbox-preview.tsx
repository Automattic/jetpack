import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, Stack, Text } from '@wordpress/ui';
import Avatar from '../../../components/avatar';

type Props = {
	fromName: string;
	/** '' while there's no domain to show yet. */
	fromAddress: string;
	siteTitle: string;
	sending: boolean;
	fallback: boolean;
	/** Setup is finished: "How your emails look". */
	done: boolean;
	/** The From address's avatar. */
	avatarUrl?: string | null;
	/** The site icon, shown when the address has no avatar. */
	siteIconUrl?: string | null;
};

/**
 * What the sending note says.
 *
 * @param sending  - Sending is on.
 * @param fallback - The host takes over when an email can't go out.
 * @return The note.
 */
function sendingNote( sending: boolean, fallback: boolean ): string {
	if ( ! sending ) {
		return __( 'Your host keeps sending your site’s emails until then.', 'jetpack-send-pkg' );
	}
	return fallback
		? __(
				'If an email ever can’t go out this way, your host sends it instead.',
				'jetpack-send-pkg'
			)
		: __( 'Every email goes out this way.', 'jetpack-send-pkg' );
}

/**
 * The right column: a real email from the site, as it will arrive, and whether sending is on.
 *
 * @param props             - Component props.
 * @param props.fromName    - Sender name.
 * @param props.fromAddress - Sender address.
 * @param props.siteTitle   - Site title, for the subject.
 * @param props.sending     - Sending is on.
 * @param props.fallback    - The host takes over on failure.
 * @param props.done        - Setup is finished.
 * @param props.avatarUrl   - The sender's avatar.
 * @param props.siteIconUrl - The site icon.
 * @return The preview.
 */
const InboxPreview = ( {
	fromName,
	fromAddress,
	siteTitle,
	sending,
	fallback,
	done,
	avatarUrl,
	siteIconUrl,
}: Props ) => (
	<Stack render={ <aside /> } direction="column" gap="md" className="jetpack-send-setup__aside">
		<Card.Root className="jetpack-send-setup__preview">
			<Card.Header>
				<Card.Title render={ <h3 /> }>
					{ done
						? __( 'How your emails look', 'jetpack-send-pkg' )
						: __( 'How your emails will look', 'jetpack-send-pkg' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Stack direction="row" align="center" gap="sm">
						<Avatar size="md" name={ fromName } url={ avatarUrl } fallbackUrl={ siteIconUrl } />
						<Stack direction="column" className="jetpack-send-setup__grow">
							<Text variant="body-lg">{ fromName }</Text>
							{ fromAddress && (
								<Text
									variant="body-md"
									className="jetpack-send-setup__weak jetpack-send-setup__wrap"
								>
									{ fromAddress }
								</Text>
							) }
						</Stack>
					</Stack>
					<Stack direction="column">
						<Text variant="body-lg">
							{ sprintf(
								/* translators: %s: the site's title. Matches the subject WordPress uses for password resets. */
								__( '[%s] Password Reset', 'jetpack-send-pkg' ),
								siteTitle
							) }
						</Text>
						<Text variant="body-md" className="jetpack-send-setup__weak">
							{ __(
								'Someone has requested a password reset for the following account…',
								'jetpack-send-pkg'
							) }
						</Text>
					</Stack>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Text variant="body-lg">{ __( 'Sending', 'jetpack-send-pkg' ) }</Text>
						{ sending ? (
							<Badge intent="stable">{ __( 'On', 'jetpack-send-pkg' ) }</Badge>
						) : (
							<Badge intent="none">{ __( 'Not on yet', 'jetpack-send-pkg' ) }</Badge>
						) }
					</Stack>
					<Text variant="body-md" className="jetpack-send-setup__weak">
						{ sendingNote( sending, fallback ) }
					</Text>
				</Stack>
			</Card.Content>
		</Card.Root>
	</Stack>
);

export default InboxPreview;
