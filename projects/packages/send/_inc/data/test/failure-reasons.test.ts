import fixture from '../../../tests/fixtures/failure-reasons.json';
import {
	FAILURE_REASONS,
	failureCopy,
	failureMessage,
	failureOwner,
	failureReason,
	failureSummary,
	hostActions,
	hostLine,
	isOurSide,
	isRecordsProblem,
	offersSupport,
} from '../failure-reasons';
import type { FailureDetail, FailureReason, HostReason } from '../types';

const reasons = Object.keys( fixture.owners ) as FailureReason[];

describe( 'the reason catalogue', () => {
	it( 'has the same reasons and owners as the server’s shared fixture', () => {
		expect( [ ...FAILURE_REASONS ].sort() ).toEqual( [ ...reasons ].sort() );
		expect(
			Object.fromEntries( FAILURE_REASONS.map( reason => [ reason, failureOwner( reason ) ] ) )
		).toEqual( fixture.owners );
	} );

	it.each( reasons )( '%s has a headline, a next step and at most two actions', reason => {
		const copy = failureCopy( reason, { domain: 'example.com', plugin: 'Shop' } );
		expect( copy.headline ).not.toBe( '' );
		expect( copy.step ).not.toBe( '' );
		expect( copy.actions.length ).toBeLessThanOrEqual( 2 );
	} );

	it( 'never names the sending service or uses technical words in customer copy', () => {
		const texts = reasons.flatMap( reason =>
			[ true, false ].flatMap( isTest => {
				const copy = failureCopy( reason, { domain: '', isTest } );
				return [ copy.headline, copy.step ];
			} )
		);
		const hostDetail = ( reason: HostReason ): FailureDetail => ( {
			host: { result: 'failed', reason },
		} );
		fixture.host_reasons.forEach( reason =>
			texts.push( hostLine( 'failed', hostDetail( reason as HostReason ), 'lockdown' ) )
		);
		texts.forEach( text => expect( text ).not.toMatch( /mailchannels|dkim|spf|smtp|http|curl/i ) );
	} );
} );

describe( 'failureReason', () => {
	it.each( fixture.legacy.map( ( { error, reason } ) => [ error, reason ] ) )(
		'reads an older row’s error “%s” as %s',
		( error, reason ) => {
			expect( failureReason( error ) ).toBe( reason );
			expect( failureReason( { error } ) ).toBe( reason );
		}
	);

	it( 'uses the stored reason over the error text', () => {
		expect( failureReason( { error: 'HTTP 429: Too many requests', reason: 'busy' } ) ).toBe(
			'busy'
		);
	} );

	it( 'falls back to the error text when the stored reason is blank or unknown', () => {
		expect( failureReason( { error: '550 5.1.1 User unknown', reason: '' } ) ).toBe( 'rejected' );
		expect( failureReason( { error: '550 5.1.1 User unknown', reason: 'gremlins' } ) ).toBe(
			'rejected'
		);
	} );
} );

describe( 'failureCopy actions', () => {
	it.each< [ FailureReason, string[] ] >( [
		[ 'lockdown', [ 'check_records' ] ],
		[ 'dkim', [ 'check_records' ] ],
		[ 'spf', [ 'open_advanced' ] ],
		[ 'sender_domain', [ 'copy_details' ] ],
		[ 'service_down', [ 'resend', 'contact_support' ] ],
		[ 'rejected', [ 'resend_other' ] ],
		[ 'unsupported', [] ],
	] )( '%s offers %p', ( reason, actions ) => {
		expect( failureCopy( reason, { domain: 'example.com' } ).actions ).toEqual( actions );
	} );

	it.each< [ string, Parameters< typeof failureCopy >[ 1 ], string[] ] >( [
		[ 'an email that can’t be resent', { domain: '', canResend: false }, [ 'contact_support' ] ],
		[ 'a test', { domain: '', isTest: true }, [ 'contact_support' ] ],
		[ 'a host-sent row', { domain: '', fallback: true }, [ 'contact_support' ] ],
	] )( 'drops resend for %s', ( _, ctx, actions ) => {
		expect( failureCopy( 'service_down', ctx ).actions ).toEqual( actions );
	} );

	it( 'keeps only the fix-it actions on host-sent rows', () => {
		expect( failureCopy( 'sender_domain', { domain: '', fallback: true } ).actions ).toEqual( [] );
		expect( failureCopy( 'spf', { domain: '', fallback: true } ).actions ).toEqual( [
			'open_advanced',
		] );
	} );

	it( 'gives the development account’s own limit no support link', () => {
		expect( failureCopy( 'unverified', { domain: '', devMode: true } ) ).toEqual( {
			headline: 'This sending account can only email verified addresses.',
			step: '',
			actions: [],
		} );
		expect( offersSupport( 'unverified', true ) ).toBe( false );
		expect( offersSupport( 'unverified' ) ).toBe( true );
	} );
} );

