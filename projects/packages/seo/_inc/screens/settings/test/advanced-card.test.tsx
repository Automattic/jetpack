import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

// True-ESM Jest (`--experimental-vm-modules`): register the mock with
// `jest.unstable_mockModule`, then import the card dynamically. Stubbing the
// toggle keeps this off the module-toggle REST plumbing (and off the reload it
// performs on success).
const setActive = jest.fn();
const useSeoToolsToggle = jest.fn( () => ( { isToggling: false, setActive } ) );

jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
	default: useSeoToolsToggle,
} ) );

const { default: AdvancedCard } = await import( '../advanced-card' );

const toggleName = 'Turn off SEO tools';

const expandCard = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Advanced/ } ) );

describe( 'AdvancedCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSeoToolsToggle.mockReturnValue( { isToggling: false, setActive } );
	} );

	it( 'starts collapsed, with a heading and nothing else in the header', () => {
		render( <AdvancedCard /> );

		const header = screen.getByRole( 'button', { name: /Advanced/ } );
		expect( header ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( screen.getByRole( 'heading', { level: 2, name: /Advanced/ } ) ).toBeInTheDocument();
		// No status and no badge: a completion indicator would grade an on/off
		// preference where both answers are legitimate. The header's accessible name
		// is the title alone, and it carries no description.
		expect( header ).toHaveAccessibleName( 'Advanced' );
		expect( header ).not.toHaveAccessibleDescription();
	} );

	it( 'keeps the control out of reach until the context has been opened', () => {
		render( <AdvancedCard /> );

		expect( screen.queryByRole( 'button', { name: toggleName } ) ).not.toBeInTheDocument();
	} );

	it( 'spells out what stops, including the front-end output', () => {
		render( <AdvancedCard /> );
		expandCard();

		// Structured data and llms.txt are front-end output, not just settings — the
		// old Overview footer link said neither, which is why this module exists.
		expect( screen.getByText( /These settings become unavailable/ ) ).toBeInTheDocument();
		expect( screen.getByText( /stops adding structured data/ ) ).toBeInTheDocument();
		expect( screen.getByText( /llms\.txt file stops being served/ ) ).toBeInTheDocument();
		// And that nothing is lost, since that's what makes it safe to try.
		expect( screen.getByText( /is kept, so turning it back on/ ) ).toBeInTheDocument();
	} );

	it( 'renders its prose as body copy, not muted explainer text', () => {
		render( <AdvancedCard /> );
		expandCard();

		// The small, light treatment is reserved for hints attached to a field. This
		// module's prose and its consequence list are things to read, so they use the
		// same body variant as ordinary paragraphs — pinned because the first version
		// of this module used `body-sm` + muted throughout and was hard to read.
		const intro = screen.getByText( /Use this only if you don’t want Jetpack optimizing/ );
		expect( intro.className ).toMatch( /body-md/ );
		expect( intro.className ).not.toMatch( /body-sm/ );

		const item = screen.getByText( /stops adding structured data/ );
		expect( item.tagName ).toBe( 'LI' );
		expect( item.className ).toMatch( /body-md/ );
	} );

	it( 'turns SEO tools off through the toggle hook', () => {
		render( <AdvancedCard /> );
		expandCard();

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( screen.getByRole( 'button', { name: toggleName } ) );

		expect( setActive ).toHaveBeenCalledWith( false );
	} );

	it( 'blocks a second click while the request is in flight', () => {
		useSeoToolsToggle.mockReturnValue( { isToggling: true, setActive } );

		render( <AdvancedCard /> );
		expandCard();

		// `@wordpress/ui`'s Button stays focusable when disabled, so it reports
		// `aria-disabled` rather than the native attribute.
		expect( screen.getByRole( 'button', { name: toggleName } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
