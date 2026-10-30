import providersData from '../../../data/providers.json';
import {
	OTHER_SLUG,
	PROVIDERS,
	copyValue,
	fillAllSteps,
	fillSteps,
	formatHost,
	getProvider,
	matchNameservers,
	nameserverHost,
	providerPageUrl,
	providerTip,
	requiredRecords,
	truncateValue,
	valueLabel,
} from '../providers';
import type { DnsRecord } from '../../../data/types';

const lockdown: DnsRecord = {
	type: 'TXT',
	name: '_mailchannels.example.com',
	host: '_mailchannels',
	value: 'v=mc1 auth=jpsend1',
	purpose: 'lockdown',
};
const dkim: DnsRecord = {
	type: 'TXT',
	name: 'jpsend._domainkey.example.com',
	host: 'jpsend._domainkey',
	value: `v=DKIM1; k=rsa; p=${ 'A'.repeat( 400 ) }`,
	purpose: 'dkim',
};
const spf: DnsRecord = {
	type: 'TXT',
	name: 'example.com',
	host: '@',
	value: 'v=spf1 include:relay.example.net ~all',
	purpose: 'spf',
	optional: true,
};

describe( 'formatHost', () => {
	it.each( PROVIDERS.map( provider => [ provider.slug, provider ] as const ) )(
		'gives %s the short host and its own root form',
		( _slug, provider ) => {
			expect( formatHost( lockdown, provider ) ).toBe( '_mailchannels' );
			expect( formatHost( dkim, provider ) ).toBe( 'jpsend._domainkey' );
			expect( formatHost( spf, provider ) ).toBe(
				provider.hostFieldRule === 'relative-blank' ? '' : '@'
			);
		}
	);

	it( 'falls back to the full name, without a trailing dot, when there is no host', () => {
		expect(
			formatHost(
				{ ...lockdown, host: undefined, name: 'x.example.com.' },
				getProvider( 'cloudflare' )
			)
		).toBe( 'x.example.com' );
	} );
} );

describe( 'fillSteps', () => {
	it( 'fills every placeholder with the provider’s own labels and the short host', () => {
		const steps = fillSteps( getProvider( 'cloudflare' ), dkim, 'example.com' ).join( ' ' );
		expect( steps ).toContain( 'pick example.com' );
		expect( steps ).toContain( 'Name: jpsend._domainkey.' );
		expect( steps ).toContain( 'Content: v=DKIM1; k=rsa; p=AAAA' );
		expect( steps ).toContain( '…' );
		expect( steps ).not.toMatch( /\{[a-zA-Z]+\}/ );
	} );

	it.each( PROVIDERS.map( provider => [ provider.slug, provider ] as const ) )(
		'leaves no placeholder behind for %s',
		( _slug, provider ) => {
			const steps = fillSteps( provider, spf, 'example.com' );
			expect( steps.join( ' ' ) ).not.toMatch( /\{[a-zA-Z]+\}/ );
		}
	);

	it( 'says to leave the host blank where the provider wants that for the root', () => {
		expect( fillSteps( getProvider( 'route53' ), spf, 'example.com' ).join( ' ' ) ).toContain(
			'Record name: Leave it blank.'
		);
	} );
} );

describe( 'fillAllSteps', () => {
	it( 'repeats the per-record steps for each record and labels where each starts', () => {
		const steps = fillAllSteps( getProvider( 'cloudflare' ), [ lockdown, dkim ], 'example.com' );
		expect( steps[ 0 ] ).toBe( 'Open the Cloudflare dashboard and pick example.com.' );
		expect( steps ).toContain( 'Record 1: Click Add record.' );
		expect( steps ).toContain( 'Record 2: Click Add record.' );
		expect( steps ).toContain( 'Type: TXT. Name: _mailchannels. Content: v=mc1 auth=jpsend1.' );
		expect( steps.join( ' ' ) ).toContain( 'Name: jpsend._domainkey.' );
	} );

	it( 'puts steps that come once at the end after every record', () => {
		const steps = fillAllSteps( getProvider( 'namecheap' ), [ lockdown, dkim ], 'example.com' );
		expect( steps[ steps.length - 1 ] ).toBe( 'Click Save all changes.' );
		expect( steps.filter( step => step === 'Click Save all changes.' ) ).toHaveLength( 1 );
	} );

	it( 'leaves out the record label when there is one record', () => {
		expect( fillSteps( getProvider( 'cloudflare' ), lockdown, 'example.com' ) ).toContain(
			'Click Add record.'
		);
	} );
} );

describe( 'provider copy', () => {
	it.each( PROVIDERS.map( provider => [ provider.slug, provider ] as const ) )(
		'%s has its own tips and steps',
		( _slug, provider ) => {
			expect( provider.quirks.length ).toBeGreaterThan( 0 );
			expect( provider.steps.start.length ).toBeGreaterThan( 0 );
			expect( provider.steps.record.length ).toBeGreaterThan( 0 );
		}
	);

	it( 'keeps user-facing sentences out of the JSON, so they can be translated', () => {
		providersData.forEach( entry => {
			expect( entry ).not.toHaveProperty( 'quirks' );
			expect( entry ).not.toHaveProperty( 'steps' );
		} );
	} );
} );

