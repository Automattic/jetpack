// The nudge appears on its own and portals to the end of `<body>`, so it has to carry its own
// role and name, and it takes focus in place of a dismiss button: whatever the viewer does next
// closes it. `@wordpress/ui` is stubbed to plain elements; the real `Popover` renders so the
// assertions run against the focus and attribute behaviour it actually emits.
jest.mock( '@wordpress/ui', () => {
	// Button forwards its ref like the real one, so `HeaderActions` can hand the DOM node to the
	// nudge as its anchor.
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
		Stack: ( { children, className }: { children: React.ReactNode; className?: string } ) => (
			<div className={ className }>{ children }</div>
		),
		Text: ( { children, id }: { children: React.ReactNode; id?: string } ) => (
			<span id={ id }>{ children }</span>
		),
	};
} );

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	__esModule: true,
	recordTracksEvent: jest.fn(),
} ) );

// Imports must come after the jest.mock factories above.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCallback, useState } from '@wordpress/element';
import HeaderActions from '../_inc/subscribers/components/header-actions';
import SelfOnlyNudge from '../_inc/subscribers/components/self-only-nudge';

/**
 * Mounts the nudge against a real anchor button, mirroring how `HeaderActions` wires it up.
 *
 * @param props           - Props.
 * @param props.onDismiss - Dismissal callback under test.
 * @return Anchor button plus the nudge.
 */
function Harness( { onDismiss }: { onDismiss: () => void } ) {
	const [ anchor, setAnchor ] = useState< HTMLButtonElement | null >( null );

	return (
		<>
			<button type="button" ref={ setAnchor }>
				Add subscribers
			</button>
			<SelfOnlyNudge anchor={ anchor } onDismiss={ onDismiss } />
		</>
	);
}

describe( 'SelfOnlyNudge', () => {
	// `Popover` positions itself asynchronously, so let that settle before asserting — otherwise
	// the pending state update lands outside `act()`. It also leaves the bubble at `opacity: 0`
	// until floating-ui measures, which jsdom never does, so assert presence, not visibility.
	it( 'exposes a named role so assistive tech can reach content that appears unprompted', async () => {
		render( <Harness onDismiss={ jest.fn() } /> );

		await expect(
			screen.findByRole( 'note', { name: 'Every newsletter starts at one' } )
		).resolves.toBeInTheDocument();
	} );

	it( 'takes focus as it appears, standing in for a dismiss control', async () => {
		render( <Harness onDismiss={ jest.fn() } /> );

		await expect( screen.findByRole( 'note' ) ).resolves.toHaveFocus();
	} );

	it( 'closes once focus lands anywhere else', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );
		await expect( screen.findByRole( 'note' ) ).resolves.toHaveFocus();

		// `Popover` defers the focus-outside check by a tick, so wait it out rather than asserting
		// straight after the blur.
		act( () => {
			screen.getByRole( 'button', { name: 'Add subscribers' } ).focus();
		} );

		await waitFor( () => expect( onDismiss ).toHaveBeenCalled() );
	} );

	it( 'hands focus back to the anchor on Escape', async () => {
		const onDismiss = jest.fn();
		render( <Harness onDismiss={ onDismiss } /> );
		const note = await screen.findByRole( 'note' );

		// The package doesn't pull in @testing-library/user-event, so dispatch the key directly.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown( note, { key: 'Escape' } );

		expect( onDismiss ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Add subscribers' } ) ).toHaveFocus();
	} );

	it( 'renders nothing until the anchor mounts', () => {
		render( <SelfOnlyNudge anchor={ null } onDismiss={ jest.fn() } /> );

		expect( screen.queryByRole( 'note' ) ).not.toBeInTheDocument();
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
	 * Dismisses the nudge the way a viewer does — by putting focus somewhere else — having waited
	 * for `Popover` to finish positioning it.
	 */
	async function dismiss() {
		await expect( screen.findByRole( 'note' ) ).resolves.toHaveFocus();
		act( () => {
			screen.getByRole( 'button', { name: 'Add subscribers' } ).focus();
		} );
		await waitFor( () => expect( screen.queryByRole( 'note' ) ).not.toBeInTheDocument() );
	}

	it( 'survives a search hiding and then re-showing the nudge', async () => {
		const { rerender } = render( <BodyHarness isSelfOnly isMounted /> );
		await dismiss();

		// A search drops the self-only state; clearing it brings the state back, but not the nudge.
		rerender( <BodyHarness isSelfOnly={ false } isMounted /> );
		rerender( <BodyHarness isSelfOnly isMounted /> );

		expect( screen.queryByRole( 'note' ) ).not.toBeInTheDocument();
	} );

	it( 'survives a hop to the Settings tab and back, which unmounts the header row', async () => {
		const { rerender } = render( <BodyHarness isSelfOnly isMounted /> );
		await dismiss();

		rerender( <BodyHarness isSelfOnly isMounted={ false } /> );
		expect( screen.queryByRole( 'button', { name: 'Add subscribers' } ) ).not.toBeInTheDocument();
		rerender( <BodyHarness isSelfOnly isMounted /> );

		expect( screen.getByRole( 'button', { name: 'Add subscribers' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'note' ) ).not.toBeInTheDocument();
	} );
} );