describe( 'failureCopy wording', () => {
	it( 'names the domain and the plugin when known, and says something plain when not', () => {
		expect( failureMessage( 'lockdown', 'example.com' ) ).toMatch( /^example\.com hasn’t given/ );
		expect( failureMessage( 'lockdown', '' ) ).toMatch( /^Your domain hasn’t given/ );
		expect( failureCopy( 'attachment_missing', { domain: '', plugin: 'Shop' } ).step ).toMatch(
			/^Shop pointed to/
		);
		expect( failureCopy( 'attachment_missing', { domain: '' } ).step ).toMatch(
			/^The plugin that sent it pointed to/
		);
	} );

	it( 'says when the plan resets, as a day', () => {
		expect( failureCopy( 'limit', { domain: '', resetsOn: '2026-11-01' } ).step ).toBe(
			'Emails go out again when it resets on Nov 1. Contact support if you need more.'
		);
	} );

	it( 'uses test wording for tests', () => {
		expect( failureMessage( 'unknown', '', { isTest: true } ) ).toBe(
			'Something went wrong. Try again in a minute.'
		);
		expect(
			failureSummary(
				{ error: 'odd', status: 'failed', source: 'test', reason: 'unknown' },
				'example.com'
			)
		).toBe( 'Jetpack Send couldn’t send this. Something went wrong. Try again in a minute.' );
	} );

	it.each( reasons )( 'never tells someone to resend a test (%s)', reason => {
		expect( failureCopy( reason, { domain: 'example.com', isTest: true } ).step ).not.toMatch(
			/resend/i
		);
	} );

	it( 'leads the tooltip with what happened', () => {
		expect( failureSummary( '550 5.1.1 User unknown', 'example.com' ) ).toBe(
			'Jetpack Send couldn’t send this. The receiving mail server turned it down.'
		);
	} );
} );

describe( 'owner helpers', () => {
	it.each< [ FailureReason, boolean, boolean ] >( [
		// reason, records problem, our side
		[ 'spf', true, false ],
		[ 'service_down', false, true ],
		[ 'busy', false, false ],
	] )( '%s', ( reason, records, ours ) => {
		expect( isRecordsProblem( reason ) ).toBe( records );
		expect( isOurSide( reason ) ).toBe( ours );
	} );
} );

describe( 'hostLine and hostActions', () => {
	const accepted: FailureDetail = { host: { result: 'accepted' } };
	const off: FailureDetail = { host: { result: 'failed', reason: 'host_off' } };

	it.each< [ string, Parameters< typeof hostLine >, string ] >( [
		[ 'an older host-sent row', [ 'fallback', null, 'unknown' ], 'Your host sent it instead.' ],
		[
			'the host sent it',
			[ 'fallback', accepted, 'lockdown' ],
			'Your host’s mail sent it instead.',
		],
		[
			'the host sent it after a timeout',
			[ 'fallback', accepted, 'no_answer' ],
			'Your host’s mail sent it too, so it may arrive twice.',
		],
		[
			'the host never reported back',
			[ 'fallback', { fallback: 'on' }, 'service_down' ],
			'We handed it to your host’s mail.',
		],
		[
			'the host failed too',
			[ 'failed', off, 'lockdown' ],
			'Your host’s mail couldn’t send it either. Ask your host to turn on email for your site.',
		],
		[ 'a failure with no host part', [ 'failed', null, 'lockdown' ], '' ],
	] )( 'says what happened when %s', ( _, args, line ) => {
		expect( hostLine( ...args ) ).toBe( line );
	} );

	it( 'falls back to the generic host line for an unknown host reason', () => {
		const detail = {
			host: { result: 'failed', reason: 'host_gremlins' },
		} as unknown as FailureDetail;
		expect( hostLine( 'failed', detail, 'lockdown' ) ).toBe(
			'Your host’s mail couldn’t send it either. Its reply is in Technical details.'
		);
	} );

	it( 'offers the host outcome’s action only when the host failed', () => {
		expect( hostActions( off ) ).toEqual( [ 'copy_details' ] );
		expect( hostActions( { host: { result: 'failed', reason: 'host_login' } } ) ).toEqual( [] );
		expect( hostActions( accepted ) ).toEqual( [] );
		expect( hostActions( null ) ).toEqual( [] );
	} );
} );
