import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import { CopyIconButton, CopyValueButton } from '../../components/copy-button';
import { PanelRow, PanelRows } from '../../components/panel-parts';
import { fullTime, parseUtc } from '../../data/dates';
import { isFailureReason, isRecordsProblem } from '../../data/failure-reasons';
import { debugLogHref } from '../../data/log-link';
import type { FailureDetail, LogEntry, LogMessage, LogRow } from '../../data/types';

/**
 * What each stage of a send is called.
 *
 * @return Labels keyed by stage.
 */
const STAGES = (): Record< NonNullable< FailureDetail[ 'stage' ] >, string > => ( {
	build: __( 'Building the email', 'jetpack-send-pkg' ),
	request: __( 'Connecting', 'jetpack-send-pkg' ),
	response: __( 'Waiting for an answer', 'jetpack-send-pkg' ),
	result: __( 'Reading the answer', 'jetpack-send-pkg' ),
	host: __( 'Your host’s mail', 'jetpack-send-pkg' ),
} );

/**
 * The step a send stopped at. Older rows filed an answer the service refused under "Waiting for an
 * answer"; it had answered, so that reads as reading the answer.
 *
 * @param detail - The detail.
 * @return The stage.
 */
const stage = ( detail: FailureDetail ): NonNullable< FailureDetail[ 'stage' ] > =>
	detail.stage === 'response' && detail.http_status ? 'result' : ( detail.stage ?? 'result' );

/**
 * Whether the host's mail was the backup when it was sent: one value, or null when the row has
 * none (sent emails never needed it).
 *
 * @param detail - The detail.
 * @return The value, or null.
 */
function backupMail( detail: FailureDetail ): string | null {
	if ( detail.fallback === 'on' ) {
		return __( 'On', 'jetpack-send-pkg' );
	}
	return detail.fallback === 'off' ? __( 'Off', 'jetpack-send-pkg' ) : null;
}

/**
 * Seconds with one decimal, e.g. "0.4 s".
 *
 * @param ms - Milliseconds.
 * @return The time.
 */
const seconds = ( ms: number ) =>
	/* translators: %s: a number of seconds, e.g. 0.4. */
	sprintf( __( '%s s', 'jetpack-send-pkg' ), ( ms / 1000 ).toFixed( 1 ) );

/**
 * What happened to the send, in one technical line.
 *
 * @param row    - The log row.
 * @param detail - Its detail.
 * @return The line, or ''.
 */
function whatHappened( row: LogRow, detail: FailureDetail ): string {
	if ( detail.stage === 'build' || detail.builder?.feature ) {
		const feature = detail.builder?.feature;
		return feature
			? /* translators: %s: what Jetpack Send couldn't build, e.g. "embeds". */
				sprintf( __( 'Not built: %s', 'jetpack-send-pkg' ), feature )
			: __( 'Not built', 'jetpack-send-pkg' );
	}
	// The same line as the server's support report (Copy details), so both say the same thing.
	const { transport, timing } = detail;
	if ( transport ) {
		const what = transport.errno
			? /* translators: %d: a cURL error number, e.g. 28. */
				sprintf( __( 'cURL error %d', 'jetpack-send-pkg' ), transport.errno )
			: __( 'Network error', 'jetpack-send-pkg' );
		const after = timing?.ms
			? /* translators: 1: what went wrong, 2: how long it took, e.g. "30.0 s". */
				sprintf( __( '%1$s after %2$s', 'jetpack-send-pkg' ), what, seconds( timing.ms ) )
			: what;
		switch ( transport.phase ) {
			case 'dns':
				/* translators: %s: what went wrong, e.g. "cURL error 6 after 0.2 s". */
				return sprintf( __( '%s, finding the service', 'jetpack-send-pkg' ), after );
			case 'connect':
				/* translators: %s: what went wrong, e.g. "cURL error 7 after 0.2 s". */
				return sprintf( __( '%s, before sending', 'jetpack-send-pkg' ), after );
			case 'after_send':
				/* translators: %s: what went wrong, e.g. "cURL error 28 after 30.0 s". */
				return sprintf( __( '%s, after sending', 'jetpack-send-pkg' ), after );
			default:
				return after;
		}
	}
	const http = detail.http_status;
	if ( http ) {
		if ( http < 300 && row.status === 'sent' ) {
			return __( 'Accepted by the email service', 'jetpack-send-pkg' );
		}
		if ( detail.code === 'jetpack_send_unclear' ) {
			return sprintf(
				/* translators: %d: an HTTP status code, e.g. 202. */
				__( 'HTTP %d from the email service, but the answer couldn’t be read', 'jetpack-send-pkg' ),
				http
			);
		}
		return http >= 200 && http < 300
			? /* translators: %d: an HTTP status code, e.g. 202. */
				sprintf( __( 'Refused by the email service (HTTP %d)', 'jetpack-send-pkg' ), http )
			: /* translators: %d: an HTTP status code, e.g. 403. */
				sprintf( __( 'HTTP %d from the email service', 'jetpack-send-pkg' ), http );
	}
	if ( detail.host?.result === 'failed' ) {
		return __( 'Your host’s mail: failed', 'jetpack-send-pkg' );
	}
	return row.status === 'sent' && ( detail.request_id || row.request_id )
		? __( 'Accepted by the email service', 'jetpack-send-pkg' )
		: '';
}

