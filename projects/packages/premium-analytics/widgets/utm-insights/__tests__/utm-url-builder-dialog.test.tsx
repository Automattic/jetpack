/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { UtmUrlBuilderDialog } from '../utm-url-builder-dialog';

const mockCreateSuccessNotice = jest.fn();
// A spread of the real module reads its lazy exports too early, so only `useDispatch` is swapped.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get: ( target, name ) =>
			name === 'useDispatch'
				? () => ( { createSuccessNotice: mockCreateSuccessNotice } )
				: target[ name ],
	} );
} );

const originalClipboard = Object.getOwnPropertyDescriptor( navigator, 'clipboard' );

beforeEach( () => {
	jest.useFakeTimers();
	mockCreateSuccessNotice.mockClear();
} );

afterEach( () => {
	jest.useRealTimers();
	if ( originalClipboard ) {
		Object.defineProperty( navigator, 'clipboard', originalClipboard );
	} else {
		delete ( navigator as Navigator & { clipboard?: Clipboard } ).clipboard;
	}
} );

it( 'copies encoded UTM values, keeps the destination query and fragment, and closes', async () => {
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
	expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
		'Copied URL to clipboard.',
		expect.objectContaining( { type: 'snackbar' } )
	);
	expect( onClose ).toHaveBeenCalledTimes( 1 );
} );

it( 'keeps the dialog open and reports a failed copy', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	const writeText = jest.fn().mockRejectedValue( new Error( 'denied' ) );
	Object.defineProperty( navigator, 'clipboard', { configurable: true, value: { writeText } } );
	const onClose = jest.fn();
	render( <UtmUrlBuilderDialog onClose={ onClose } /> );

	await user.type(
		screen.getByRole( 'textbox', { name: 'Destination URL' } ),
		'https://example.com/'
	);
	await user.type( screen.getByRole( 'textbox', { name: 'UTM source' } ), 'newsletter' );
	await user.click( screen.getByRole( 'button', { name: 'Copy to clipboard' } ) );

	await expect(
		within( screen.getByRole( 'dialog' ) ).findByText(
			'Could not copy the URL. Select it and copy it manually.'
		)
	).resolves.toBeInTheDocument();
	expect( onClose ).not.toHaveBeenCalled();
	expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
} );

it( 'does not offer a share URL for an invalid destination or no UTM parameters', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );
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

it( 'asks for a protocol when the destination has none', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );
	const destination = screen.getByRole( 'textbox', { name: 'Destination URL' } );
	const hint = 'Enter a full URL that starts with https:// or http://.';

	expect( screen.queryByText( hint ) ).not.toBeInTheDocument();
	await user.type( destination, 'example.com' );
	expect( destination ).toHaveAccessibleDescription( hint );

	await user.clear( destination );
	await user.type( destination, 'https://example.com' );
	expect( screen.queryByText( hint ) ).not.toBeInTheDocument();
} );
