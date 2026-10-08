import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Card, Stack, Text } from '@wordpress/ui';
import CopyButton from '../../components/copy-button';
import ErrorNotice from '../../components/error-notice';
import { useSendAction } from '../../data/store';
import type { Account, DnsCheck, DnsPurpose, SpfSuggestion } from '../../data/types';

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

const DnsCard = ( {
	account,
	spfSuggestion,
}: {
	account: Account;
	spfSuggestion: SpfSuggestion | null;
} ) => {
	const { run, busy, error } = useSendAction();
	const check = account.dns_check;
	const hasDkim = account.dns_records.some( record => record.purpose === 'dkim' );
	const onCheck = useCallback( () => run( 'check-dns' ), [ run ] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'DNS records', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text variant="body-md" render={ <p /> }>
						{ sprintf(
							/* translators: %s: sending domain. */
							__(
								'Add these TXT records at your DNS provider for %s, then check them. Changes can take a few minutes to appear.',
								'jetpack-send-pkg'
							),
							account.domain
						) }
					</Text>
					{ account.dns_records.map( record => {
						const suggestion = record.purpose === 'spf' ? spfSuggestion : null;
						const value = suggestion?.value ?? record.value;
						const hint = suggestion ? spfHint( suggestion.state ) : '';
						return (
							<div
								className="jetpack-send-dns__record"
								key={ `${ record.purpose }-${ record.name }` }
							>
								<Text variant="heading-sm">{ purposeLabel( record.purpose ) }</Text>
								<VerdictBadge verdict={ check?.[ CHECK_KEY[ record.purpose ] ] } />
								<Text variant="body-sm">
									{ sprintf(
										/* translators: 1: DNS record type, 2: host name. */
										__( '%1$s record on %2$s', 'jetpack-send-pkg' ),
										record.type,
										record.name
									) }
								</Text>
								<span />
								<span className="jetpack-send-dns__value">{ value }</span>
								<CopyButton text={ value } />
								{ hint && <Text variant="body-sm">{ hint }</Text> }
							</div>
						);
					} ) }
					{ ! hasDkim && (
						<Text variant="body-sm" render={ <p /> }>
							{ __(
								'DKIM is not available for this domain yet. Mail still sends, but signing helps it reach the inbox.',
								'jetpack-send-pkg'
							) }
						</Text>
					) }
					{ error && <ErrorNotice message={ error } /> }
					<div className="jetpack-send-dns__actions">
						<Button onClick={ onCheck } loading={ busy === 'check-dns' } disabled={ !! busy }>
							{ __( 'Check DNS', 'jetpack-send-pkg' ) }
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
			</Card.Content>
		</Card.Root>
	);
};

export default DnsCard;
