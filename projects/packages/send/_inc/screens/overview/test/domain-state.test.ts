import { domainBadge, domainHealth, fixAdvice, recordsAdvice, waitingCopy } from '../domain-state';
import { rowBadge, rowState } from '../setup/record-rows';
import { RECORDS, lookup, lookupRow } from '../setup/test/fixtures/status';
import type { DnsLookupRecord } from '../../../data/types';

const lockdown = ( overrides: Partial< DnsLookupRecord > = {} ) => lookupRow( overrides );
const dkim = ( overrides: Partial< DnsLookupRecord > = {} ) =>
	lookupRow( {
		purpose: 'dkim',
		name: 'jpsend._domainkey.example.com',
		host: 'jpsend._domainkey',
		...overrides,
	} );
const wrong = { state: 'needs_fix', problem: 'wrong_value' } as const;
const missing = { state: 'not_found' } as const;
const found = { state: 'found' } as const;

describe( 'domainHealth', () => {
	it.each( [
		[ 'connected', true, null ],
		[ 'checking', false, null ],
		[ 'checking', false, [ lockdown( { state: 'no_answer' } ), dkim( found ) ] ],
		[ 'confirming', false, [ lockdown( found ), dkim( found ) ] ],
		[ 'mismatch', false, [ lockdown( wrong ), dkim( wrong ) ] ],
		[ 'mismatch', false, [ lockdown( missing ), dkim( wrong ) ] ],
		[ 'missing', false, [ lockdown( found ), dkim( missing ) ] ],
		[ 'not_connected', false, [ lockdown( missing ), dkim( missing ) ] ],
		[
			'not_live',
			false,
			[
				lockdown( found ),
				dkim( found ),
				lookupRow( { purpose: 'sender_domain', state: 'needs_fix', problem: 'not_live' } ),
			],
		],
	] as const )( 'is %s', ( expected, canEnable, rows ) => {
		expect( domainHealth( canEnable, RECORDS, rows ? lookup( [ ...rows ] ) : null ) ).toBe(
			expected
		);
	} );

	it( 'badges say what is wrong, never a catch-all', () => {
		expect( domainBadge( 'connected', [] ).label ).toBe( 'Connected' );
		expect( domainBadge( 'mismatch', [ lockdown( wrong ), dkim( wrong ) ] ).label ).toBe(
			'Records don’t match'
		);
		expect( domainBadge( 'mismatch', [ dkim( wrong ) ] ).label ).toBe( 'Record doesn’t match' );
		// A missing record or an old one in the way isn't a value that "doesn't match".
		expect( domainBadge( 'mismatch', [ lockdown( missing ), dkim( wrong ) ] ).label ).toBe(
			'Records need a change'
		);
		const conflict = { state: 'needs_fix', problem: 'conflict' } as const;
		expect( domainBadge( 'mismatch', [ dkim( conflict ) ] ).label ).toBe( 'Old record in the way' );
		// Both records share one problem, so the badge uses its words too.
		expect( domainBadge( 'mismatch', [ lockdown( conflict ), dkim( conflict ) ] ).label ).toBe(
			'Old records in the way'
		);
		const doubled = { state: 'needs_fix', problem: 'doubled' } as const;
		expect( domainBadge( 'mismatch', [ lockdown( doubled ), dkim( doubled ) ] ).label ).toBe(
			'Record names doubled'
		);
		expect( domainBadge( 'mismatch', [ lockdown( doubled ), dkim( conflict ) ] ).label ).toBe(
			'Records need a change'
		);
		expect( domainBadge( 'missing', [ dkim( missing ) ] ).label ).toBe( 'Record missing' );
		expect( domainBadge( 'not_connected', [ lockdown( missing ), dkim( missing ) ] ).label ).toBe(
			'Records missing'
		);
		expect( domainBadge( 'checking', [] ).label ).toBe( 'Checking' );
	} );
} );

