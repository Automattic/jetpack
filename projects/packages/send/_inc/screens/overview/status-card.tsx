import { ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog, Badge, Card, Notice, Stack, Text } from '@wordpress/ui';
import { errorMessage, postAction } from '../../data/api';
import { sendStore } from '../../data/store';
import type { Account, EnableBlocker, SendStatus } from '../../data/types';

/** Where sending stands: on and healthy, on with a DNS problem, ready to turn on, or blocked. */
type Phase = 'active' | 'attention' | 'ready' | 'blocked';

/**
 * Why sending can't be turned on, or why it needs attention.
 *
 * @param blocker - The first enable blocker.
 * @return The explanation.
 */
function blockerMessage( blocker: EnableBlocker | undefined ): string {
	switch ( blocker ) {
		case 'dns_not_checked':
			return __(
				'Add the DNS records below, then select Check DNS to verify them.',
				'jetpack-send-pkg'
			);
		case 'domain_lockdown':
			return __( 'The Domain Lockdown record is missing or incorrect.', 'jetpack-send-pkg' );
		case 'sender_domain':
			return __(
				'Your domain needs an A or MX record before it can send email.',
				'jetpack-send-pkg'
			);
		case 'spf':
			return __( 'The SPF record is missing or doesn’t include MailChannels.', 'jetpack-send-pkg' );
		case 'dkim':
			return __( 'The DKIM record is missing or incorrect.', 'jetpack-send-pkg' );
		default:
			return __( 'Set up Send first.', 'jetpack-send-pkg' );
	}
}

/**
 * Badge for the card header.
 *
 * @param props       - Component props.
 * @param props.phase - Sending phase.
 * @return The badge.
 */
function PhaseBadge( { phase }: { phase: Phase } ) {
	switch ( phase ) {
		case 'active':
			return <Badge intent="stable">{ __( 'Active', 'jetpack-send-pkg' ) }</Badge>;
		case 'attention':
			return <Badge intent="high">{ __( 'Needs attention', 'jetpack-send-pkg' ) }</Badge>;
		case 'ready':
			return <Badge intent="draft">{ __( 'Off', 'jetpack-send-pkg' ) }</Badge>;
		default:
			return <Badge intent="draft">{ __( 'Not ready', 'jetpack-send-pkg' ) }</Badge>;
	}
}

const StatusCard = ( { status, account }: { status: SendStatus; account: Account } ) => {
	const { receiveStatus } = useDispatch( sendStore );
	const { settings } = status;
	const [ dialog, setDialog ] = useState( { open: false, enable: true } );

	let phase: Phase = status.can_enable ? 'ready' : 'blocked';
	if ( settings.enabled ) {
		phase = status.can_enable ? 'active' : 'attention';
	}
	const from = `${ settings.from_local_part }@${ account.domain }`;
	const blocker = blockerMessage( status.enable_blockers[ 0 ] );

	// The toggle only asks; sending changes once the dialog is confirmed.
	const onToggle = useCallback( ( enable: boolean ) => setDialog( { open: true, enable } ), [] );
	const onOpenChange = useCallback(
		( open: boolean ) => setDialog( current => ( { ...current, open } ) ),
		[]
	);
	const onConfirm = useCallback( async () => {
		try {
			receiveStatus( await postAction( 'settings', { enabled: dialog.enable } ) );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
	}, [ dialog.enable, receiveStatus ] );

	let enableDescription: string = sprintf(
		/* translators: %s: sending domain. */
		__(
			'WordPress will send every email from %s, such as password resets, order receipts, and form notifications, through MailChannels. If MailChannels can’t deliver a message, your host’s mail sends it instead.',
			'jetpack-send-pkg'
		),
		account.domain
	);
	if ( ! settings.fallback ) {
		enableDescription = sprintf(
			/* translators: %s: sending domain. */
			__(
				'WordPress will send every email from %s, such as password resets, order receipts, and form notifications, through MailChannels. Fallback is off, so an email MailChannels can’t deliver won’t be sent.',
				'jetpack-send-pkg'
			),
			account.domain
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Status', 'jetpack-send-pkg' ) }</Card.Title>
					<PhaseBadge phase={ phase } />
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					{ phase === 'attention' && (
						<Notice.Root intent="error">
							<Notice.Title>
								{ __( 'A DNS record failed its last check', 'jetpack-send-pkg' ) }
							</Notice.Title>
							<Notice.Description>
								{ sprintf(
									/* translators: %s: what is wrong with the DNS records. */
									__(
										'%s MailChannels may reject your emails until it’s fixed.',
										'jetpack-send-pkg'
									),
									blocker
								) }
							</Notice.Description>
						</Notice.Root>
					) }
					<Text variant="body-md" render={ <p /> }>
						{ phase === 'active' &&
							sprintf(
								/* translators: %s: the From email address. */
								__(
									'Emails from WordPress are going out through MailChannels from %s.',
									'jetpack-send-pkg'
								),
								from
							) }
						{ phase === 'attention' &&
							sprintf(
								/* translators: %s: the From email address. */
								__( 'Sending is on, from %s.', 'jetpack-send-pkg' ),
								from
							) }
						{ phase === 'ready' &&
							sprintf(
								/* translators: %s: the From email address. */
								__(
									'Your DNS records are verified. Turn on Send to deliver email from %s through MailChannels.',
									'jetpack-send-pkg'
								),
								from
							) }
						{ phase === 'blocked' &&
							sprintf(
								/* translators: %s: what is left to do before Send can be turned on. */
								__(
									'Send can be turned on once your DNS records are verified. %s',
									'jetpack-send-pkg'
								),
								blocker
							) }
					</Text>
					<ToggleControl
						label={ __( 'Send emails through Jetpack Send', 'jetpack-send-pkg' ) }
						checked={ settings.enabled }
						disabled={ phase === 'blocked' }
						onChange={ onToggle }
					/>
				</Stack>
			</Card.Content>
			<AlertDialog.Root open={ dialog.open } onOpenChange={ onOpenChange } onConfirm={ onConfirm }>
				<AlertDialog.Popup
					title={
						dialog.enable
							? __( 'Turn on Jetpack Send?', 'jetpack-send-pkg' )
							: __( 'Turn off Jetpack Send?', 'jetpack-send-pkg' )
					}
					description={
						dialog.enable
							? enableDescription
							: __(
									'WordPress will go back to sending email through your host’s mail, which may be less reliable. Your DNS records and settings stay in place, so you can turn Send back on anytime.',
									'jetpack-send-pkg'
								)
					}
					confirmButtonText={
						dialog.enable
							? __( 'Turn on', 'jetpack-send-pkg' )
							: __( 'Turn off', 'jetpack-send-pkg' )
					}
				/>
			</AlertDialog.Root>
		</Card.Root>
	);
};

export default StatusCard;
