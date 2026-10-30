import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Badge, Button, Notice, Stack, Text } from '@wordpress/ui';
import { saveOnboarding } from '../../../data/api';
import { SUPPORT_URL, offersSupport } from '../../../data/failure-reasons';
import { logEntryHref } from '../../../data/log-link';
import { sendStore } from '../../../data/store';
import { fromAddress, fromName } from '../setup-step';
import TaskCard from './task-card';
import { refusalText, testFailedTitle, testRecipient } from './use-test-email';
import type { TaskState } from './model';
import type { TestEmail } from './use-test-email';
import type { SendStatus } from '../../../data/types';

type Props = {
	status: SendStatus;
	state: TaskState;
	test: TestEmail;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
	/** Skip saves `closed`; busy while it does. */
	onSkip: () => void;
	skipping: boolean;
};

/**
 * Task 3, "Send yourself a test": locked until sending is on, then a test to the current user only.
 *
 * @param props              - Component props.
 * @param props.status       - Send status.
 * @param props.state        - Task state.
 * @param props.test         - The page's test email state and sender.
 * @param props.open         - Whether the card is open.
 * @param props.onOpenChange - Open or close the card.
 * @param props.onSkip       - Skip the test.
 * @param props.skipping     - The skip is saving.
 * @return The task card.
 */
