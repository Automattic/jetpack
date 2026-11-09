import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Badge, Button, Card, Notice, Skeleton, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { dayLabel, emailTime, parseUtc } from '../../data/dates';
import { SUPPORT_URL, offersSupport } from '../../data/failure-reasons';
import { SENDER_EDIT_HREF, logEntryHref } from '../../data/log-link';
import { useSendAction } from '../../data/store';
import { refusalText, testFailedTitle, testRecipient } from './setup/use-test-email';
import { fromAddress, fromName } from './setup-step';
import type { DomainHealth } from './domain-state';
import type { TestEmail } from './setup/use-test-email';
import type { Account, SendStatus } from '../../data/types';

type Phase = 'active' | 'paused';

type Props = {
	status: SendStatus;
	/** The newest email, tests included (ISO 8601), shown as "Last email 12 min ago"; null hides the line. */
	lastEmailAt?: string | null;
	/** The newest counted day (`Y-m-d`), shown as "Last email Oct 12" when the log has no email to time. */
	lastEmailDay?: string | null;
	/** The stats are still loading, so the last-email line shows a placeholder. */
	lastEmailLoading?: boolean;
	/** Where the domain stands, so the line can say whether something needs fixing. */
	health?: DomainHealth;
	/** Offer "Send a test" here; false while the empty Email activity card offers it instead. */
	offerTest?: boolean;
	/** The test sent from this card; its result shows under the row (`TestResultNotice`). */
	test: TestEmail;
};

/** The card title's id, for moving focus to it after setup finishes. */
export const SENDING_TITLE_ID = 'jetpack-send-sending-title';

/**
 * The header badge for each phase.
 *
 * @param props       - Component props.
 * @param props.phase - Where sending stands.
 * @return The badge.
 */
function PhaseBadge( { phase }: { phase: Phase } ) {
	return phase === 'paused' ? (
		<Badge intent="draft" className="jetpack-send-card__badge">
			{ __( 'Paused', 'jetpack-send-pkg' ) }
		</Badge>
	) : (
		<Badge intent="stable" className="jetpack-send-card__badge">
			{ __( 'On', 'jetpack-send-pkg' ) }
		</Badge>
	);
}

/**
 * Where sending stands once setup is done: on or paused. When the records fail, the Domain card
 * says what's wrong and this card only says what happens to emails meanwhile.
 *
 * @param props                  - Component props.
 * @param props.status           - Dashboard status.
 * @param props.lastEmailAt      - When the last site email was logged.
 * @param props.lastEmailDay     - The newest counted day.
 * @param props.lastEmailLoading - The stats are still loading.
 * @param props.health           - Where the domain stands.
 * @param props.offerTest        - Offer "Send a test" here.
 * @param props.test             - The test sent from this card.
 * @return The card.
 */
