import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Badge, Button, Card, Collapsible, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { getProvider } from '../../components/onboarding/providers';
import CheckLine from './check-line';
import { domainBadge, recordsAdvice, waitingCopy } from './domain-state';
import RecordRows from './setup/record-rows';
import WaitingNote from './setup/waiting-note';
import { providerName, providerSlug } from './setup-step';
import type { DomainHealth } from './domain-state';
import type { DisplayRecord } from './setup/record-rows';
import type { DnsPollingState } from '../../components/onboarding/use-dns-polling';
import type { Account, DnsLookupRecord, DnsPurpose, SendStatus } from '../../data/types';

type Props = {
	status: SendStatus;
	account: Account;
	/** Whether the records panel under the cards is open. */
	open: boolean;
	health: DomainHealth;
	/** The records that need something done, for the badge's words. */
	failing: DnsLookupRecord[];
};

/**
 * The sending domain, a badge saying where it stands, and the switch for the records panel.
 * Must sit inside the `Collapsible.Root` that holds that panel.
 *
 * @param props         - Component props.
 * @param props.status  - Dashboard status.
 * @param props.account - The sending account.
 * @param props.open    - Whether the records panel is open.
 * @param props.health  - Where the domain stands.
 * @param props.failing - Records that need something done.
 * @return The card.
 */
const DomainCard = ( { status, account, open, health, failing }: Props ) => {
	const { settings } = status;
	const badge = domainBadge( health, failing );
	return (
		<Card.Root className="jetpack-send-domain">
			<Card.Header>
				<Stack
					direction="row"
					justify="space-between"
					align="center"
					gap="sm"
					wrap="wrap"
					className="jetpack-send-card__heading"
				>
					<Card.Title render={ <h2 /> }>{ __( 'Domain', 'jetpack-send-pkg' ) }</Card.Title>
					<Badge intent={ badge.intent } className="jetpack-send-card__badge">
						{ badge.label }
					</Badge>
				</Stack>
			</Card.Header>
			<Card.Content className="jetpack-send-card__body">
				<Stack direction="column" gap="md" align="start" className="jetpack-send-card__stack">
					<Stack direction="column" gap="xs">
						<Text
							variant="body-lg"
							render={ <p /> }
							className="jetpack-send-card__text jetpack-send-domain__name"
						>
							{ account.domain }
						</Text>
						{ /* While the records fail, the Sending card already says whether the host covers. */ }
						{ settings.enabled && health === 'connected' && (
							<Text
								variant="body-md"
								render={ <p /> }
								className="jetpack-send-card__text jetpack-send-muted"
							>
								{ settings.fallback
									? __( 'Backup: your host’s mail is on', 'jetpack-send-pkg' )
									: __( 'Backup: your host’s mail is off', 'jetpack-send-pkg' ) }
							</Text>
						) }
					</Stack>
					{ /* The same show/hide toggle as Settings' technical details and the Log preview's. */ }
					<Collapsible.Trigger
						render={
							<Button
								variant="minimal"
								tone="neutral"
								size="compact"
								className="jetpack-send-card__actions"
							/>
						}
					>
						<Button.Icon icon={ open ? chevronUp : chevronDown } />
						{ __( 'Records', 'jetpack-send-pkg' ) }
					</Collapsible.Trigger>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

type RecordsProps = {
	status: SendStatus;
	account: Account;
	/** The records in display order, merged into ones the domain already has. */
	records: DisplayRecord[];
	health: DomainHealth;
	polling: DnsPollingState;
};

/**
 * The records with their values to copy and a badge each, under one line saying what changed.
 * Full width under the cards, so the values have room.
 *
 * @param props         - Component props.
 * @param props.status  - Dashboard status.
 * @param props.account - The sending account.
 * @param props.records - Records in display order.
 * @param props.health  - Where the domain stands.
 * @param props.polling - The live record lookup.
 * @return The card.
 */
export const DomainRecords = ( { status, account, records, health, polling }: RecordsProps ) => {
	const connected = health === 'connected';
	const name = providerName( status ) ?? '';
	const advice = recordsAdvice( {
		canEnable: status.can_enable,
		records,
		lookup: polling.lookup,
		domain: account.domain,
		provider: name,
	} );
	const rows: Partial< Record< DnsPurpose, DnsLookupRecord > > = {};
	records.forEach( record => {
		const row = polling.lookup?.records.find( item => item.purpose === record.purpose );
		// The records passed, so until a lookup says otherwise each one is done.
		rows[ record.purpose ] =
			connected && ( ! row || row.state === 'found' )
				? {
						purpose: record.purpose,
						name: record.name,
						host: record.host ?? '',
						type: record.type,
						state: 'verified',
						expected: '',
					}
				: row;
	} );
	const lastCheckedAt =
		polling.lastCheckedAt ??
		( account.dns_check?.checked_at ? new Date( account.dns_check.checked_at ) : null );
	const waiting = waitingCopy( health, status.settings.enabled );

	return (
		<Card.Root className="jetpack-send-records">
			<Card.Header>
				<Card.Title render={ <h2 /> }>
					{ sprintf(
						/* translators: %s: domain name. */
						__( 'Records for %s', 'jetpack-send-pkg' ),
						account.domain
					) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="sm">
					{ advice.summary && (
						<Text variant="body-lg" render={ <p /> } className="jetpack-send-card__text">
							{ advice.summary }
						</Text>
					) }
					<RecordRows
						records={ records }
						provider={ getProvider( providerSlug( status ) ) }
						rows={ rows }
						onCopy={ polling.nudge }
						notes={ advice.notes }
						afterSetup
					/>
					{ connected ? (
						<CheckLine
							lastCheckedAt={ lastCheckedAt }
							checking={ polling.checking }
							onCheckNow={ polling.checkNow }
						/>
					) : (
						<WaitingNote
							lead={ waiting.lead }
							detail={ waiting.detail }
							lastCheckedAt={ lastCheckedAt }
							checking={ polling.checking }
							onCheckNow={ polling.checkNow }
						/>
					) }
					{ polling.error && <ErrorNotice message={ polling.error } /> }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default DomainCard;
