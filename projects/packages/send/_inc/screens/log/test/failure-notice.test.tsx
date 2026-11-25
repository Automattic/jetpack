import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { SUPPORT_URL } from '../../../data/failure-reasons';
import { ADVANCED_SETTINGS_HREF } from '../../../data/log-link';
import FailureNotice from '../failure-notice';
import type { FailureDetail, LogRow } from '../../../data/types';
import type { FailureNoticeProps } from '../failure-notice';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const row = ( overrides: Partial< LogRow > = {} ): LogRow => ( {
	id: '7',
	created_at: '2026-10-19 14:14:03',
	recipients: 'jordan@example.org',
	subject: 'Your order',
	status: 'failed',
	error: 'HTTP 403',
	request_id: '',
	source: 'wp_mail',
	reason: 'lockdown',
	...overrides,
} );

const renderNotice = ( props: Partial< FailureNoticeProps > = {} ) => {
	const onNavigate = jest.fn();
	const onResend = jest.fn();
	render(
		<FailureNotice
			row={ row() }
			detail={ null }
			supportText="Jetpack Send email report"
			canResend
			domain="example.com"
			devMode={ false }
			onNavigate={ onNavigate }
			onResend={ onResend }
			{ ...props }
		/>
	);
	return { onNavigate, onResend };
};

const actionNames = () =>
	[ ...screen.queryAllByRole( 'button' ), ...screen.queryAllByRole( 'link' ) ].map(
		element => element.textContent
	);

beforeEach( () => jest.clearAllMocks() );

describe( 'FailureNotice', () => {
	it.each( [
		[ 'lockdown', [ 'Check your records' ] ],
		[ 'spf', [ 'Open Advanced settings' ] ],
		[ 'sender_domain', [ 'Copy details' ] ],
		[ 'service_down', [ 'Resend', 'Contact support' ] ],
		[ 'cant_connect', [ 'Copy details' ] ],
	] )( 'offers the fix for a %s failure, and nothing else', ( reason, actions ) => {
		renderNotice( { row: row( { reason } ) } );

		expect( actionNames() ).toEqual( actions );
	} );

	it( 'drops Resend when the email can’t be resent', () => {
		renderNotice( { row: row( { reason: 'service_down' } ), canResend: false } );

		expect( actionNames() ).toEqual( [ 'Contact support' ] );
	} );

	it( 'sends records fixes where they live', async () => {
		const { onNavigate } = renderNotice( { row: row( { reason: 'spf' } ) } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Open Advanced settings' } ) );

		expect( onNavigate ).toHaveBeenCalledWith( ADVANCED_SETTINGS_HREF );
	} );

	it( 'opens the resend dialog on Someone else for a wrong address', async () => {
		const { onResend } = renderNotice( { row: row( { reason: 'rejected' } ) } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );

		expect( onResend ).toHaveBeenCalledWith( true );
	} );

	it( 'copies the report for support and says so', async () => {
		const user = userEvent.setup();
		renderNotice( { row: row( { reason: 'blocked_by_site' } ), supportText: 'Report: line 1' } );

		await user.click( screen.getByRole( 'button', { name: 'Copy details' } ) );

		await expect( navigator.clipboard.readText() ).resolves.toBe( 'Report: line 1' );
		expect( screen.getByRole( 'button', { name: 'Copied' } ) ).toBeVisible();
		expect( speak ).toHaveBeenCalledWith( 'Details copied.' );
	} );

	it.each< [ string, string, FailureDetail | null, string ] >( [
		[
			'took it',
			'service_down',
			{ host: { result: 'accepted' } },
			'Your host’s mail sent it instead.',
		],
		[
			'took it after no answer',
			'no_answer',
			{ host: { result: 'accepted' } },
			'Your host’s mail sent it too, so it may arrive twice.',
		],
		[
			'didn’t report back',
			'service_down',
			{ host: { result: 'unknown' } },
			'We handed it to your host’s mail.',
		],
		[ 'is an older row', 'service_down', null, 'Your host sent it instead.' ],
	] )( 'says what happened when the host’s mail %s', ( _, reason, detail, line ) => {
		renderNotice( { row: row( { status: 'fallback', reason } ), detail } );

		expect(
			screen.getByText(
				reason === 'no_answer'
					? 'Jetpack Send isn’t sure this went out.'
					: 'Jetpack Send couldn’t send this.'
			)
		).toBeVisible();
		expect( screen.getByText( new RegExp( `${ line }$` ) ) ).toBeVisible();
		// It went out, so only the fix-it actions stay.
		expect( screen.queryByRole( 'button', { name: 'Resend' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps Send’s reason and actions when the host’s mail failed too', () => {
		renderNotice( {
			row: row( { reason: 'lockdown' } ),
			detail: { host: { result: 'failed', reason: 'host_off' } },
		} );

		expect(
			screen.getByText(
				'example.com hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up. Your host’s mail couldn’t send it either. Ask your host to turn on email for your site.'
			)
		).toBeVisible();
		expect( actionNames() ).toEqual( [ 'Check your records' ] );
	} );

	it( 'falls back to the host outcome’s action when Send’s reason has none', () => {
		renderNotice( {
			row: row( { reason: 'unsupported' } ),
			detail: { host: { result: 'failed', reason: 'host_off' } },
		} );

		expect( actionNames() ).toEqual( [ 'Copy details' ] );
	} );

	it.each( [ 'no_answer', 'unclear' ] )(
		'doesn’t say a %s email wasn’t sent, since it may still arrive',
		reason => {
			renderNotice( { row: row( { reason } ) } );

			expect( screen.getByText( 'Jetpack Send isn’t sure this went out.' ) ).toBeVisible();
			expect( screen.queryByText( /couldn’t send this/ ) ).not.toBeInTheDocument();
		}
	);

	it( 'says when the email limit resets for an email stopped this month', () => {
		const now = new Date().toISOString().replace( 'T', ' ' ).slice( 0, 19 );
		renderNotice( { row: row( { reason: 'limit', created_at: now } ) } );

		expect( screen.getByText( /Emails go out again when it resets on \w+ 1\./ ) ).toBeVisible();
	} );

	it( 'leaves the reset date out for an email stopped in an earlier month', () => {
		renderNotice( { row: row( { reason: 'limit', created_at: '2025-01-05 10:00:00' } ) } );

		expect( screen.getByText( /Emails go out again when it resets\. / ) ).toBeVisible();
	} );

	it( 'reads an older row’s error text when it has no stored reason', () => {
		renderNotice( {
			row: row( { reason: '', error: 'HTTP 403: Can only send to verified email addresses' } ),
		} );

		expect( screen.getByRole( 'link', { name: /Contact support/ } ) ).toHaveAttribute(
			'href',
			SUPPORT_URL
		);
	} );
} );
