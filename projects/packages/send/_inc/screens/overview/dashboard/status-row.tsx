import { useMemo, useState } from '@wordpress/element';
import { Collapsible } from '@wordpress/ui';
import { useDnsPolling } from '../../../components/onboarding/use-dns-polling';
import DomainCard, { DomainRecords } from '../domain-card';
import { domainHealth, failingRows } from '../domain-state';
import SendingCard, { TestResultNotice } from '../sending-card';
import { displayRecords } from '../setup/records';
import { useTestEmail } from '../setup/use-test-email';
import UsageCard from '../usage-card';
import type { Account, SendStatus } from '../../../data/types';

type Props = {
	status: SendStatus;
	account: Account;
	/** The newest email, tests included; null when there is none. */
	lastEmailAt: string | null;
	/** The newest counted day, for when the log no longer has an email to time. */
	lastEmailDay?: string | null;
	/** The stats are still loading. */
	statsLoading: boolean;
	/** Offer "Send a test" on the Sending card (not while the empty Email activity card does). */
	offerTest: boolean;
};

/**
 * The top row: Sending, Domain and This month as equal cards, with the domain's records opening
 * full width beneath them.
 *
 * @param props              - Component props.
 * @param props.status       - Dashboard status.
 * @param props.account      - The sending account.
 * @param props.lastEmailAt  - When the last site email was logged.
 * @param props.lastEmailDay - The newest counted day.
 * @param props.statsLoading - The stats are still loading.
 * @param props.offerTest    - Offer "Send a test" on the Sending card.
 * @return The row.
 */
const StatusRow = ( {
	status,
	account,
	lastEmailAt,
	lastEmailDay = null,
	statsLoading,
	offerTest,
}: Props ) => {
	const domainOk = status.can_enable;
	// Opens on the failing record when there's a problem; it can still be folded away.
	const [ open, setOpen ] = useState( ! domainOk );
	const polling = useDnsPolling( { enabled: open || ! domainOk, mode: 'overview' } );
	const records = useMemo(
		() => displayRecords( status, account.dns_host ?? null ),
		[ status, account.dns_host ]
	);
	const health = domainHealth( domainOk, records, polling.lookup );
	const failing = failingRows( records, polling.lookup );
	const test = useTestEmail( account.domain, status.provisioner === 'local' );

	return (
		<Collapsible.Root
			open={ open }
			onOpenChange={ setOpen }
			className="jetpack-send-dashboard__status"
		>
			<div className="jetpack-send-dashboard__cards">
				<div className="jetpack-send-dashboard__cell">
					<SendingCard
						status={ status }
						lastEmailAt={ lastEmailAt }
						lastEmailDay={ lastEmailDay }
						lastEmailLoading={ statsLoading }
						health={ health }
						offerTest={ offerTest }
						test={ test }
					/>
				</div>
				<div className="jetpack-send-dashboard__cell">
					<DomainCard
						status={ status }
						account={ account }
						open={ open }
						health={ health }
						failing={ failing }
					/>
				</div>
				<div className="jetpack-send-dashboard__cell">
					<UsageCard hasLimit={ account.monthly_limit > 0 } />
				</div>
			</div>
			<TestResultNotice status={ status } account={ account } test={ test } />
			<Collapsible.Panel>
				<DomainRecords
					status={ status }
					account={ account }
					records={ records }
					health={ health }
					polling={ polling }
				/>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
};

export default StatusRow;
