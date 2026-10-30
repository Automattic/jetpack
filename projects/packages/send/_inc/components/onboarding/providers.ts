import { __, sprintf } from '@wordpress/i18n';
import providersData from '../../data/providers.json';
import type { DnsRecord, ProviderSlug } from '../../data/types';

/** How a provider's host field wants the name: relative with `@` for the root, or relative with blank. */
export type HostFieldRule = 'relative-at' | 'relative-blank';

/** One tip for a provider, shown under the records. */
export type ProviderQuirk = {
	text: string;
	/** Only about the root record, so skipped unless a root record is shown. */
	rootOnly?: boolean;
	/** Only about long values, so skipped unless a long TXT value is shown. */
	longOnly?: boolean;
	/** Only about CNAME records (Cloudflare's proxy switch), so skipped for TXT records. */
	cnameOnly?: boolean;
};

/** A per-record step: text, or text that only applies to CNAME records. */
export type ProviderRecordStep = string | { text: string; cnameOnly: true };

/** TXT strings longer than this have to be split into quoted pieces. */
export const LONG_TXT_LENGTH = 255;

/** A provider's steps: once at the start, once per record, once at the end. */
export type ProviderSteps = {
	start: string[];
	/** Filled per record with `{type}`, `{host}`, `{value}` and `{valueLabel}`. */
	record: ProviderRecordStep[];
	end?: string[];
};

/** Data from `_inc/data/providers.json`. */
type ProviderData = {
	slug: ProviderSlug;
	name: string;
	rank: number;
	nsPatterns: string[];
	/** `substring` matches anywhere in the nameserver; default is a suffix match. */
	nsMatch?: 'suffix' | 'substring';
	dnsPageUrlTemplate: string | null;
	/** Only link to `dnsPageUrlTemplate` when true. */
	dnsPageUrlVerified: boolean;
	domainConnect: boolean | 'unknown';
	domainConnectHost?: string;
	hostFieldRule: HostFieldRule;
	/** The provider's own field names, kept as they appear in its dashboard. */
	fieldLabels: {
		type: string;
		host: string;
		valueCname: string;
		valueTxt: string;
		ttl: string;
	};
};

/** A provider: its data plus translated tips and steps. */
export type Provider = ProviderData & {
	/** User-facing tips, in priority order. */
	quirks: ProviderQuirk[];
	steps: ProviderSteps;
};

type ProviderCopy = { name?: string; quirks: ProviderQuirk[]; steps: ProviderSteps };

/**
 * Translated tips and steps by slug. Keep `{domain}`, `{type}`, `{host}`, `{value}` and
 * `{valueLabel}` as they are when translating; they're filled in later.
 *
 * @return Copy by slug.
 */
