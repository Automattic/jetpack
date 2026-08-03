// The nudge appears on its own, so it has to be reachable without stealing the page's focus:
// `@wordpress/ui`'s Popover names it via `Popover.Title` and describes it via
// `Popover.Description`, which is what makes `initialFocus={ false }` safe to use here.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCallback, useState } from 'react';
import SelfOnlyNudge from '../_inc/subscribers/components/self-only-nudge';

/**
 * Focuses an element the way a Tab press would. Wrapped in `act` because the ✕ carries a tooltip
 * that opens on focus, and a bare `.focus()` would leave that state update outside React's batch.
 *
 * @param element - Element to focus.
 */
function focus( element: HTMLElement ) {
	act( () => element.focus() );
}

/**
 * Renders the nudge against a real anchor and drops it on dismissal, the way `HeaderActions` and
 * `SubscribersBody` do between them. The unmount is what the focus assertions hang on.
 *
 * @param props           - Component props.
 * @param props.onDismiss - Spied on, then the nudge is unmounted.
 * @return Anchor button, an unrelated field, and the nudge.
 */
function Harness( { onDismiss }: { onDismiss: ( reason: string ) => void } ) {
	const [ anchor, setAnchor ] = useState< HTMLButtonElement | null >( null );
	const [ dismissed, setDismissed ] = useState( false );
	const handleDismiss = useCallback(
		( reason: string ) => {
			onDismiss( reason );
			setDismissed( true );
		},
		[ onDismiss ]
	);
	return (
		<>
			<button ref={ setAnchor }>Add subscribers</button>
			<input aria-label="Search subscribers" />
			{ ! dismissed && <SelfOnlyNudge anchor={ anchor } onDismiss={ handleDismiss } /> }
		</>
	);
}

describe( 'SelfOnlyNudge', () => {
	it( 'exposes a named, described dialog without taking focus off the page', async () => {
		render( <Harness onDismiss={ jest.fn() } /> );

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Every newsletter starts at one',
		} );
		expect( dialog ).toHaveAccessibleDescription( /friends, family, coworkers/ );
		expect( document.body ).toHaveFocus();
	} );

	it( 'reports the reason when dismissed so an intentional close stays distinguishable', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );

		// `fireEvent` rather than `userEvent`: this package doesn't depend on
		// `@testing-library/user-event`, and a plain click is all this asserts.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( await screen.findByRole( 'button', { name: 'Dismiss' } ) );

		await waitFor( () => expect( onDismiss ).toHaveBeenCalledWith( 'close-press' ) );
	} );

	it( 'survives a click that landed elsewhere on the page', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );
		const dialog = await screen.findByRole( 'dialog' );

		/* eslint-disable testing-library/prefer-user-event */
		fireEvent.pointerDown( document.body );
		fireEvent.mouseDown( document.body );
		fireEvent.click( document.body );
		/* eslint-enable testing-library/prefer-user-event */

		expect( onDismiss ).not.toHaveBeenCalled();
		expect( dialog ).toBeInTheDocument();
	} );

	// Base UI binds Escape on the document, so every press on the page reaches the nudge —
	// including the ones closing a DataViews dropdown or clearing the search field.
	it( 'survives an Escape aimed at something else on the page', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );
		const dialog = await screen.findByRole( 'dialog' );
		const field = screen.getByLabelText( 'Search subscribers' );
		focus( field );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown( field, { key: 'Escape' } );

		expect( onDismiss ).not.toHaveBeenCalled();
		expect( dialog ).toBeInTheDocument();
	} );

	it( 'hands focus back to the anchor when the ✕ is taken from the keyboard', async () => {
		render( <Harness onDismiss={ jest.fn() } /> );
		const dismiss = await screen.findByRole( 'button', { name: 'Dismiss' } );
		focus( dismiss );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( dismiss );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		expect( screen.getByRole( 'button', { name: 'Add subscribers' } ) ).toHaveFocus();
	} );

	it( 'renders nothing until the anchor mounts', () => {
		const { container } = render( <SelfOnlyNudge anchor={ null } onDismiss={ jest.fn() } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