/**
 * The host's part after a hand-off: accepted, failed with its reply, or no word back.
 *
 * @param host - `detail.host`.
 * @return The value.
 */
function hostResult( host: NonNullable< FailureDetail[ 'host' ] > ) {
	if ( host.result === 'accepted' ) {
		return __( 'Accepted', 'jetpack-send-pkg' );
	}
	if ( host.result === 'unknown' ) {
		return __( 'Didn’t report back', 'jetpack-send-pkg' );
	}
	const code =
		host.exception_code !== undefined && host.exception_code !== '' ? host.exception_code : null;
	return (
		<>
			{ host.message
				? /* translators: %s: the host mail's own error message. */
					sprintf( __( 'Failed: %s', 'jetpack-send-pkg' ), host.message )
				: __( 'Failed', 'jetpack-send-pkg' ) }
			{ code !== null &&
				/* translators: %s: the host mail's error code. */
				` ${ sprintf( __( '(code %s)', 'jetpack-send-pkg' ), String( code ) ) }` }
			{ host.reason && (
				<>
					{ ' ' }
					<code className="jetpack-send-code">{ host.reason }</code>
				</>
			) }
		</>
	);
}

/**
 * The domain check's verdicts when the email was sent, in one line.
 *
 * @param records - `detail.records`.
 * @return The line.
 */
function recordsLine( records: NonNullable< FailureDetail[ 'records' ] > ): string {
	const parts: string[] = [];
	if ( records.lockdown ) {
		/* translators: %s: the check's verdict, e.g. "failed". */
		parts.push( sprintf( __( 'Sending permission: %s', 'jetpack-send-pkg' ), records.lockdown ) );
	}
	if ( records.dkim ) {
		/* translators: %s: the check's verdict, e.g. "passed". */
		parts.push( sprintf( __( 'Signing (DKIM): %s', 'jetpack-send-pkg' ), records.dkim ) );
	}
	if ( records.spf ) {
		/* translators: %s: the check's verdict, e.g. "soft failed". */
		parts.push( sprintf( __( 'Sender list (SPF): %s', 'jetpack-send-pkg' ), records.spf ) );
	}
	const checked = records.checked_at ? fullTime( parseUtc( records.checked_at ) ) : '';
	if ( checked ) {
		/* translators: %s: date and time of the domain check. */
		parts.push( sprintf( __( 'checked %s', 'jetpack-send-pkg' ), checked ) );
	}
	return parts.join( ' · ' );
}

/**
 * What the log kept of the email.
 *
 * @param message - The stored message.
 * @return The value, or ''.
 */
function storedCopy( message: LogMessage | null ): string {
	if ( ! message?.kept ) {
		return '';
	}
	const kept = {
		full: __( 'Full', 'jetpack-send-pkg' ),
		off: __( 'Not kept (your site’s code turned it off)', 'jetpack-send-pkg' ),
		too_large: __( 'Too big to keep', 'jetpack-send-pkg' ),
	}[ message.kept ];
	return message.redacted
		? `${ kept } · ${ __( 'Sign-in links removed', 'jetpack-send-pkg' ) }`
		: kept;
}

export type TechnicalDetailsProps = {
	row: LogRow;
	/** The full entry, once loaded. */
	entry: LogEntry | null;
};

/**
 * Whether an email has anything for Technical details to show.
 *
 * @param row   - The row.
 * @param entry - The entry, if loaded.
 * @return True when there's a detail, a request ID or an error.
 */
export const hasTechnicalDetails = ( row: LogRow, entry: LogEntry | null ) =>
	!! ( entry?.detail || row.request_id || row.error );

/**
 * The facts behind a send, folded until asked for: what happened, what the service said, IDs,
 * timing, the host's mail and the records at the time. Technical words are allowed here.
 * Older rows without a stored detail show the raw error, as before.
 *
 * @param props       - Component props.
 * @param props.row   - The log row.
 * @param props.entry - The full entry, once loaded.
 * @return The section.
 */
