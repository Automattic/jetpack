import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { applyCloudflare } from '../../../../data/api';
import CloudflareConnect, { cloudflareTokenUrl, optionalRecordNote } from '../cloudflare-connect';
import type { CloudflareApplyResult, SendStatus } from '../../../../data/types';

jest.mock( '../../../../data/api', () => ( {
	applyCloudflare: jest.fn(),
	errorMessage: ( error: { message?: string } ) => error?.message ?? 'Something went wrong.',
} ) );
jest.mock( '../../../../data/store', () => ( { sendStore: {} } ) );
const mockReceiveStatus = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { receiveStatus: mockReceiveStatus } ),
} ) );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const mockApply = applyCloudflare as jest.MockedFunction< typeof applyCloudflare >;
const TOKEN = 'cfTokenAbc123_secret-VALUE-xyz7890';
const status = { can_enable: false } as SendStatus;

const result = ( overrides: Partial< CloudflareApplyResult > = {} ): CloudflareApplyResult => ( {
	success: true,
	records: [
		{ purpose: 'lockdown', name: '_mailchannels.example.com', action: 'created' },
		{ purpose: 'dkim', name: 'jpsend._domainkey.example.com', action: 'created' },
	],
	status,
	...overrides,
} );

const setup = () => {
	const onApplied = jest.fn();
	const onCancel = jest.fn();
	render(
		<CloudflareConnect domain="example.com" onApplied={ onApplied } onCancel={ onCancel } />
	);
	return { onApplied, onCancel, user: userEvent.setup() };
};

const field = () => screen.getByLabelText( 'API token' ) as HTMLInputElement;
const submit = () => screen.getByRole( 'button', { name: 'Add records' } );

