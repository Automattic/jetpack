import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';

// True-ESM Jest (`--experimental-vm-modules`): register the mock with
// `jest.unstable_mockModule`, then import the card dynamically. Stubbing the
// toggle keeps this off the module-toggle REST plumbing (and off the reload it
// performs on success).
const setActive = jest.fn();
const useSeoToolsToggle = jest.fn( () => ( { isToggling: false, setActive } ) );
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
	default: useSeoToolsToggle,
} ) );

jest.unstable_mockModule( '../../../data/is-gated', () => ( {
	isGated,
	getUpsellUrl: () => 'https://wordpress.com/checkout/example.com/value_bundle',
} ) );

const { default: AdvancedCard } = await import( '../advanced-card' );

const toggleName = 'Disable Jetpack SEO';

const expandCard = () =>
	// eslint-disable-next-line testing-library/prefer-user-event -- single click; fireEvent avoids the user-event devDep (lockfile churn).
	fireEvent.click( screen.getByRole( 'button', { name: /Advanced/ } ) );

describe( 'AdvancedCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSeoToolsToggle.mockReturnValue( { isToggling: false, setActive } );
		isGated.mockReturnValue( false );
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

	it( 'names the setting inside the module, in the heading outline', () => {
		render( <AdvancedCard /> );
		expandCard();

		// "Advanced" names the group, not what's in it, so the setting says what it is.
		const subtitle = screen.getByText( 'Disable Jetpack’s SEO tools' );
		expect( subtitle.className ).toMatch( /heading-md/ );
		// A real `h3` under the card's `h2`: `Text` renders a `<span>` by default, which
		// would leave heading navigation with "Advanced" and nothing beneath it.
		expect( subtitle.tagName ).toBe( 'H3' );
		expect(
			screen.getByRole( 'heading', { level: 3, name: /Disable Jetpack’s SEO tools/ } )
		).toBeInTheDocument();
	} );

	it( 'introduces the consequence list as a list', () => {
		render( <AdvancedCard /> );
		expandCard();

		// The lead-in shares the sub-heading treatment, so it doesn't render smaller
		// than the list it introduces (`heading-sm` is the 11px uppercase field label).
		expect( screen.getByText( 'While it’s off:' ).className ).toMatch( /heading-md/ );

		// The explicit `role="list"` is asserted as an attribute, not via `getByRole`:
		// a `<ul>` carries the role implicitly in jsdom, so a role query passes either
		// way. It's there because `.effects` sets `list-style: none` to draw its own
		// bullets, and Safari/VoiceOver drops list semantics from a list styled that
		// way — a browser behaviour jsdom doesn't model, so the attribute is all we can
		// pin here. (The class name isn't assertable at all: jest stubs CSS-module
		// names to an empty string.)
		const list = screen.getByRole( 'list' );
		expect( list ).toHaveAttribute( 'role', 'list' );
		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( 5 );
	} );

	it( 'spells out what stops, including the front-end output', () => {
		render( <AdvancedCard /> );
		expandCard();

		// Most of this is front-end output rather than settings — the old Overview
		// footer link said none of it, which is why this module exists. The first two
		// are what a site actually loses: saved titles and descriptions stop being
		// served, and deliberately hidden pages become findable again.
		expect(
			screen.getByText( /saved titles and descriptions stop being used/ )
		).toBeInTheDocument();
		expect( screen.getByText( /Pages you hid from search stop being hidden/ ) ).toBeInTheDocument();
		expect( screen.getByText( /stops adding structured data/ ) ).toBeInTheDocument();
		expect( screen.getByText( /llms\.txt file stops being served/ ) ).toBeInTheDocument();
		expect( screen.getByText( /These settings become unavailable/ ) ).toBeInTheDocument();
		// And that nothing is lost, since that's what makes it safe to try.
		expect( screen.getByText( /is kept, so turning it back on/ ) ).toBeInTheDocument();
	} );

	it( 'drops the llms.txt consequence on a plan-gated site', () => {
		isGated.mockReturnValue( true );

		render( <AdvancedCard /> );
		expandCard();

		// `Initializer::init()` registers `Llms_Txt`/`Ai_Crawlers` behind `! is_gated()`
		// and the AI tab is hidden from gated sites, so claiming these stop would
		// promise the end of something the site never had. Everything else still applies.
		expect( screen.queryByText( /llms\.txt file stops being served/ ) ).not.toBeInTheDocument();
		expect(
			screen.getByText( /saved titles and descriptions stop being used/ )
		).toBeInTheDocument();
		expect( screen.getByText( /stops adding structured data/ ) ).toBeInTheDocument();
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
		const button = screen.getByRole( 'button', { name: toggleName } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );

		// eslint-disable-next-line testing-library/prefer-user-event -- single click; see note above.
		fireEvent.click( button );
		expect( setActive ).not.toHaveBeenCalled();

		// Asserted separately from `disabled`: Button falls back to `disabled ?? loading`,
		// so `aria-disabled` alone would still pass with the busy affordance dropped.
		expect( button.className ).toMatch( /is-loading/ );
	} );
} );