describe( 'recordsAdvice', () => {
	const advise = ( rows: DnsLookupRecord[], provider = 'Cloudflare' ) =>
		recordsAdvice( {
			canEnable: false,
			records: RECORDS,
			lookup: lookup( rows ),
			domain: 'example.com',
			provider,
		} );

	it.each( [
		[
			'both values changed',
			[ lockdown( wrong ), dkim( wrong ) ],
			'Cloudflare',
			'Both records changed at Cloudflare. Copy them again and replace the old ones.',
		],
		[
			'one value changed, host unknown',
			[ lockdown( found ), dkim( wrong ) ],
			'',
			'One record changed at your DNS host. Copy it again and replace the old one.',
		],
		[
			'both missing',
			[ lockdown( missing ), dkim( missing ) ],
			'Cloudflare',
			'Both records are missing at Cloudflare. Copy them and add them again.',
		],
	] )( 'says it once, with no note per row, when %s', ( _, rows, provider, summary ) => {
		expect( advise( rows, provider ) ).toEqual( { summary, notes: {} } );
	} );

	it.each( [
		[
			'doubled',
			'Cloudflare added example.com to the end of both names. Use just the short names shown.',
		],
		[ 'conflict', 'Both names already have an old record. Delete the old ones, then add these.' ],
		[ 'proxied', 'Turn off the proxy for both records (DNS only).' ],
		[ 'not_live', 'Both records are saved but not live yet. Check they’re published.' ],
	] as const )( 'says a shared %s problem once, with no note per row', ( problem, summary ) => {
		const fix = { state: 'needs_fix', problem } as const;
		expect( advise( [ lockdown( fix ), dkim( fix ) ] ) ).toEqual( { summary, notes: {} } );
	} );

	it( 'names the DNS host generically when it is unknown', () => {
		const fix = { state: 'needs_fix', problem: 'doubled' } as const;
		expect( advise( [ lockdown( fix ), dkim( fix ) ], '' ).summary ).toBe(
			'Your DNS host added example.com to the end of both names. Use just the short names shown.'
		);
	} );

	it( 'says a single record’s own fix as the summary', () => {
		expect(
			advise( [ lockdown( found ), dkim( { state: 'needs_fix', problem: 'conflict' } ) ] )
		).toEqual( {
			summary: 'There’s already a record with this name. Delete the old one, then add this one.',
			notes: {},
		} );
	} );

	it( 'adds a note per row when two non-value problems differ', () => {
		const advice = advise( [
			lockdown( { state: 'needs_fix', problem: 'conflict' } ),
			dkim( { state: 'needs_fix', problem: 'doubled' } ),
		] );
		expect( advice.summary ).toBe( 'Both records need a change at Cloudflare.' );
		expect( Object.keys( advice.notes ) ).toEqual( [ 'lockdown', 'dkim' ] );
		expect( advice.notes.lockdown ).not.toBe( advice.notes.dkim );
	} );

	it( 'uses setup words for a wrong value before the records ever passed', () => {
		expect(
			fixAdvice( [ lockdown( wrong ), dkim( wrong ) ], 'example.com', 'Cloudflare', false ).summary
		).toBe(
			'We found both records at Cloudflare, but their values are different. Copy them again and replace the old ones.'
		);
	} );

	it( 'says DNS isn’t answering without calling any record missing', () => {
		const noAnswer = [ lockdown( { state: 'no_answer' } ), dkim( { state: 'no_answer' } ) ];
		expect( advise( noAnswer ).summary ).toBe(
			'We can’t reach example.com’s DNS right now. We’ll keep trying.'
		);
		expect( rowState( noAnswer[ 0 ] ) ).toBe( 'checking' );
		expect( rowBadge( rowState( noAnswer[ 0 ] ), undefined, true )?.label ).toBe( 'Checking' );
		expect( waitingCopy( 'checking', true ).detail ).not.toMatch( /fixed/ );
	} );

	it.each( [
		[ 'wrong_value', 'Doesn’t match' ],
		[ 'doubled', 'Name doubled' ],
		[ 'conflict', 'Old record in the way' ],
		[ 'proxied', 'Proxy on' ],
		[ 'not_live', 'Not live yet' ],
	] as const )(
		'badges a %s row with what is wrong, in the card badge’s tone',
		( problem, label ) => {
			expect( rowBadge( 'needs_fix', problem, true ) ).toEqual( { intent: 'medium', label } );
		}
	);

	it( 'adds a note per row only when the rows need different things', () => {
		expect( advise( [ lockdown( missing ), dkim( wrong ) ] ) ).toEqual( {
			summary: 'Both records need a change at Cloudflare.',
			notes: {
				lockdown: 'We can’t find this record. Copy it and add it again.',
				dkim: 'Its value doesn’t match. Copy it again and replace the old one.',
			},
		} );
	} );

	it( 'says nothing once the records pass', () => {
		expect(
			recordsAdvice( {
				canEnable: true,
				records: RECORDS,
				lookup: lookup( [ lockdown( found ), dkim( found ) ] ),
				domain: 'example.com',
				provider: 'Cloudflare',
			} )
		).toEqual( { summary: '', notes: {} } );
	} );

	it( 'tells a paused site it can turn sending back on, not that it switches itself', () => {
		expect( waitingCopy( 'mismatch', true ).detail ).toBe(
			'Once it’s fixed, sending goes back to normal by itself.'
		);
		expect( waitingCopy( 'mismatch', false ).detail ).toBe(
			'Once it’s fixed, you can turn sending back on.'
		);
	} );
} );
