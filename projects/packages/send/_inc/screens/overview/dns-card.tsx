import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import CopyButton from '../../components/copy-button';
import ErrorNotice from '../../components/error-notice';
import { useSendAction } from '../../data/store';
import type { Account, DnsCheck, DnsPurpose, DnsRecord, SpfSuggestion } from '../../data/types';

const CHECK_KEY: Record< DnsPurpose, keyof DnsCheck > = {
	lockdown: 'domain_lockdown',
	spf: 'spf',
	dkim: 'dkim',
};

/**
 * Label for a record's purpose.
 *
 * @param purpose - Record purpose.
 * @return The label.
 */
function purposeLabel( purpose: DnsPurpose ): string {
	if ( purpose === 'lockdown' ) {
		return __( 'Domain Lockdown', 'jetpack-send-pkg' );
	}
	return purpose === 'spf' ? __( 'SPF', 'jetpack-send-pkg' ) : __( 'DKIM', 'jetpack-send-pkg' );
}

/**
 * Badge for a check verdict.
 *
 * @param props         - Component props.
 * @param props.verdict - Verdict, or undefined when not checked.
 * @return The badge.
 */
function VerdictBadge( { verdict }: { verdict?: string } ) {
	if ( ! verdict ) {
		return <Badge intent="draft">{ __( 'Not checked', 'jetpack-send-pkg' ) }</Badge>;
	}
	if ( verdict === 'passed' ) {
		return <Badge intent="stable">{ __( 'Passed', 'jetpack-send-pkg' ) }</Badge>;
	}
	if ( verdict === 'unknown' ) {
		return <Badge intent="draft">{ __( 'Unknown', 'jetpack-send-pkg' ) }</Badge>;
	}
	return <Badge intent="high">{ __( 'Failed', 'jetpack-send-pkg' ) }</Badge>;
}

/**
 * Badge summarizing every record for the card header.
 *
 * @param props          - Component props.
 * @param props.checked  - Whether DNS has been checked at least once.
 * @param props.complete - Whether every record passed.
 * @return The badge.
 */
function CardStatusBadge( { checked, complete }: { checked: boolean; complete: boolean } ) {
	if ( complete ) {
		return <Badge intent="stable">{ __( 'Verified', 'jetpack-send-pkg' ) }</Badge>;
	}
	if ( ! checked ) {
		return <Badge intent="draft">{ __( 'Not checked', 'jetpack-send-pkg' ) }</Badge>;
	}
	return <Badge intent="medium">{ __( 'Action needed', 'jetpack-send-pkg' ) }</Badge>;
}

/**
 * Hint under the SPF record for the suggestion's state.
 *
 * @param state - Suggestion state.
 * @return The hint, or '' when none applies.
 */
function spfHint( state: SpfSuggestion[ 'state' ] ): string {
	if ( state === 'merge' ) {
		return __(
			'Your domain already has an SPF record. Replace it with this version, which adds MailChannels.',
			'jetpack-send-pkg'
		);
	}
	return state === 'present'
		? __( 'Your SPF record already includes MailChannels.', 'jetpack-send-pkg' )
		: '';
}

type RecordRowProps = {
	record: DnsRecord;
	value: string;
	verdict?: string;
	hint: string;
	/** Passed records collapse to one line while other records still need work. */
	compact: boolean;
};

const RecordRow = ( { record, value, verdict, hint, compact }: RecordRowProps ) => {
	const label = purposeLabel( record.purpose );
	const optional = !! record.optional;

	return (
		<div className={ `jetpack-send-dns__record${ compact ? ' is-compact' : '' }` }>
			<div className="jetpack-send-dns__record-header">
				<span className="jetpack-send-dns__record-title">
					<Text variant="heading-sm">{ label }</Text>
					<span className="jetpack-send-dns__type">{ record.type }</span>
				</span>
				{ optional && verdict !== 'passed' ? (
					<Badge intent="draft">{ __( 'Optional', 'jetpack-send-pkg' ) }</Badge>
				) : (
					<VerdictBadge verdict={ verdict } />
				) }
			</div>
			{ ! compact && (
				<>
					<dl className="jetpack-send-dns__fields">
						<div className="jetpack-send-dns__field">
							<dt>{ __( 'Name', 'jetpack-send-pkg' ) }</dt>
							<dd>
								<code className="jetpack-send-dns__value">{ record.name }</code>
								<CopyButton
									text={ record.name }
									/* translators: %s: DNS record label, such as DKIM. */
									label={ sprintf( __( 'Copy %s record name', 'jetpack-send-pkg' ), label ) }
								/>
							</dd>
						</div>
						<div className="jetpack-send-dns__field">
							<dt>
								{ record.type === 'CNAME'
									? __( 'Points to', 'jetpack-send-pkg' )
									: __( 'Value', 'jetpack-send-pkg' ) }
							</dt>
							<dd>
								<code className="jetpack-send-dns__value">{ value }</code>
								<CopyButton
									text={ value }
									/* translators: %s: DNS record label, such as DKIM. */
									label={ sprintf( __( 'Copy %s record value', 'jetpack-send-pkg' ), label ) }
								/>
							</dd>
						</div>
					</dl>
					{ hint && <Text variant="body-sm">{ hint }</Text> }
					{ ! optional && verdict && verdict !== 'passed' && verdict !== 'unknown' && (
						<Text variant="body-sm" className="jetpack-send-dns__problem">
							{ __(
								'Not found yet. If you just added it, wait a few minutes and check again.',
								'jetpack-send-pkg'
							) }
						</Text>
					) }
				</>
			) }
		</div>
	);
};

