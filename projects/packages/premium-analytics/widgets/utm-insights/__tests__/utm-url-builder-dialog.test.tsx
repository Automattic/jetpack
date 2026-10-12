/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
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

it( 'copies encoded UTM values while preserving the destination query and fragment', async () => {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	const writeText = jest.fn().mockResolvedValue( undefined );
	Object.defineProperty( navigator, 'clipboard', { configurable: true, value: { writeText } } );
	render( <UtmUrlBuilderDialog onClose={ jest.fn() } /> );

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
	await expect( screen.findByRole( 'status' ) ).resolves.toHaveTextContent(
		'Copied to clipboard.'
	);
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
