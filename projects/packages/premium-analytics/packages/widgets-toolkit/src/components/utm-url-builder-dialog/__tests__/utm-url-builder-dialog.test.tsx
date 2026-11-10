/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { UtmUrlBuilderDialog } from '../utm-url-builder-dialog';

const originalClipboard = Object.getOwnPropertyDescriptor( navigator, 'clipboard' );

beforeEach( () => {
	jest.useFakeTimers();
} );

afterEach( () => {
	jest.useRealTimers();
	if ( originalClipboard ) {
		Object.defineProperty( navigator, 'clipboard', originalClipboard );
	} else {
		delete ( navigator as Navigator & { clipboard?: Clipboard } ).clipboard;
	}
} );

it( 'copies encoded UTM values, keeps the destination query and fragment, and stays open', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	const writeText = jest.fn().mockResolvedValue( undefined );
	Object.defineProperty( navigator, 'clipboard', { configurable: true, value: { writeText } } );
	const onClose = jest.fn();
	render( <UtmUrlBuilderDialog onClose={ onClose } /> );

	await user.type(
		screen.getByRole( 'textbox', { name: 'Destination URL' } ),
		'https://example.com/landing?ref=email&utm_source=old#intro'
	);
	await user.type( screen.getByRole( 'textbox', { name: 'UTM campaign' } ), 'spring sale' );
	await user.type( screen.getByRole( 'textbox', { name: 'UTM source' } ), 'newsletter' );
	await user.type( screen.getByRole( 'textbox', { name: 'UTM medium' } ), 'email & social' );
	await user.click( screen.getByRole( 'button', { name: 'Copy to clipboard' } ) );

	const copied = new URL( writeText.mock.calls[ 0 ][ 0 ] );
	expect( copied.searchParams.get( 'ref' ) ).toBe( 'email' );
	expect( copied.searchParams.get( 'utm_campaign' ) ).toBe( 'spring sale' );
	expect( copied.searchParams.get( 'utm_source' ) ).toBe( 'newsletter' );
	expect( copied.searchParams.get( 'utm_medium' ) ).toBe( 'email & social' );
	expect( copied.hash ).toBe( '#intro' );
	await expect( screen.findByRole( 'button', { name: 'Copied!' } ) ).resolves.toBeInTheDocument();
	expect( onClose ).not.toHaveBeenCalled();
	expect( screen.getByRole( 'textbox', { name: 'UTM campaign' } ) ).toHaveValue( 'spring sale' );
} );

it.each( [
	[
		'the URL is edited',
		( user: ReturnType< typeof userEvent.setup > ) =>
			user.type( screen.getByRole( 'textbox', { name: 'UTM medium' } ), 'email' ),
	],
	[ 'four seconds pass', async () => act( () => jest.advanceTimersByTime( 4000 ) ) ],
] )( 'stops confirming the copy once %s', async ( _reason, change ) => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	Object.defineProperty( navigator, 'clipboard', {
		configurable: true,
		value: { writeText: jest.fn().mockResolvedValue( undefined ) },
	} );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );
	await user.type(
		screen.getByRole( 'textbox', { name: 'Destination URL' } ),
		'https://example.com/'
	);
	await user.type( screen.getByRole( 'textbox', { name: 'UTM source' } ), 'newsletter' );
	await user.click( screen.getByRole( 'button', { name: 'Copy to clipboard' } ) );
	await expect( screen.findByRole( 'button', { name: 'Copied!' } ) ).resolves.toBeInTheDocument();

	await change( user );

	expect( screen.getByRole( 'button', { name: 'Copy to clipboard' } ) ).toBeInTheDocument();
} );

it( 'does not offer a share URL for an invalid destination or no UTM parameters', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	const writeText = jest.fn().mockResolvedValue( undefined );
	Object.defineProperty( navigator, 'clipboard', { configurable: true, value: { writeText } } );
	const onClose = jest.fn();
	render( <UtmUrlBuilderDialog onClose={ onClose } /> );
	const destination = screen.getByRole( 'textbox', { name: 'Destination URL' } );
	const source = screen.getByRole( 'textbox', { name: 'UTM source' } );
	const copy = screen.getByRole( 'button', { name: 'Copy to clipboard' } );

	await user.type( destination, 'javascript:alert(1)' );
	await user.type( source, 'newsletter' );
	expect( copy ).toHaveAttribute( 'aria-disabled', 'true' );

	await user.clear( destination );
	await user.type( destination, 'https://example.com/' );
	expect( copy ).toHaveAttribute( 'aria-disabled', 'false' );
	await user.clear( source );
	expect( copy ).toHaveAttribute( 'aria-disabled', 'true' );
	await user.type( source, '   ' );
	expect( copy ).toHaveAttribute( 'aria-disabled', 'true' );
	await user.click( copy );
	expect( writeText ).not.toHaveBeenCalled();
	expect( onClose ).not.toHaveBeenCalled();
} );

it( 'drops a UTM value the destination carries when its field is left empty', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );

	await user.type(
		screen.getByRole( 'textbox', { name: 'Destination URL' } ),
		'https://example.com/?utm_medium=old'
	);
	await user.type( screen.getByRole( 'textbox', { name: 'UTM source' } ), 'newsletter' );

	const shared = new URL( screen.getByText( /utm_source=newsletter/ ).textContent ?? '' );
	expect( shared.searchParams.has( 'utm_medium' ) ).toBe( false );
} );

it( 'fills the fields and the tracked URL from initialValues', () => {
	render(
		<UtmUrlBuilderDialog
			onClose={ jest.fn() }
			initialValues={ {
				destination: 'https://example.com/post',
				campaign: 'spring',
				source: 'google',
				medium: 'cpc',
			} }
		/>
	);

	expect( screen.getByRole( 'textbox', { name: 'Destination URL' } ) ).toHaveValue(
		'https://example.com/post'
	);
	expect( screen.getByRole( 'textbox', { name: 'UTM campaign' } ) ).toHaveValue( 'spring' );
	expect( screen.getByRole( 'textbox', { name: 'UTM source' } ) ).toHaveValue( 'google' );
	expect( screen.getByRole( 'textbox', { name: 'UTM medium' } ) ).toHaveValue( 'cpc' );
	expect(
		screen.getByText(
			'https://example.com/post?utm_campaign=spring&utm_source=google&utm_medium=cpc'
		)
	).toBeInTheDocument();
} );

it( 'asks for the destination when only UTM parameters are filled', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );

	await user.type( screen.getByRole( 'textbox', { name: 'UTM source' } ), 'newsletter' );

	expect( screen.getByText( 'Enter a destination URL to see the URL' ) ).toBeInTheDocument();
	expect(
		screen.queryByText( 'Fill out campaign parameters to see the URL' )
	).not.toBeInTheDocument();
} );

it( 'asks for a protocol once the destination without one loses focus', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );
	const destination = screen.getByRole( 'textbox', { name: 'Destination URL' } );
	const hint = 'Enter a full URL that starts with https:// or http://.';

	await user.type( destination, 'example.com' );
	expect( screen.queryByText( hint ) ).not.toBeInTheDocument();
	await user.tab();
	expect( destination ).toHaveAccessibleDescription( hint );

	await user.clear( destination );
	await user.type( destination, 'https://example.com' );
	expect( screen.queryByText( hint ) ).not.toBeInTheDocument();
} );