function providerCopy(): Record< string, ProviderCopy > {
	return {
		cloudflare: {
			quirks: [
				{
					text: __(
						'Leave Proxy status as DNS only (grey cloud) for both records.',
						'jetpack-send-pkg'
					),
					cnameOnly: true,
				},
				{
					text: __(
						'The Name field adds your domain for you, so enter just the name shown here.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'Leave TTL on Auto.', 'jetpack-send-pkg' ) },
				{ text: __( 'TXT records are always DNS only.', 'jetpack-send-pkg' ) },
			],
			steps: {
				start: [
					__( 'Open the Cloudflare dashboard and pick {domain}.', 'jetpack-send-pkg' ),
					__( 'Go to DNS, then Records.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add record.', 'jetpack-send-pkg' ),
					__( 'Type: {type}. Name: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					{
						text: __( 'Set Proxy status to DNS only (grey cloud).', 'jetpack-send-pkg' ),
						cnameOnly: true,
					},
					__( 'Click Save.', 'jetpack-send-pkg' ),
				],
			},
		},
		bluehost: {
			quirks: [
				{
					text: __(
						'Use the Bluehost Portal DNS tab. Older guides point to cPanel Zone Editor; that path is outdated.',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'Enter only the part before your domain in the host field. Use @ for the root.',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'A CNAME can’t share a name with any other record. Delete an old TXT at the same name first.',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__( 'Log in to the Bluehost Portal.', 'jetpack-send-pkg' ),
					__( 'Open Domains and pick {domain}.', 'jetpack-send-pkg' ),
					__( 'Open the DNS tab and find Manage Advanced DNS Records.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click + Add record and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Host record: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Save.', 'jetpack-send-pkg' ),
				],
			},
		},
		hostinger: {
			quirks: [
				{
					text: __(
						'For record 2, enter the whole name, jpsend._domainkey, not just jpsend.',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'You can only add records here if your domain points to Hostinger (dns-parking.com).',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'The Name field adds your domain for you. Use @ for the root.',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__( 'Log in to hPanel.', 'jetpack-send-pkg' ),
					__( 'Go to Domains and pick {domain}.', 'jetpack-send-pkg' ),
					__( 'Open DNS / Nameservers, then DNS records.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Choose {type}. Name: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Add record.', 'jetpack-send-pkg' ),
				],
			},
		},
		godaddy: {
			quirks: [
				{
					text: __(
						'The Name field adds your domain for you. Use @ for the root.',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'You can only add records at GoDaddy if your domain points to GoDaddy.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'Default TTL is 1 hour; leave it.', 'jetpack-send-pkg' ) },
			],
			steps: {
				start: [
					__( 'Log in to GoDaddy and open your Domain Portfolio.', 'jetpack-send-pkg' ),
					__( 'Pick {domain} and open the DNS tab.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add New Record and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Name: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Save.', 'jetpack-send-pkg' ),
				],
			},
		},
		hostgator: {
			quirks: [
				{
					text: __(
						'Use the Customer Portal. cPanel Zone Editor guides are outdated.',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'Enter only the part before your domain. Use @ for the root.',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__( 'Log in to the HostGator Customer Portal.', 'jetpack-send-pkg' ),
					__( 'Open Domains and pick {domain}.', 'jetpack-send-pkg' ),
					__(
						'Open the DNS tab (or Advanced Tools, then Manage Advanced DNS Records).',
						'jetpack-send-pkg'
					),
				],
				record: [
					__( 'Click Add Record and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Host record: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Save.', 'jetpack-send-pkg' ),
				],
			},
		},
		siteground: {
			quirks: [
				{
					text: __(
						'If a record with the same name is already there, delete it first, then add this one.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'Only works if your domain points to SiteGround.', 'jetpack-send-pkg' ) },
				{
					text: __(
						'The Name field adds your domain for you. Leave it blank for the root.',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'A CNAME can’t be added to a name that already has another record, such as a TXT. Delete it first.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'CNAME targets must be a hostname, not an IP.', 'jetpack-send-pkg' ) },
			],
			steps: {
				start: [
					__( 'Log in and open Site Tools for your site.', 'jetpack-send-pkg' ),
					__( 'Go to Domain, then DNS Zone Editor.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Under Create New Record, pick the {type} tab.', 'jetpack-send-pkg' ),
					__( 'Name: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Create.', 'jetpack-send-pkg' ),
				],
			},
		},
		ionos: {
			quirks: [
				{ text: __( 'Use @ in Host name for the root.', 'jetpack-send-pkg' ), rootOnly: true },
				{
					text: __(
						'Changes are live at IONOS at once; up to an hour elsewhere.',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__( 'Log in to IONOS and open Domains & SSL.', 'jetpack-send-pkg' ),
					__( 'Click the gear icon next to {domain} and choose DNS.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add Record and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Host name: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Save.', 'jetpack-send-pkg' ),
				],
			},
		},
		namecheap: {
			quirks: [
				{ text: __( 'Click Save all changes or nothing is saved.', 'jetpack-send-pkg' ) },
				{
					text: __(
						'Host records only appear on BasicDNS, PremiumDNS or FreeDNS (registrar-servers.com).',
						'jetpack-send-pkg'
					),
				},
				{
					text: __(
						'If your domain points to namecheaphosting.com, add the records in cPanel Zone Editor instead.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'Host: @ for the root. Never include the domain.', 'jetpack-send-pkg' ) },
			],
			steps: {
				start: [
					__( 'Log in to Namecheap and open Domain List.', 'jetpack-send-pkg' ),
					__( 'Click Manage next to {domain}.', 'jetpack-send-pkg' ),
					__( 'Open the Advanced DNS tab.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add new record and choose {type} Record.', 'jetpack-send-pkg' ),
					__( 'Host: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click the green tick.', 'jetpack-send-pkg' ),
				],
				end: [ __( 'Click Save all changes.', 'jetpack-send-pkg' ) ],
			},
		},
		ovhcloud: {
			quirks: [
				{ text: __( 'Leave Subdomain blank for the root.', 'jetpack-send-pkg' ), rootOnly: true },
				{ text: __( 'Changes can take 4 to 24 hours to spread.', 'jetpack-send-pkg' ) },
				{
					text: __(
						'Manager URLs differ by region (ovh.com, ca.ovh.com, ovhcloud.com).',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__( 'Log in to the OVHcloud Control Panel and open Web Cloud.', 'jetpack-send-pkg' ),
					__( 'Go to Domain names and pick {domain}.', 'jetpack-send-pkg' ),
					__( 'Open the DNS zone tab.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add an entry and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Subdomain: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Next, then Confirm.', 'jetpack-send-pkg' ),
				],
			},
		},
		dreamhost: {
			quirks: [
				{
					text: __( 'Leave Host blank for the root; DreamHost adds @.', 'jetpack-send-pkg' ),
					rootOnly: true,
				},
				{ text: __( 'Don’t type the domain or a trailing dot.', 'jetpack-send-pkg' ) },
				{
					text: __(
						'"You already have a record for this name" means a CNAME clashes with another record.',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__( 'Log in to the DreamHost panel.', 'jetpack-send-pkg' ),
					__( 'Open Websites (or Domains), then DNS for {domain}.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add Record and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Host: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Save.', 'jetpack-send-pkg' ),
				],
			},
		},
		route53: {
			quirks: [
				{
					text: __(
						'Route 53 needs long values split into quoted pieces. Copy all does this for you.',
						'jetpack-send-pkg'
					),
					longOnly: true,
				},
				{
					text: __(
						'Leave Record name blank for the root; the domain is shown as a suffix.',
						'jetpack-send-pkg'
					),
					rootOnly: true,
				},
				{ text: __( 'TXT values must be in double quotes.', 'jetpack-send-pkg' ) },
			],
			steps: {
				start: [
					__( 'Open the Route 53 console and go to Hosted zones.', 'jetpack-send-pkg' ),
					__( 'Pick {domain}.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Create record.', 'jetpack-send-pkg' ),
					__(
						'Record name: {host}. Record type: {type}. {valueLabel}: {value}.',
						'jetpack-send-pkg'
					),
					__( 'Click Create records.', 'jetpack-send-pkg' ),
				],
			},
		},
		squarespace: {
			name: __( 'Squarespace', 'jetpack-send-pkg' ),
			quirks: [
				{
					text: __(
						'Squarespace asks for your password or 2FA again before saving.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'The domain is added for you. Use @ for the root.', 'jetpack-send-pkg' ) },
				{ text: __( 'No CNAME at @.', 'jetpack-send-pkg' ), rootOnly: true },
			],
			steps: {
				start: [
					__( 'Open your Squarespace domains dashboard and pick {domain}.', 'jetpack-send-pkg' ),
					__( 'Click DNS, then DNS Settings.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Scroll to Custom Records and click Add record.', 'jetpack-send-pkg' ),
					__( 'Type: {type}. Host: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Save and confirm your password if asked.', 'jetpack-send-pkg' ),
				],
			},
		},
		wordpresscom: {
			quirks: [
				{
					text: __(
						'The Name field adds your domain for you, so enter just the name shown here.',
						'jetpack-send-pkg'
					),
				},
				{ text: __( 'Leave TTL as it is.', 'jetpack-send-pkg' ) },
			],
			steps: {
				start: [
					__( 'Log in to WordPress.com and open Domains.', 'jetpack-send-pkg' ),
					__( 'Pick {domain}, then open DNS records.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Click Add a record and choose {type}.', 'jetpack-send-pkg' ),
					__( 'Name: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Click Add DNS record.', 'jetpack-send-pkg' ),
				],
			},
		},
		other: {
			name: __( 'Other or not sure', 'jetpack-send-pkg' ),
			quirks: [
				{
					text: __(
						'Most panels add your domain to the host field. If yours does, enter only the part before your domain.',
						'jetpack-send-pkg'
					),
				},
			],
			steps: {
				start: [
					__(
						'Log in where {domain} is managed. That’s often your web host, not where you bought the domain.',
						'jetpack-send-pkg'
					),
					__( 'Find DNS, DNS records, Zone editor or Advanced DNS.', 'jetpack-send-pkg' ),
				],
				record: [
					__( 'Add a {type} record. Host: {host}. {valueLabel}: {value}.', 'jetpack-send-pkg' ),
					__( 'Save.', 'jetpack-send-pkg' ),
				],
			},
		},
	};
}

/**
 * Every provider with its translated copy, in file order (by rank, then `other` last).
 *
 * @return The providers.
 */
function buildProviders(): Provider[] {
	const copy = providerCopy();
	return ( providersData as ProviderData[] ).map( data => {
		const extra = copy[ data.slug ] ?? copy[ OTHER_SLUG ];
		return {
			...data,
			name: extra.name ?? data.name,
			quirks: extra.quirks,
			steps: extra.steps,
		};
	} );
}

/** The generic entry used for "Another one" with no match and "I'm not sure". */
export const OTHER_SLUG = 'other';

/** Picker value for "I'm not sure". */
export const UNSURE_SLUG = 'unsure';

/** Every provider, in file order (by rank, then `other` last). */
export const PROVIDERS: Provider[] = buildProviders();

/** Values longer than this show truncated with "Copy all". */
export const LONG_VALUE_LENGTH = 60;

/** Characters kept at each end of a truncated value. */
const TRUNCATE_KEEP = 24;

/** Route 53 rejects TXT strings longer than this. */
const TXT_CHUNK = 255;

/**
 * A provider by slug, falling back to the generic entry.
 *
 * @param slug - Provider slug, or null.
 * @return The provider.
 */
export function getProvider( slug: ProviderSlug | null | undefined ): Provider {
	return (
		PROVIDERS.find( provider => provider.slug === slug ) ??
		PROVIDERS.find( provider => provider.slug === OTHER_SLUG )
	);
}

/**
 * Whether a slug names a real provider rather than the generic entry or "I'm not sure".
 *
 * @param slug - Provider slug, or null.
 * @return True for a named provider.
 */
export function isNamedProvider( slug: ProviderSlug | null | undefined ): boolean {
	return (
		!! slug &&
		slug !== OTHER_SLUG &&
		slug !== UNSURE_SLUG &&
		PROVIDERS.some( provider => provider.slug === slug )
	);
}

/**
 * The provider a nameserver belongs to, matched like the server does.
 *
 * @param nameserver - Hostname.
 * @return Slug, or null.
 */
export function matchNameserver( nameserver: string ): ProviderSlug | null {
	const ns = nameserver.toLowerCase().replace( /\.$/, '' );
	for ( const provider of PROVIDERS ) {
		for ( const pattern of provider.nsPatterns ) {
			const hit =
				provider.nsMatch === 'substring'
					? ns.includes( pattern )
					: ns === pattern.replace( /^\./, '' ) || ns.endsWith( pattern );
			if ( hit ) {
				return provider.slug;
			}
		}
	}
	return null;
}

/**
 * The provider most of the nameservers belong to.
 *
 * @param nameservers - Hostnames.
 * @return Slug, or null when none match.
 */
export function matchNameservers( nameservers: string[] ): ProviderSlug | null {
	const counts = new Map< ProviderSlug, number >();
	for ( const ns of nameservers ) {
		const slug = matchNameserver( ns );
		if ( slug ) {
			counts.set( slug, ( counts.get( slug ) ?? 0 ) + 1 );
		}
	}
	let best: ProviderSlug | null = null;
	let bestCount = 0;
	counts.forEach( ( count, slug ) => {
		if ( count > bestCount ) {
			best = slug;
			bestCount = count;
		}
	} );
	return best;
}

/**
 * The company part of a nameserver, e.g. `example-host.net` for `ns1.example-host.net`.
 *
 * @param nameserver - Hostname.
 * @return The short form.
 */
export function nameserverHost( nameserver: string ): string {
	const labels = nameserver.toLowerCase().replace( /\.$/, '' ).split( '.' );
	// Keep three labels for `co.uk`-style endings.
	const keep =
		labels.length > 2 &&
		labels[ labels.length - 1 ].length === 2 &&
		labels[ labels.length - 2 ].length <= 3
			? 3
			: 2;
	return labels.slice( -keep ).join( '.' );
}

/**
 * The records the user has to add: Record 1 lets Jetpack send, Record 2 signs, or lists Jetpack
 * as a sender when there's no signing record.
 *
 * @param records - The account's records.
 * @return Required records in display order.
 */
export function requiredRecords( records: DnsRecord[] ): DnsRecord[] {
	const lockdown = records.filter( record => record.purpose === 'lockdown' );
	const dkim = records.filter( record => record.purpose === 'dkim' );
	const second = dkim.length ? dkim : records.filter( record => record.purpose === 'spf' );
	return [ ...lockdown, ...second ];
}

/**
 * The name to type into the provider's host field.
 *
 * @param record   - The record; `host` is relative to the zone.
 * @param provider - Where it's being added.
 * @return The short host ('' means leave the field blank).
 */
export function formatHost( record: DnsRecord, provider: Provider ): string {
	const host = ( record.host ?? record.name ).trim().replace( /\.$/, '' );
	if ( host === '@' || host === '' ) {
		return provider.hostFieldRule === 'relative-blank' ? '' : '@';
	}
	return host;
}

/**
 * The provider's label for the value field of this record type.
 *
 * @param record   - The record.
 * @param provider - Where it's being added.
 * @return The label, e.g. "Content".
 */
export function valueLabel( record: Pick< DnsRecord, 'type' >, provider: Provider ): string {
	return record.type.toUpperCase() === 'CNAME'
		? provider.fieldLabels.valueCname
		: provider.fieldLabels.valueTxt;
}

/**
 * Whether a value is long enough to show truncated.
 *
 * @param value - The value.
 * @return True when long.
 */
export function isLongValue( value: string ): boolean {
	return value.length > LONG_VALUE_LENGTH;
}

/**
 * A long value cut to its first and last characters.
 *
 * @param value - The value.
 * @return The short form, or the value unchanged when short.
 */
export function truncateValue( value: string ): string {
	if ( ! isLongValue( value ) ) {
		return value;
	}
	return `${ value.slice( 0, TRUNCATE_KEEP ) }…${ value.slice( -TRUNCATE_KEEP ) }`;
}

/**
 * What a value's Copy button copies: Route 53 wants TXT values quoted, split into 255-character pieces.
 *
 * @param record   - The record (type and value).
 * @param provider - Where it's being added.
 * @param value    - Value to copy, when it differs from `record.value` (e.g. a merged value).
 * @return Text for the clipboard.
 */
export function copyValue(
	record: Pick< DnsRecord, 'type' | 'value' >,
	provider: Provider,
	value: string = record.value
): string {
	if ( provider.slug !== 'route53' || record.type.toUpperCase() !== 'TXT' ) {
		return value;
	}
	const pieces: string[] = [];
	for ( let i = 0; i < value.length; i += TXT_CHUNK ) {
		pieces.push( `"${ value.slice( i, i + TXT_CHUNK ) }"` );
	}
	return pieces.join( ' ' ) || '""';
}

/**
 * Text to show for a host field that should be left empty.
 *
 * @return The label.
 */
export function blankHostLabel(): string {
	return __( 'Leave it blank', 'jetpack-send-pkg' );
}

/**
 * Fill a step's placeholders.
 *
 * @param step     - Step text.
 * @param provider - Where it's being added.
 * @param record   - The record, or null for steps that name none.
 * @param domain   - The sending domain.
 * @return The step.
 */
function fillStep(
	step: string,
	provider: Provider,
	record: DnsRecord | null,
	domain: string
): string {
	const host = record ? formatHost( record, provider ) : '';
	const values: Record< string, string > = {
		domain,
		type: record?.type ?? '',
		host: host === '' ? blankHostLabel() : host,
		value: record ? truncateValue( record.value ) : '',
		valueLabel: record ? valueLabel( record, provider ) : '',
	};
	return step.replace(
		/\{(domain|type|host|value|valueLabel)\}/g,
		( _match, key: string ) => values[ key ]
	);
}

/**
 * The provider's steps for one record, placeholders filled.
 *
 * @param provider - Where it's being added.
 * @param record   - The record.
 * @param domain   - The sending domain.
 * @return Steps in order.
 */
export function fillSteps( provider: Provider, record: DnsRecord, domain: string ): string[] {
	return fillAllSteps( provider, [ record ], domain );
}

/**
 * The provider's steps for every record: the per-record steps repeat for each, the first one
 * labelled "Record 1: …" when there's more than one.
 *
 * @param provider - Where it's being added.
 * @param records  - The records, in display order.
 * @param domain   - The sending domain.
 * @return Steps in order.
 */
export function fillAllSteps( provider: Provider, records: DnsRecord[], domain: string ): string[] {
	const { start, record: perRecord, end = [] } = provider.steps;
	const steps = start.map( step => fillStep( step, provider, null, domain ) );
	records.forEach( ( record, index ) => {
		const isCname = record.type.toUpperCase() === 'CNAME';
		perRecord.forEach( ( step, i ) => {
			if ( typeof step !== 'string' && step.cnameOnly && ! isCname ) {
				return;
			}
			const filled = fillStep(
				typeof step === 'string' ? step : step.text,
				provider,
				record,
				domain
			);
			steps.push(
				i === 0 && records.length > 1
					? sprintf(
							/* translators: 1: record number, 1 or 2, 2: the first step for that record, e.g. "Click Add record." */
							__( 'Record %1$d: %2$s', 'jetpack-send-pkg' ),
							index + 1,
							filled
						)
					: filled
			);
		} );
	} );
	end.forEach( step => steps.push( fillStep( step, provider, null, domain ) ) );
	return steps;
}

/**
 * The one tip worth showing under these records, skipping root-only tips when no record is at the root.
 *
 * @param provider        - Where they're being added.
 * @param records         - The records shown.
 * @param withoutProxyTip - Skip the proxy tip, when a notice already says to turn the proxy off.
 * @return The tip, or '' when there's none.
 */
export function providerTip(
	provider: Provider,
	records: DnsRecord[],
	withoutProxyTip = false
): string {
	return providerTips( provider, records, withoutProxyTip )[ 0 ] ?? '';
}

/**
 * Every tip that applies to these records, most important first. The first shows under the
 * records; the rest go at the end of the step-by-step list.
 *
 * @param provider        - Where they're being added.
 * @param records         - The records shown.
 * @param withoutProxyTip - Skip the proxy tip.
 * @return The tips.
 */
export function providerTips(
	provider: Provider,
	records: DnsRecord[],
	withoutProxyTip = false
): string[] {
	const hasRoot = records.some(
		record => formatHost( record, provider ) === '' || formatHost( record, provider ) === '@'
	);
	const hasLong = records.some(
		record => record.type.toUpperCase() === 'TXT' && record.value.length > LONG_TXT_LENGTH
	);
	const hasCname = records.some( record => record.type.toUpperCase() === 'CNAME' );
	return provider.quirks
		.filter(
			quirk =>
				( hasRoot || ! quirk.rootOnly ) &&
				( hasLong || ! quirk.longOnly ) &&
				( ( hasCname && ! withoutProxyTip ) || ! quirk.cnameOnly )
		)
		.map( quirk => quirk.text );
}

/**
 * A provider's DNS page, filled for the domain, only where the link is known to work.
 *
 * @param provider - The provider.
 * @param domain   - The sending domain.
 * @return The URL, or null.
 */
export function providerPageUrl( provider: Provider, domain: string ): string | null {
	if ( ! provider.dnsPageUrlVerified || ! provider.dnsPageUrlTemplate ) {
		return null;
	}
	return provider.dnsPageUrlTemplate.replace( /\{domain\}/g, encodeURIComponent( domain ) );
}