const SendingCard = ( {
	status,
	lastEmailAt = null,
	lastEmailDay = null,
	lastEmailLoading = false,
	health,
	offerTest = true,
	test,
}: Props ) => {
	const navigate = useNavigate();
	const { run, busy, error } = useSendAction();
	const { settings } = status;

	const phase: Phase = settings.enabled ? 'active' : 'paused';
	// The server refuses a test until the records pass, and the Domain card already says why.
	const canTest = offerTest && status.can_enable;

	const { state: testState, send: sendTest } = test;
	const onSendTest = useCallback( () => void sendTest(), [ sendTest ] );
	// Lands on Settings with the sender form already open.
	const toSettings = useCallback( () => navigate( { href: SENDER_EDIT_HREF } ), [ navigate ] );
	const resume = useCallback( () => run( 'settings', { enabled: true } ), [ run ] );

	// While all is well the card shows the sender, name over address, as setup does.
	let message = '';
	if ( phase === 'paused' ) {
		message = __( 'Your site’s emails go out through your host for now.', 'jetpack-send-pkg' );
	} else if ( ! status.can_enable && ( health === 'checking' || health === 'confirming' ) ) {
		// Nothing is known to be broken: the records are being checked or confirmed.
		message = settings.fallback
			? __( 'Your host is covering while we confirm your domain.', 'jetpack-send-pkg' )
			: __( 'Some emails may not go out while we confirm your domain.', 'jetpack-send-pkg' );
	} else if ( ! status.can_enable ) {
		message = settings.fallback
			? __( 'Your host is covering until the domain is fixed.', 'jetpack-send-pkg' )
			: __( 'Some emails may not go out until the domain is fixed.', 'jetpack-send-pkg' );
	}
	// A count only knows its hour, so an email the log no longer keeps shows as its day.
	let lastEmail = '';
	if ( lastEmailAt ) {
		lastEmail = emailTime( parseUtc( lastEmailAt ), Date.now() );
	} else if ( lastEmailDay ) {
		lastEmail = dayLabel( lastEmailDay );
	}

	return (
		<Card.Root className="jetpack-send-sending">
			<Card.Header>
				<Stack
					direction="row"
					justify="space-between"
					align="center"
					gap="sm"
					wrap="wrap"
					className="jetpack-send-card__heading"
				>
					<Card.Title id={ SENDING_TITLE_ID } tabIndex={ -1 } render={ <h2 /> }>
						{ __( 'Sending', 'jetpack-send-pkg' ) }
					</Card.Title>
					<PhaseBadge phase={ phase } />
				</Stack>
			</Card.Header>
			<Card.Content className="jetpack-send-card__body">
				<Stack direction="column" gap="md" className="jetpack-send-card__stack">
					<Stack direction="column" gap="xs">
						{ message ? (
							<Text variant="body-lg" render={ <p /> } className="jetpack-send-card__text">
								{ message }
							</Text>
						) : (
							<Stack direction="column">
								<Text variant="body-lg" className="jetpack-send-sending__name">
									{ fromName( status ) }
								</Text>
								<Text
									variant="body-md"
									className="jetpack-send-muted jetpack-send-sending__address"
								>
									{ fromAddress( status ) }
								</Text>
							</Stack>
						) }
						{ lastEmailLoading && (
							<Skeleton
								aria-hidden="true"
								className="jetpack-send-skeleton jetpack-send-skeleton--body-md"
							/>
						) }
						{ ! lastEmailLoading && lastEmail && (
							<Text
								variant="body-md"
								render={ <p /> }
								className="jetpack-send-card__text jetpack-send-muted"
							>
								{ sprintf(
									/* translators: %s: when, like "12 min ago", "Oct 17, 4:18 pm" or "Oct 12". */
									__( 'Last email %s', 'jetpack-send-pkg' ),
									lastEmail
								) }
							</Text>
						) }
					</Stack>
					{ error && <ErrorNotice message={ error } /> }
					<Stack
						direction="row"
						gap="md"
						align="center"
						wrap="wrap"
						className="jetpack-send-card__actions"
					>
						{ phase === 'paused' ? (
							<Button
								variant="outline"
								tone="neutral"
								size="compact"
								onClick={ resume }
								disabled={ ! status.can_enable }
								loading={ busy === 'settings' }
							>
								{ __( 'Turn sending back on', 'jetpack-send-pkg' ) }
							</Button>
						) : (
							canTest && (
								// The same button as the empty Email activity card's "Send a test".
								<Button
									variant="outline"
									tone="neutral"
									size="compact"
									onClick={ onSendTest }
									loading={ testState.phase === 'sending' }
									loadingAnnouncement={ __( 'Sending your test…', 'jetpack-send-pkg' ) }
								>
									{ __( 'Send a test', 'jetpack-send-pkg' ) }
								</Button>
							)
						) }
						<Button variant="minimal" tone="neutral" size="compact" onClick={ toSettings }>
							{ __( 'Change sender', 'jetpack-send-pkg' ) }
						</Button>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

type TestResultNoticeProps = {
	status: SendStatus;
	account: Account;
	test: TestEmail;
};

/**
 * The result of "Send a test" on the Sending card, full width under the top row so the cards
 * keep their size. It stays until it's closed or another test is sent.
 *
 * @param props         - Component props.
 * @param props.status  - Dashboard status.
 * @param props.account - The sending account.
 * @param props.test    - The test sent from the Sending card.
 * @return The notice, or null before a test.
 */
export const TestResultNotice = ( { status, account, test }: TestResultNoticeProps ) => {
	const navigate = useNavigate();
	const { state: testState, reset } = test;
	const testLogId =
		testState.phase === 'sent' || testState.phase === 'failed' ? testState.logId : '';
	const openTestLog = useCallback(
		() => testLogId && navigate( { href: logEntryHref( testLogId ) } ),
		[ navigate, testLogId ]
	);
	const testSupport =
		testState.phase === 'failed' && offersSupport( testState.kind, status.provisioner === 'local' );
	const close = (
		<Notice.CloseIconButton label={ __( 'Dismiss', 'jetpack-send-pkg' ) } onClick={ reset } />
	);

	if ( testState.phase === 'sent' ) {
		return (
			<Notice.Root intent="success">
				<Notice.Title>
					{ sprintf(
						/* translators: %s: the email address the test went to. */
						__( 'Sent to %s.', 'jetpack-send-pkg' ),
						testRecipient( status )
					) }
				</Notice.Title>
				<Notice.Description>
					{ __( 'It should arrive within a minute. Not there? Check spam.', 'jetpack-send-pkg' ) }
				</Notice.Description>
				{ testLogId && (
					<Notice.Actions>
						<Notice.ActionButton variant="outline" onClick={ openTestLog }>
							{ __( 'See it in your log', 'jetpack-send-pkg' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				) }
				{ close }
			</Notice.Root>
		);
	}
	if ( testState.phase === 'failed' ) {
		return (
			<Notice.Root intent="error">
				<Notice.Title>{ testFailedTitle( testState.kind ) }</Notice.Title>
				<Notice.Description>{ testState.reason }</Notice.Description>
				{ ( testLogId || testSupport ) && (
					<Notice.Actions>
						{ testLogId && (
							<Notice.ActionButton variant="outline" onClick={ openTestLog }>
								{ __( 'See it in your log', 'jetpack-send-pkg' ) }
							</Notice.ActionButton>
						) }
						{ testSupport && (
							<Notice.ActionLink href={ SUPPORT_URL } openInNewTab>
								{ __( 'Contact support', 'jetpack-send-pkg' ) }
							</Notice.ActionLink>
						) }
					</Notice.Actions>
				) }
				{ close }
			</Notice.Root>
		);
	}
	if ( testState.phase === 'refused' ) {
		return (
			<Notice.Root intent="warning">
				<Notice.Description>
					{ refusalText( testState.code, testState.message, account.domain ) }
				</Notice.Description>
				{ close }
			</Notice.Root>
		);
	}
	return null;
};

export default SendingCard;