describe( 'providerTip', () => {
	it( 'shows the first tip that applies to the records shown', () => {
		expect( providerTip( getProvider( 'cloudflare' ), [ lockdown, dkim ] ) ).toBe(
			'The Name field adds your domain for you, so enter just the name shown here.'
		);
		expect(
			providerTip( getProvider( 'cloudflare' ), [ { ...lockdown, type: 'CNAME' }, dkim ] )
		).toBe( 'Leave Proxy status as DNS only (grey cloud) for both records.' );
		// A notice already says to turn the proxy off, so the next tip shows instead.
		expect(
			providerTip( getProvider( 'cloudflare' ), [ { ...lockdown, type: 'CNAME' }, dkim ], true )
		).toBe( 'The Name field adds your domain for you, so enter just the name shown here.' );
		expect( providerTip( getProvider( 'ionos' ), [ lockdown, dkim ] ) ).toBe(
			'Changes are live at IONOS at once; up to an hour elsewhere.'
		);
		expect( providerTip( getProvider( 'ionos' ), [ lockdown, spf ] ) ).toBe(
			'Use @ in Host name for the root.'
		);
		expect( providerTip( getProvider( 'dreamhost' ), [ lockdown, dkim ] ) ).toBe(
			'Don’t type the domain or a trailing dot.'
		);
	} );
} );

describe( 'valueLabel', () => {
	it( 'uses the provider’s label for the record type', () => {
		const cloudflare = getProvider( 'cloudflare' );
		expect( valueLabel( lockdown, cloudflare ) ).toBe( 'Content' );
		expect( valueLabel( { type: 'CNAME' }, cloudflare ) ).toBe( 'Target' );
	} );
} );

describe( 'copyValue', () => {
	it( 'splits long TXT values into quoted pieces for Route 53 only', () => {
		const route53 = copyValue( dkim, getProvider( 'route53' ) );
		const pieces = route53.match( /"[^"]*"/g ) ?? [];
		expect( pieces ).toHaveLength( 2 );
		expect( pieces.every( piece => piece.length - 2 <= 255 ) ).toBe( true );
		expect( pieces.map( piece => piece.slice( 1, -1 ) ).join( '' ) ).toBe( dkim.value );
		expect( copyValue( lockdown, getProvider( 'route53' ) ) ).toBe( '"v=mc1 auth=jpsend1"' );
		expect( copyValue( dkim, getProvider( 'cloudflare' ) ) ).toBe( dkim.value );
	} );
} );

describe( 'truncateValue', () => {
	it( 'keeps both ends of long values and leaves short ones alone', () => {
		expect( truncateValue( lockdown.value ) ).toBe( lockdown.value );
		const short = truncateValue( dkim.value );
		expect( short.startsWith( 'v=DKIM1; k=rsa; p=AAAAAA' ) ).toBe( true );
		expect( short ).toHaveLength( 49 );
	} );
} );

describe( 'matchNameservers', () => {
	it.each( [
		[ [ 'ada.ns.cloudflare.com', 'bob.ns.cloudflare.com' ], 'cloudflare' ],
		[ [ 'ns-1.awsdns-12.org', 'ns-2.awsdns-34.co.uk' ], 'route53' ],
		[ [ 'ns1.wordpress.com', 'ns4.wordpress.com' ], 'wordpresscom' ],
		[ [ 'ns1.bluehost.com.' ], 'bluehost' ],
		[ [ 'dns1.p01.nsone.net' ], null ],
		[ [ 'ns1.unknown-host.net' ], null ],
	] )( 'maps %p to %p', ( nameservers, slug ) => {
		expect( matchNameservers( nameservers ) ).toBe( slug );
	} );
} );

describe( 'nameserverHost', () => {
	it.each( [
		[ 'ns1.example-host.net', 'example-host.net' ],
		[ 'ns-2.awsdns-34.co.uk.', 'awsdns-34.co.uk' ],
	] )( 'shortens %s to %s', ( ns, host ) => {
		expect( nameserverHost( ns ) ).toBe( host );
	} );
} );

describe( 'requiredRecords', () => {
	it( 'shows the signing record second, or the sender list when there is no signing record', () => {
		expect( requiredRecords( [ lockdown, spf, dkim ] ) ).toEqual( [ lockdown, dkim ] );
		expect( requiredRecords( [ lockdown, spf ] ) ).toEqual( [ lockdown, spf ] );
	} );
} );

describe( 'providerPageUrl', () => {
	it( 'links only where the provider page is known to work', () => {
		expect( providerPageUrl( getProvider( 'route53' ), 'example.com' ) ).toMatch( /^https:\/\// );
		expect( providerPageUrl( getProvider( 'godaddy' ), 'example.com' ) ).toBeNull();
		expect( getProvider( 'nope' ).slug ).toBe( OTHER_SLUG );
	} );
} );
