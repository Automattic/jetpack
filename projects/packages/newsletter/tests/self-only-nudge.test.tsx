jest.mock( '@wordpress/ui', () => {
	const { forwardRef } = jest.requireActual( 'react' );

	return {
		__esModule: true,
		Button: forwardRef(
			(
				{ children, ...props }: { children: React.ReactNode },
				ref: React.Ref< HTMLButtonElement >
			) => (
				<button type="button" ref={ ref } { ...props }>
					{ children }
				</button>
			)
		),
		Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
	};
} );

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	__esModule: true,
	recordTracksEvent: jest.fn(),
} ) );

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCallback, useState } from '@wordpress/element';
import HeaderActions from '../_inc/subscribers/components/header-actions';
import SelfOnlyNudge from '../_inc/subscribers/components/self-only-nudge';

/**
 * Mounts the nudge against a real anchor button, mirroring how `HeaderActions` wires it up. The
 * search box stands in for somewhere the viewer's focus may already be when the nudge shows up.
 *
 * @param props           - Props.
 * @param props.onDismiss - Dismissal callback under test.
 * @param props.show      - Whether the self-only state has arrived yet.
 * @return Anchor button plus the nudge.
 */
function Harness( { onDismiss, show = true }: { onDismiss: () => void; show?: boolean } ) {
	const [ anchor, setAnchor ] = useState< HTMLButtonElement | null >( null );

	return (
		<>
			<input type="text" aria-label="Search subscribers" />
			<button type="button" ref={ setAnchor }>
				Add subscribers
			</button>
			{ show && <SelfOnlyNudge anchor={ anchor } onDismiss={ onDismiss } /> }
		</>
	);
}

describe( 'SelfOnlyNudge', () => {
	it( 'announces itself through a live region, since it appears unprompted', async () => {
		render( <Harness onDismiss={ jest.fn() } /> );

		const note = await screen.findByRole( 'status' );

		expect( note ).toHaveTextContent( 'Every newsletter starts at one' );
	} );

	it( 'leaves focus where the viewer put it when it arrives mid-visit', async () => {
		const { rerender } = render( <Harness onDismiss={ jest.fn() } show={ false } /> );
		const search = screen.getByRole( 'textbox', { name: 'Search subscribers' } );
		search.focus();

		rerender( <Harness onDismiss={ jest.fn() } show /> );
		await expect( screen.findByRole( 'status' ) ).resolves.toBeInTheDocument();

		expect( search ).toHaveFocus();
	} );

	it( 'closes when the viewer acknowledges it', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );
		await expect( screen.findByRole( 'status' ) ).resolves.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Got it' } ) );

		expect( onDismiss ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Add subscribers' } ) ).toHaveFocus();
	} );

	it( 'hands focus back to the anchor on Escape', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );
		const note = await screen.findByRole( 'status' );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown( note, { key: 'Escape' } );

		expect( onDismiss ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Add subscribers' } ) ).toHaveFocus();
	} );

	it( 'renders nothing until the anchor mounts', () => {
		render( <SelfOnlyNudge anchor={ null } onDismiss={ jest.fn() } /> );

		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );
} );

/**
 * Stands in for `SubscribersBody`, which owns the dismissal and stays mounted for the visit while
 * the header row below it comes and goes.
 *
 * @param props            - Props.
 * @param props.isSelfOnly - Whether the table currently reports a self-only list.
 * @param props.isMounted  - Whether the header row is on screen (false on the Settings tab).
 * @return The header row, when mounted.
 */
function BodyHarness( { isSelfOnly, isMounted }: { isSelfOnly: boolean; isMounted: boolean } ) {
	const [ isNudgeDismissed, setNudgeDismissed ] = useState( false );
	const dismissNudge = useCallback( () => setNudgeDismissed( true ), [] );

	if ( ! isMounted ) {
		return null;
	}

	return (
		<HeaderActions
			blogId={ 1 }
			onAddSubscribers={ jest.fn() }
			showSelfOnlyNudge={ isSelfOnly && ! isNudgeDismissed }
			onDismissSelfOnlyNudge={ dismissNudge }
		/>
	);
}

describe( 'self-only nudge dismissal', () => {
	/**
	 * Dismisses the nudge the way a viewer does, having waited for `Popover` to position it.
	 */
	async function dismiss() {
		await expect( screen.findByRole( 'status' ) ).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Got it' } ) );
		await waitFor( () => expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument() );
	}

	it( 'survives a search hiding and then re-showing the nudge', async () => {
		const { rerender } = render( <BodyHarness isSelfOnly isMounted /> );
		await dismiss();

		rerender( <BodyHarness isSelfOnly={ false } isMounted /> );
		rerender( <BodyHarness isSelfOnly isMounted /> );

		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'survives a hop to the Settings tab and back, which unmounts the header row', async () => {
		const { rerender } = render( <BodyHarness isSelfOnly isMounted /> );
		await dismiss();

		rerender( <BodyHarness isSelfOnly isMounted={ false } /> );
		expect( screen.queryByRole( 'button', { name: 'Add subscribers' } ) ).not.toBeInTheDocument();
		rerender( <BodyHarness isSelfOnly isMounted /> );

		expect( screen.getByRole( 'button', { name: 'Add subscribers' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );
} );