describe( 'CloudflareConnect', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'focuses the token field and links to the pre-filled token page in a new tab', () => {
		setup();
		expect( field() ).toHaveFocus();
		const link = screen.getByRole( 'link', { name: /How to make a token/ } );
		expect( link ).toHaveAttribute( 'href', cloudflareTokenUrl( 'example.com' ) );
		expect( link ).toHaveAttribute( 'target', '_blank' );

		const url = new URL( cloudflareTokenUrl( 'example.com' ) );
		expect( url.origin + url.pathname ).toBe( 'https://dash.cloudflare.com/profile/api-tokens' );
		expect( JSON.parse( url.searchParams.get( 'permissionGroupKeys' ) ?? '' ) ).toEqual( [
			{ key: 'dns', type: 'edit' },
		] );
		expect( url.searchParams.get( 'name' ) ).toBe( 'Jetpack Send example.com' );
	} );

	it( 'sends the trimmed key once, then hands the result back', async () => {
		const { onApplied, user } = setup();
		const applied = result();
		mockApply.mockResolvedValue( applied );

		expect( field() ).toHaveAttribute( 'type', 'password' );
		expect( submit() ).toHaveAttribute( 'aria-disabled', 'true' );
		await user.type( field(), `  ${ TOKEN } ` );
		await user.click( submit() );

		await waitFor( () => expect( onApplied ).toHaveBeenCalledWith( applied ) );
		expect( mockApply ).toHaveBeenCalledTimes( 1 );
		expect( mockApply ).toHaveBeenCalledWith( TOKEN );
		expect( mockReceiveStatus ).toHaveBeenCalledWith( status );
		expect( speak ).toHaveBeenCalledWith( 'Records added. Checking for them now.' );
		expect( field().value ).toBe( '' );
	} );

	it.each( [
		[ 'jetpack_send_cloudflare_bad_token', 'That token didn’t work. Check you copied all of it.' ],
		[
			'jetpack_send_cloudflare_forbidden',
			'That token can only read DNS. Make one that can edit it.',
		],
	] )(
		'says plainly why a %s token failed and returns focus to the field',
		async ( code, text ) => {
			const { onApplied, user } = setup();
			mockApply.mockRejectedValue( { code, message: 'Raw server message.' } );

			await user.type( field(), `${ TOKEN }{Enter}` );

			await expect( screen.findByText( text ) ).resolves.toBeInTheDocument();
			expect( field() ).toHaveAttribute( 'aria-invalid', 'true' );
			await waitFor( () => expect( field() ).toHaveFocus() );
			expect( field().value ).toBe( '' );
			expect( speak ).toHaveBeenCalledWith( text, 'assertive' );
			expect( onApplied ).not.toHaveBeenCalled();
		}
	);

	it( 'keeps the token and shows the message when Cloudflare asks to slow down', async () => {
		const { onApplied, user } = setup();
		const message = 'Cloudflare asked us to slow down.';
		mockApply.mockRejectedValue( { code: 'jetpack_send_cloudflare_rate_limited', message } );

		await user.type( field(), TOKEN );
		await user.click( submit() );

		await expect( screen.findByText( message ) ).resolves.toBeInTheDocument();
		expect( field().value ).toBe( TOKEN );
		expect( field() ).not.toHaveAttribute( 'aria-invalid', 'true' );
		expect( onApplied ).not.toHaveBeenCalled();
	} );

	it( 'goes on when only the optional sender list was left out, and says why', async () => {
		const { onApplied, user } = setup();
		const applied = result( {
			records: [
				...result().records,
				{
					purpose: 'spf',
					name: 'example.com',
					action: 'skipped',
					optional: true,
					reason: 'email_routing',
				},
			],
		} );
		mockApply.mockResolvedValueOnce( applied );

		await user.type( field(), TOKEN );
		await user.click( submit() );

		await waitFor( () => expect( onApplied ).toHaveBeenCalledWith( applied ) );
		expect( speak ).toHaveBeenCalledWith(
			'Records added. Checking for them now. We left your domain’s sender list as it is, because Cloudflare Email Routing manages it. Sending doesn’t need it.'
		);
		expect( screen.queryByText( 'Some records didn’t go in' ) ).not.toBeInTheDocument();
	} );

	it( 'names the records that failed, and Cancel closes the form', async () => {
		const { onApplied, onCancel, user } = setup();
		mockApply.mockResolvedValue(
			result( {
				success: false,
				records: [
					{ purpose: 'lockdown', name: '_mailchannels.example.com', action: 'created' },
					{
						purpose: 'dkim',
						name: 'jpsend._domainkey.example.com',
						action: 'failed',
						error: 'There’s an old record with the same name.',
					},
				],
			} )
		);

		await user.type( field(), TOKEN );
		await user.click( submit() );

		await expect(
			screen.findByText(
				'Proves the emails are really yours: There’s an old record with the same name.'
			)
		).resolves.toBeInTheDocument();
		expect( mockReceiveStatus ).toHaveBeenCalledWith( status );
		expect( onApplied ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( onCancel ).toHaveBeenCalled();
	} );
} );

describe( 'optionalRecordNote', () => {
	const spf = ( extra: Partial< CloudflareApplyResult[ 'records' ][ number ] > ) =>
		result( {
			records: [
				{ purpose: 'spf', name: 'example.com', action: 'updated', optional: true, ...extra },
			],
		} );

	it.each( [
		[
			'Email Routing’s locked list',
			{ action: 'skipped', reason: 'email_routing' },
			/Email Routing manages it/,
		],
		[ 'another locked list', { action: 'skipped', reason: 'locked' }, /Cloudflare has locked it/ ],
		[ 'a list Cloudflare refused', { action: 'failed', error: 'No' }, /couldn’t add Jetpack/ ],
	] as const )( 'explains %s, and that sending doesn’t need it', ( _, extra, text ) => {
		const note = optionalRecordNote( spf( extra ) );
		expect( note ).toMatch( text );
		expect( note ).toMatch( /Sending doesn’t need it\.$/ );
	} );

	it.each( [ 'created', 'updated', 'unchanged' ] as const )(
		'says nothing when it was %s',
		action => {
			expect( optionalRecordNote( spf( { action } ) ) ).toBe( '' );
		}
	);
} );
