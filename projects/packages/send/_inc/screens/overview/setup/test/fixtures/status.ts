import type {
	DnsHost,
	DnsLookup,
	DnsLookupRecord,
	DnsRecord,
	SendStatus,
} from '../../../../../data/types';

export const RECORDS: DnsRecord[] = [
	{
		type: 'TXT',
		name: '_mailchannels.example.com',
		host: '_mailchannels',
		value: 'v=mc1 auth=abc',
		purpose: 'lockdown',
	},
	{
		type: 'TXT',
		name: 'jpsend._domainkey.example.com',
		host: 'jpsend._domainkey',
		value: 'v=DKIM1; k=rsa; p=abc',
		purpose: 'dkim',
	},
];

export const dnsHost = ( overrides: Partial< DnsHost > = {} ): DnsHost => ( {
	domain: 'example.com',
	apex: 'example.com',
	nameservers: [ 'ada.ns.cloudflare.com' ],
	provider: 'cloudflare',
	provider_source: 'ns',
	confidence: 'high',
	editable: true,
	reason: null,
	domain_connect: { host: null, supported: null },
	one_click: { supported: null },
	wpcom_dns: { supported: null },
	cloudflare_api: { supported: false },
	existing: { lockdown: null, spf: null, dkim: null },
	checked_at: '2026-10-18T10:00:00Z',
	...overrides,
} );

type Overrides = Omit< Partial< SendStatus >, 'settings' | 'onboarding' > & {
	settings?: Partial< SendStatus[ 'settings' ] >;
	onboarding?: Partial< SendStatus[ 'onboarding' ] >;
	withAccount?: boolean;
	host?: DnsHost | null;
};

export const makeStatus = ( {
	settings,
	onboarding,
	withAccount = true,
	host = dnsHost(),
	...rest
}: Overrides = {} ): SendStatus =>
	( {
		provisioner: 'wpcom',
		account: withAccount
			? {
					handle: 'jpsend3f9a',
					lockdown_auth_id: 'abc',
					domain: 'example.com',
					dkim_selector: 'jpsend',
					monthly_limit: 3000,
					dns_records: RECORDS,
					provider: 'wpcom',
					provisioned_at: new Date().toISOString(),
					dns_check: null,
					dns_host: host,
				}
			: null,
		settings: {
			enabled: false,
			from_name: '',
			from_local_part: 'owner',
			fallback: true,
			reply_to: '',
			auto_enable: true,
			...settings,
		},
		can_enable: false,
		enable_blockers: [ 'dns_not_checked' ],
		suggested_domain: 'example.com',
		site_title: 'Example Site',
		admin_email: 'owner@example.com',
		current_user_email: 'owner@example.com',
		connect_url: '',
		spf_suggestion: null,
		onboarding: {
			closed_at: null,
			step: null,
			dns_provider: null,
			test_to: 'owner@example.com',
			test_sent_at: null,
			auto_test_log_id: null,
			verified_seen_at: null,
			...onboarding,
		},
		// The server watches the domain from setup until it connects.
		next_check_at: withAccount ? '2026-10-18T10:15:00Z' : null,
		...rest,
	} ) as SendStatus;

export const lookupRow = ( overrides: Partial< DnsLookupRecord > ): DnsLookupRecord => ( {
	purpose: 'lockdown',
	name: '_mailchannels.example.com',
	host: '_mailchannels',
	type: 'TXT',
	state: 'not_found',
	expected: 'v=mc1 auth=abc',
	...overrides,
} );

export const lookup = ( records: DnsLookupRecord[] ): DnsLookup => ( {
	domain: 'example.com',
	checked_at: '2026-10-18T10:00:00Z',
	records,
	all_found: records.every( row => row.state === 'found' || row.state === 'verified' ),
	can_enable: false,
} );

export const VERIFIED = {
	can_enable: true,
	enable_blockers: [] as SendStatus[ 'enable_blockers' ],
	settings: { enabled: true },
};
