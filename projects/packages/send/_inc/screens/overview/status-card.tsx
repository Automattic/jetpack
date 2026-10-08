import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { useSendAction } from '../../data/store';
import type { Account, EnableBlocker, SendStatus } from '../../data/types';

/**
 * Why the sending toggle is locked.
 *
 * @param blocker - The first enable blocker.
 * @return The explanation.
 */
function blockerMessage( blocker: EnableBlocker | undefined ): string {
	switch ( blocker ) {
		case 'dns_not_checked':
			return __( 'Add the DNS records below, then select Check DNS.', 'jetpack-send-pkg' );
		case 'domain_lockdown':
			return __( 'The Domain Lockdown record is missing or incorrect.', 'jetpack-send-pkg' );
		case 'sender_domain':
			return __(
				'Your domain needs an A or MX record before it can send email.',
				'jetpack-send-pkg'
			);
		default:
			return __( 'Set up Send first.', 'jetpack-send-pkg' );
	}
}

const StatusCard = ( { status, account }: { status: SendStatus; account: Account } ) => {
	const { run, busy, error } = useSendAction();
	const { settings } = status;
	const locked = ! settings.enabled && ! status.can_enable;
	const onToggle = useCallback( ( enabled: boolean ) => run( 'settings', { enabled } ), [ run ] );

	let help: string = __( 'WordPress is using its default mail.', 'jetpack-send-pkg' );
	if ( locked ) {
		help = blockerMessage( status.enable_blockers[ 0 ] );
	} else if ( settings.enabled ) {
		help = __( 'Emails from WordPress are going out through MailChannels.', 'jetpack-send-pkg' );
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Status', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<ToggleControl
						label={ __( 'Send emails through Jetpack Send', 'jetpack-send-pkg' ) }
						checked={ settings.enabled }
						disabled={ locked || !! busy }
						onChange={ onToggle }
						help={ help }
					/>
					<Text variant="body-md" render={ <p /> }>
						{ sprintf(
							/* translators: %s: the From email address. */
							__( 'Emails are sent from %s.', 'jetpack-send-pkg' ),
							`${ settings.from_local_part }@${ account.domain }`
						) }
					</Text>
					{ error && <ErrorNotice message={ error } /> }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default StatusCard;