const TechnicalDetails = ( { row, entry }: TechnicalDetailsProps ) => {
	const navigate = useNavigate();
	const detail = entry?.detail ?? null;
	const requestId = detail?.request_id || row.request_id;
	const messageId = detail?.message_id || detail?.result?.message_id;
	const serviceSaid = [ ...( detail?.service_errors ?? [] ), detail?.result?.reason ]
		.filter( Boolean )
		.join( '\n' );
	const smtp = [
		detail?.smtp?.code,
		detail?.smtp?.enhanced,
		detail?.smtp?.policy && `[${ detail.smtp.policy }]`,
	]
		.filter( Boolean )
		.join( ' ' );
	// Always Send's own reason, even when the host's mail failed too; older rows have none.
	const reason = isFailureReason( row.reason ) ? row.reason : null;
	const debugCount = entry?.debug_count ?? 0;
	const seeDebugEntries = useCallback(
		() => navigate( { href: debugLogHref( { email: row.id } ) } ),
		[ navigate, row.id ]
	);

	return (
		<CollapsibleCard.Root className="jetpack-send-panel__section">
			<CollapsibleCard.Header render={ <h3 /> }>
				<Text variant="heading-sm">{ __( 'Technical details', 'jetpack-send-pkg' ) }</Text>
			</CollapsibleCard.Header>
			{ /* Hidden-until-found keeps its top margin while closed, leaving a gap under the title. */ }
			<CollapsibleCard.Content hiddenUntilFound={ false }>
				<Stack direction="column" gap="lg">
					{ detail ? (
						<PanelRows>
							<PanelRow label={ __( 'What happened', 'jetpack-send-pkg' ) }>
								{ whatHappened( row, detail ) }
							</PanelRow>
							<PanelRow label={ __( 'Mail server code', 'jetpack-send-pkg' ) }>
								{ smtp && <code className="jetpack-send-code">{ smtp }</code> }
							</PanelRow>
							<PanelRow label={ __( 'Step', 'jetpack-send-pkg' ) }>
								{ detail.stage && row.status !== 'sent' ? STAGES()[ stage( detail ) ] : null }
							</PanelRow>
							<PanelRow label={ __( 'Reason code', 'jetpack-send-pkg' ) }>
								{ reason && <code className="jetpack-send-code">{ reason }</code> }
							</PanelRow>
							<PanelRow label={ __( 'Request ID', 'jetpack-send-pkg' ) } stacked>
								{ requestId && (
									<Stack direction="row" align="center" gap="xs" render={ <span /> }>
										<code className="jetpack-send-code">{ requestId }</code>
										<CopyIconButton
											text={ requestId }
											label={ __( 'Copy request ID', 'jetpack-send-pkg' ) }
										/>
									</Stack>
								) }
							</PanelRow>
							<PanelRow label={ __( 'Message ID', 'jetpack-send-pkg' ) } stacked>
								{ messageId && <code className="jetpack-send-code">{ messageId }</code> }
							</PanelRow>
							<PanelRow label={ __( 'Time taken', 'jetpack-send-pkg' ) }>
								{ detail.timing?.ms !== undefined ? seconds( detail.timing.ms ) : null }
							</PanelRow>
							<PanelRow label={ __( 'Timeout', 'jetpack-send-pkg' ) }>
								{ detail.timing?.timeout_s
									? /* translators: %d: a number of seconds. */
										sprintf( __( '%d s', 'jetpack-send-pkg' ), detail.timing.timeout_s )
									: null }
							</PanelRow>
							<PanelRow label={ __( 'Backup mail', 'jetpack-send-pkg' ) }>
								{ backupMail( detail ) }
							</PanelRow>
							<PanelRow
								label={ __( 'Your host’s mail', 'jetpack-send-pkg' ) }
								stacked={ detail.host?.result === 'failed' }
							>
								{ detail.host ? hostResult( detail.host ) : null }
							</PanelRow>
							<PanelRow label={ __( 'Your records when it was sent', 'jetpack-send-pkg' ) } stacked>
								{ detail.records && reason && isRecordsProblem( reason )
									? recordsLine( detail.records )
									: null }
							</PanelRow>
							<PanelRow label={ __( 'Stored copy', 'jetpack-send-pkg' ) }>
								{ storedCopy( entry?.message ?? null ) }
							</PanelRow>
						</PanelRows>
					) : (
						requestId && (
							<PanelRows>
								<PanelRow label={ __( 'Request ID', 'jetpack-send-pkg' ) } stacked>
									<code className="jetpack-send-code">{ requestId }</code>
								</PanelRow>
							</PanelRows>
						)
					) }
					{ detail && serviceSaid && (
						<Stack direction="column" gap="sm">
							<Text variant="body-md" className="jetpack-send-muted">
								{ __( 'The service said', 'jetpack-send-pkg' ) }
							</Text>
							<pre className="jetpack-send-email__raw">{ serviceSaid }</pre>
						</Stack>
					) }
					{ ! detail && row.error && <pre className="jetpack-send-email__raw">{ row.error }</pre> }
					{ entry?.support_text && (
						<Stack direction="row" gap="sm" wrap="wrap">
							<CopyValueButton
								text={ entry.support_text }
								label={ __( 'Copy details for support', 'jetpack-send-pkg' ) }
								announcement={ __( 'Details copied.', 'jetpack-send-pkg' ) }
							>
								{ __( 'Copy details', 'jetpack-send-pkg' ) }
							</CopyValueButton>
							{ debugCount > 0 && (
								<Button variant="minimal" tone="neutral" size="compact" onClick={ seeDebugEntries }>
									{ sprintf(
										/* translators: %d: number of debug log entries. */
										__( 'See debug entries (%d)', 'jetpack-send-pkg' ),
										debugCount
									) }
								</Button>
							) }
						</Stack>
					) }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default TechnicalDetails;