const DnsCard = ( {
	account,
	spfSuggestion,
}: {
	account: Account;
	spfSuggestion: SpfSuggestion | null;
} ) => {
	const { run, busy, error } = useSendAction();
	const check = account.dns_check;
	const verdictOf = ( record: DnsRecord ) => check?.[ CHECK_KEY[ record.purpose ] ];
	const hasDkim = account.dns_records.some( record => record.purpose === 'dkim' );
	// Mirrors the server gate: SPF is only optional while a DKIM record can carry DMARC.
	const records = account.dns_records.map( record =>
		record.purpose === 'spf' && ! hasDkim ? { ...record, optional: false } : record
	);
	const required = records.filter( record => ! record.optional );
	const optional = records.filter( record => record.optional );
	const passedCount = required.filter( record => verdictOf( record ) === 'passed' ).length;
	const complete = required.length > 0 && passedCount === required.length;

	const renderRow = ( record: DnsRecord ) => {
		const suggestion = record.purpose === 'spf' ? spfSuggestion : null;
		const verdict = verdictOf( record );
		return (
			<RecordRow
				key={ `${ record.purpose }-${ record.name }` }
				record={ record }
				value={ suggestion?.value ?? record.value }
				verdict={ verdict }
				hint={ suggestion ? spfHint( suggestion.state ) : '' }
				compact={ ! complete && verdict === 'passed' }
			/>
		);
	};

	// Collapse once everything passes, including right after a successful check.
	const [ open, setOpen ] = useState( ! complete );
	useEffect( () => setOpen( ! complete ), [ complete ] );

	const onCheck = useCallback( () => run( 'check-dns' ), [ run ] );

	return (
		<CollapsibleCard.Root open={ open } onOpenChange={ setOpen }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'DNS records', 'jetpack-send-pkg' ) }</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<Stack direction="row" align="center" gap="sm">
							{ check && (
								<Text variant="body-sm" className="jetpack-send-dns__count">
									{ sprintf(
										/* translators: 1: records that passed, 2: total records. */
										__( '%1$d of %2$d records passed', 'jetpack-send-pkg' ),
										passedCount,
										required.length
									) }
								</Text>
							) }
							<CardStatusBadge checked={ !! check } complete={ complete } />
						</Stack>
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					<Text variant="body-md" render={ <p /> }>
						{ complete
							? sprintf(
									/* translators: %s: sending domain. */
									__(
										'These records are verified for %s. Keep them at your DNS provider so Send can keep delivering.',
										'jetpack-send-pkg'
									),
									account.domain
								)
							: sprintf(
									/* translators: %s: sending domain. */
									__(
										'Add these records at your DNS provider for %s, then check them. Changes can take a few minutes to appear.',
										'jetpack-send-pkg'
									),
									account.domain
								) }
					</Text>
					<div className="jetpack-send-dns__records">{ required.map( renderRow ) }</div>
					{ ! hasDkim && (
						<Text variant="body-sm" render={ <p /> }>
							{ __(
								'DKIM isn’t available for this domain yet, so the SPF record is required instead.',
								'jetpack-send-pkg'
							) }
						</Text>
					) }
					{ optional.length > 0 && (
						<Stack direction="column" gap="xs">
							<Text variant="heading-sm">{ __( 'Optional', 'jetpack-send-pkg' ) }</Text>
							<Text variant="body-sm" render={ <p /> } className="jetpack-send-dns__optional-intro">
								{ __(
									'Send’s DKIM signature already proves your emails are legitimate. Add SPF too if you send more than 5,000 emails a day to Gmail addresses.',
									'jetpack-send-pkg'
								) }
							</Text>
							<div className="jetpack-send-dns__records">{ optional.map( renderRow ) }</div>
						</Stack>
					) }
					{ error && <ErrorNotice message={ error } /> }
					<div className="jetpack-send-dns__actions">
						<Button
							variant={ complete ? 'outline' : 'solid' }
							onClick={ onCheck }
							loading={ busy === 'check-dns' }
							disabled={ !! busy }
						>
							{ complete
								? __( 'Check again', 'jetpack-send-pkg' )
								: __( 'Check DNS', 'jetpack-send-pkg' ) }
						</Button>
						{ check && (
							<Text variant="body-sm">
								{ sprintf(
									/* translators: %s: date and time. */
									__( 'Last checked %s', 'jetpack-send-pkg' ),
									new Date( check.checked_at ).toLocaleString()
								) }
							</Text>
						) }
					</div>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default DnsCard;
