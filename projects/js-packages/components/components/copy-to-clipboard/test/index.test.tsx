import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopyToClipboard from '../index.tsx';

// ClipboardJS calls document.execCommand under the hood; jsdom doesn't
// implement it, so we seed a stub before each test so clipboard.js can fire
// its "success" event.
beforeEach( () => {
	Object.defineProperty( document, 'execCommand', {
		configurable: true,
		value: jest.fn( () => true ),
	} );
} );

describe( 'CopyToClipboard', () => {
	it( 'renders an icon-only button by default', () => {
		render( <CopyToClipboard textToCopy="hello" /> );
		const button = screen.getByRole( 'button', { name: 'Copy' } );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveClass( 'has-icon' );
	} );

	it( 'renders with the consumer-provided children as the idle label in icon-text mode', () => {
		render(
			<CopyToClipboard buttonStyle="icon-text" textToCopy="hello">
				Copy the thing
			</CopyToClipboard>
		);
		expect( screen.getByRole( 'button', { name: 'Copy' } ) ).toHaveTextContent( 'Copy the thing' );
	} );

	it( 'wires useCopyToClipboard to the Button DOM node: clicking triggers the onCopy callback', async () => {
		const user = userEvent.setup();
		const onCopy = jest.fn();
		render( <CopyToClipboard textToCopy="hello" onCopy={ onCopy } /> );

		await user.click( screen.getByRole( 'button', { name: 'Copy' } ) );
		expect( onCopy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'uses custom copyMessage as the accessible name', () => {
		render(
			<CopyToClipboard
				buttonStyle="text"
				textToCopy="hello"
				copyMessage="Copy embed code"
				copiedMessage="Embed code copied!"
			/>
		);
		expect( screen.getByRole( 'button', { name: 'Copy embed code' } ) ).toBeInTheDocument();
	} );
} );