const TestTask = ( { status, state, test, open, onOpenChange, onSkip, skipping }: Props ) => {
	const navigate = useNavigate();
	const { receiveStatus } = useDispatch( sendStore );
	const markedSeen = useRef( false );
	const domain = status.account?.domain ?? status.suggested_domain;
	const me = testRecipient( status );
	const siteName = status.settings.from_name || status.site_title;
	const locked = state === 'locked';

	// Seeing this card open is seeing the ready state, which also stops the wp-admin notice.
	useEffect( () => {
		if ( ! open || locked || markedSeen.current || status.onboarding.verified_seen_at ) {
			return;
		}
		markedSeen.current = true;
		saveOnboarding( { verified_seen: true } )
			.then( receiveStatus )
			.catch( () => undefined );
	}, [ open, locked, receiveStatus, status.onboarding.verified_seen_at ] );

	const { state: result, send } = test;
	const onSend = useCallback( () => void send(), [ send ] );
	const failedLogId = result.phase === 'failed' ? result.logId : '';
	const openFailure = useCallback(
		() => failedLogId && navigate( { href: logEntryHref( failedLogId ) } ),
		[ failedLogId, navigate ]
	);
	const rateLimited = result.phase === 'refused' && result.code === 'jetpack_send_rate_limited';
	const sending = result.phase === 'sending';

	let headerEnd = null;
	if ( locked ) {
		headerEnd = __( 'Once sending is on', 'jetpack-send-pkg' );
	} else if ( state === 'sent' ) {
		headerEnd = __( 'Sent', 'jetpack-send-pkg' );
	} else if ( state === 'auto' ) {
		headerEnd = __( 'Sent automatically', 'jetpack-send-pkg' );
	} else if ( state === 'skipped' ) {
		headerEnd = __( 'Skipped', 'jetpack-send-pkg' );
	} else if ( state === 'failed' ) {
		headerEnd = <Badge intent="high">{ __( 'Didn’t go out', 'jetpack-send-pkg' ) }</Badge>;
	}

	const canSend = state === 'todo' || state === 'failed';

	return (
		<TaskCard
			id="test"
			state={ state }
			title={ __( 'Send yourself a test', 'jetpack-send-pkg' ) }
			headerEnd={ headerEnd }
			subtitle={ __(
				'See a real email arrive from your own domain. Tests only go to you.',
				'jetpack-send-pkg'
			) }
			open={ open }
			onOpenChange={ onOpenChange }
		>
			{ locked && (
				<Text variant="body-lg" render={ <p /> } className="jetpack-send-setup__hint">
					{ status.can_enable
						? __( 'Available once sending is on.', 'jetpack-send-pkg' )
						: sprintf(
								/* translators: %s: the sending domain. */
								__( 'Available once %s is connected.', 'jetpack-send-pkg' ),
								domain
							) }
				</Text>
			) }

			{ ! locked && (
				<Stack direction="column" gap="lg" className="jetpack-send-setup__body">
					{ canSend && (
						<dl className="jetpack-send-setup__fields">
							<div className="jetpack-send-setup__field">
								<Text variant="body-md" render={ <dt /> } className="jetpack-send-setup__weak">
									{ __( 'To', 'jetpack-send-pkg' ) }
								</Text>
								<Text variant="body-lg" render={ <dd /> } className="jetpack-send-setup__wrap">
									{ me }
								</Text>
							</div>
							<div className="jetpack-send-setup__field">
								<Text variant="body-md" render={ <dt /> } className="jetpack-send-setup__weak">
									{ __( 'From', 'jetpack-send-pkg' ) }
								</Text>
								<Stack render={ <dd /> } direction="column" className="jetpack-send-setup__wrap">
									<Text variant="body-lg">{ fromName( status ) }</Text>
									<Text variant="body-md" className="jetpack-send-setup__weak">
										{ fromAddress( status ) }
									</Text>
								</Stack>
							</div>
							<div className="jetpack-send-setup__field">
								<Text variant="body-md" render={ <dt /> } className="jetpack-send-setup__weak">
									{ __( 'Subject', 'jetpack-send-pkg' ) }
								</Text>
								<Text variant="body-lg" render={ <dd /> } className="jetpack-send-setup__wrap">
									{ sprintf(
										/* translators: %s: the site's name. */
										__( 'Test email from %s', 'jetpack-send-pkg' ),
										siteName
									) }
								</Text>
							</div>
						</dl>
					) }

					{ state === 'sent' && (
						<Notice.Root intent="success">
							<Notice.Title>
								{ sprintf(
									/* translators: %s: the email address the test went to. */
									__( 'Sent to %s.', 'jetpack-send-pkg' ),
									me
								) }
							</Notice.Title>
							<Notice.Description>
								{ __(
									'It should arrive within a minute. Not there? Check spam.',
									'jetpack-send-pkg'
								) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ state === 'auto' && (
						<Text variant="body-lg" render={ <p /> }>
							{ sprintf(
								/* translators: 1: email address the test went to, 2: the sending domain. */
								__( 'We sent a test to %1$s as soon as %2$s connected.', 'jetpack-send-pkg' ),
								status.onboarding.test_to || me,
								domain
							) }
						</Text>
					) }

					{ state === 'skipped' && (
						<Text variant="body-lg" render={ <p /> } className="jetpack-send-setup__weak">
							{ __(
								'You skipped the test. You can send one any time from your dashboard.',
								'jetpack-send-pkg'
							) }
						</Text>
					) }

					{ result.phase === 'failed' && (
						<Notice.Root intent="error">
							<Notice.Title>{ testFailedTitle( result.kind ) }</Notice.Title>
							<Notice.Description>{ result.reason }</Notice.Description>
							{ offersSupport( result.kind, status.provisioner === 'local' ) && (
								<Notice.Actions>
									<Notice.ActionLink href={ SUPPORT_URL } openInNewTab>
										{ __( 'Contact support', 'jetpack-send-pkg' ) }
									</Notice.ActionLink>
								</Notice.Actions>
							) }
						</Notice.Root>
					) }

					{ result.phase === 'refused' && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ refusalText( result.code, result.message, domain ) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ canSend && (
						<Stack direction="row" align="center" gap="sm" wrap="wrap">
							<Button
								variant="solid"
								onClick={ onSend }
								disabled={ sending || rateLimited }
								loading={ sending }
								loadingAnnouncement={ __( 'Sending your test…', 'jetpack-send-pkg' ) }
							>
								{ state === 'failed'
									? __( 'Try again', 'jetpack-send-pkg' )
									: __( 'Send test email', 'jetpack-send-pkg' ) }
							</Button>
							{ state === 'failed' && failedLogId && (
								<Button variant="outline" tone="neutral" onClick={ openFailure }>
									{ __( 'See what went wrong', 'jetpack-send-pkg' ) }
								</Button>
							) }
							{ state === 'todo' && (
								<Button
									variant="minimal"
									tone="neutral"
									onClick={ onSkip }
									disabled={ sending }
									loading={ skipping }
								>
									{ __( 'Skip', 'jetpack-send-pkg' ) }
								</Button>
							) }
						</Stack>
					) }
				</Stack>
			) }
		</TaskCard>
	);
};

export default TestTask;
