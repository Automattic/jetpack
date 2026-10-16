import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import ConnectCard from './connect-card';
import DnsCard from './dns-card';
import IntroBanner from './intro-banner';
import SetupCard from './setup-card';
import StatusCard from './status-card';
import TestEmailCard from './test-email-card';
import UsageCard from './usage-card';
import type { SendStatus } from '../../data/types';

const OverviewScreen = ( { status }: { status: SendStatus } ) => {
	const { account } = status;

	return (
		<>
			{ status.reset_warning && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ sprintf(
							/* translators: %s: error message from the email service. */
							__(
								'Send was reset, but its sending account could not be removed: %s',
								'jetpack-send-pkg'
							),
							status.reset_warning
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			{ status.provisioner === 'local' && (
				<Notice.Root intent="info">
					<Notice.Description>
						{ __(
							'Development provisioner active: Send creates MailChannels sub-accounts with the parent API key from wp-config.php.',
							'jetpack-send-pkg'
						) }
					</Notice.Description>
					{ !! account?.zone_records?.length && (
						<details className="jetpack-send-zone-records">
							<summary>
								{ __(
									'TXT records the Jetpack DNS zone must publish for these CNAMEs to resolve',
									'jetpack-send-pkg'
								) }
							</summary>
							<ul>
								{ account.zone_records.map( record => (
									<li key={ record.name }>
										<code>{ record.name }</code>
										<code>{ record.value }</code>
									</li>
								) ) }
							</ul>
						</details>
					) }
				</Notice.Root>
			) }
			<IntroBanner />
			{ ! account && ! status.provisioner && <ConnectCard connectUrl={ status.connect_url } /> }
			{ ! account && status.provisioner && (
				<SetupCard suggestedDomain={ status.suggested_domain } />
			) }
			{ account && (
				<>
					<StatusCard status={ status } account={ account } />
					<DnsCard account={ account } spfSuggestion={ status.spf_suggestion } />
					<UsageCard />
					<TestEmailCard defaultTo={ status.admin_email } />
				</>
			) }
		</>
	);
};

export default OverviewScreen;
