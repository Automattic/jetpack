import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { border, drafts, published } from '@wordpress/icons';
import { Children, isValidElement } from 'react';
import { startBenefits } from '../lib';
import { PANEL_LINES } from '../panel-type';
import { Wizard } from '../wizard';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

const exitUrl = 'http://example.com/wp-admin/admin.php?page=my-jetpack';
const dashboardUrl = 'http://example.com/wp-admin/';

const setupWizard = () => {
	const user = userEvent.setup();
	render( <Wizard exitUrl={ exitUrl } dashboardUrl={ dashboardUrl } /> );
	return user;
};

// A rail row, found by its label rather than by position.
const railStep = ( name: string ) =>
	within( screen.getByRole( 'navigation', { name: 'Setup steps' } ) ).getByRole( 'button', {
		name,
	} );

// The first path of an icon from `@wordpress/icons`, read off the package rather
// than copied into the test, so the two cannot drift apart. It is enough to tell
// the three status glyphs apart: `published` leads with its ring, `drafts` with
// its half fill, and `border` has only its dashed ring.
const firstPath = ( icon: ReactElement ): string => {
	// Not a DOM node: this is the React element the icon module exports, read
	// before it is ever rendered.
	// eslint-disable-next-line testing-library/no-node-access
	const [ first ] = Children.toArray( ( icon.props as { children?: ReactNode } ).children );
	return isValidElement( first ) ? ( first.props as { d: string } ).d : '';
};

const GLYPH_BY_PATH: Record< string, string > = {
	[ firstPath( published ) ]: 'done',
	[ firstPath( drafts ) ]: 'current',
	[ firstPath( border ) ]: 'upcoming',
};

// Which status glyph a rail row is showing: 'done', 'current', or 'upcoming'.
// The glyph is aria-hidden, as a decorative status marker should be, so there
// is no accessible query for it and the path has to be read off the SVG.
const railGlyph = ( name: string ) =>
	// eslint-disable-next-line testing-library/no-node-access
	GLYPH_BY_PATH[ railStep( name ).querySelector( 'svg path' )?.getAttribute( 'd' ) ?? '' ];

// The panel's lines are outlined SVG, so the words live in one visually hidden
// block per step, read as a sentence rather than as fragments.
const PANEL_COPY = Object.values( PANEL_LINES ).map( lines =>
	lines.map( line => line.text ).join( ' ' )
);

const panelCopy = ( step: number ) => screen.getByText( PANEL_COPY[ step ] );

// The start screen carries its own way forward; every question step after it
// needs a choice before Continue is live.
const advance = async ( user: UserEvent, times: number ) => {
	for ( let i = 0; i < times; i++ ) {
		const start = screen.queryByRole( 'button', { name: 'Get started' } );

		if ( start ) {
			await user.click( start );
			continue;
		}

		await user.click( screen.getAllByRole( 'radio' )[ 0 ] );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
	}
};

describe( 'Wizard smoke', () => {
	it( 'opens on the start screen and advances on its primary', async () => {
		const user = setupWizard();

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
			'Start with Jetpack for free'
		);
		// The start screen shows no progress of its own, so only the rail counts.
		expect( screen.getByText( 'Step 1 of 4' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Get started' } ) );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
			'What is this site for?'
		);
		// The rail names the steps and the questions column counts them, so the
		// counter is written twice from here on.
		expect( screen.getAllByText( 'Step 2 of 4' ) ).toHaveLength( 2 );
	} );

	it( 'takes the secondary route into setup too', async () => {
		const user = setupWizard();

		await user.click( screen.getByRole( 'button', { name: 'I already have an account' } ) );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
			'What is this site for?'
		);
	} );

	it( 'names what Jetpack does, one free feature group per row', () => {
		setupWizard();

		const benefits = startBenefits();

		expect( screen.getByRole( 'img', { name: 'Jetpack Logo' } ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'One plugin, and your site can do the things it usually takes five to do.' )
		).toBeInTheDocument();

		expect( benefits ).toHaveLength( 4 );
		for ( const benefit of benefits ) {
			expect( screen.getByText( benefit.text ) ).toBeInTheDocument();
		}

		// Both are paid, and this screen cannot promise what sits behind a plan.
		expect( screen.queryByText( /VideoPress|Backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'points the terms at the real Jetpack pages', () => {
		setupWizard();

		expect( screen.getByRole( 'link', { name: /Terms of Service/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=wpcom-tos'
		);
		expect( screen.getByRole( 'link', { name: /sync your site’s data/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
		);
	} );

	it( 'keeps the exit in the footer but not a second primary', async () => {
		const user = setupWizard();

		expect( screen.getByRole( 'link', { name: 'Skip setup' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Continue' } ) ).not.toBeInTheDocument();

		await advance( user, 1 );
		expect( screen.getByRole( 'button', { name: 'Continue' } ) ).toBeInTheDocument();
	} );

	it( 'gates Continue on the question steps', async () => {
		const user = setupWizard();

		await advance( user, 1 );

		const cont = screen.getByRole( 'button', { name: 'Continue' } );
		expect( cont ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( screen.getAllByRole( 'radio' )[ 0 ] );
		expect( cont ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'sends the rail out to WordPress and the footer back to My Jetpack', () => {
		setupWizard();

		const railExit = screen.getByRole( 'link', { name: 'Back to WordPress' } );
		const skip = screen.getByRole( 'link', { name: 'Skip setup' } );

		expect( railExit ).toHaveAttribute( 'href', dashboardUrl );
		expect( skip ).toHaveAttribute( 'href', exitUrl );

		// Two exits, two destinations: the rail leaves Jetpack, the footer stays in it.
		expect( railExit.getAttribute( 'href' ) ).not.toBe( skip.getAttribute( 'href' ) );
	} );

	it( 'lists every step in the rail, marking the current one', async () => {
		const user = setupWizard();

		const rail = screen.getByRole( 'navigation', { name: 'Setup steps' } );
		expect( within( rail ).getByRole( 'list' ) ).toBeInTheDocument();
		expect(
			within( rail )
				.getAllByRole( 'button' )
				.map( row => row.textContent )
		).toEqual( [ 'Connect', 'Your site', 'What you need', 'Finish' ] );

		// Core marks the current row aria-current="true", not "step".
		expect( railStep( 'Connect' ) ).toHaveAttribute( 'aria-current', 'true' );
		expect( railStep( 'Your site' ) ).not.toHaveAttribute( 'aria-current' );

		await advance( user, 1 );
		expect( railStep( 'Your site' ) ).toHaveAttribute( 'aria-current', 'true' );
		expect( railStep( 'Connect' ) ).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'shows the current step half filled and every step ahead of it dashed', () => {
		setupWizard();

		expect( railGlyph( 'Connect' ) ).toBe( 'current' );
		expect( railGlyph( 'Your site' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'What you need' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'Finish' ) ).toBe( 'upcoming' );

		// Nothing is done before anything has been left.
		expect( [ 'Connect', 'Your site', 'What you need', 'Finish' ].map( railGlyph ) ).not.toContain(
			'done'
		);
	} );

	it( 'ticks the steps behind the current one and leaves unreached steps dashed', async () => {
		const user = setupWizard();

		await advance( user, 1 );

		expect( railGlyph( 'Connect' ) ).toBe( 'done' );
		expect( railGlyph( 'Your site' ) ).toBe( 'current' );
		// The trap: a step the user has never seen must never take the tick.
		expect( railGlyph( 'What you need' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'Finish' ) ).toBe( 'upcoming' );
	} );

	it( 'reads the glyphs off the current step, not off the furthest one reached', async () => {
		const user = setupWizard();

		await advance( user, 2 );
		expect( railGlyph( 'What you need' ) ).toBe( 'current' );

		await user.click( railStep( 'Connect' ) );

		// Ground already covered stays clickable, but it is ahead of the user
		// again, so it is dashed rather than ticked.
		expect( railStep( 'What you need' ) ).not.toHaveAttribute( 'aria-disabled' );
		expect( railGlyph( 'Connect' ) ).toBe( 'current' );
		expect( railGlyph( 'Your site' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'What you need' ) ).toBe( 'upcoming' );
	} );

	it( 'marks unreached steps aria-disabled, never disabled, and keeps them focusable', () => {
		setupWizard();

		const unreached = railStep( 'Your site' );
		expect( unreached ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( unreached ).toBeEnabled();

		unreached.focus();
		expect( unreached ).toHaveFocus();
	} );

	it( 'ignores a click on a step beyond the furthest reached', async () => {
		const user = setupWizard();

		await user.click( railStep( 'What you need' ) );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
			'Start with Jetpack for free'
		);
	} );

	it( 'goes back to a step already reached when its rail row is clicked', async () => {
		const user = setupWizard();

		await advance( user, 2 );
		expect( railStep( 'What you need' ) ).not.toHaveAttribute( 'aria-disabled' );

		await user.click( railStep( 'Connect' ) );
		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
			'Start with Jetpack for free'
		);

		// Ground already covered stays reachable after stepping back.
		expect( railStep( 'What you need' ) ).not.toHaveAttribute( 'aria-disabled' );
	} );

	it( 'gives every step its own panel copy, and shows only the current one', async () => {
		const user = setupWizard();

		expect( panelCopy( 0 ) ).toBeInTheDocument();
		expect( screen.queryByText( PANEL_COPY[ 1 ] ) ).not.toBeInTheDocument();

		for ( const step of [ 1, 2, 3 ] ) {
			await advance( user, 1 );
			expect( panelCopy( step ) ).toBeInTheDocument();
			expect( screen.queryByText( PANEL_COPY[ step - 1 ] ) ).not.toBeInTheDocument();
		}
	} );

	it( 'draws the lines as outlines, flipped out of y-up font coordinates', () => {
		setupWizard();

		// eslint-disable-next-line testing-library/no-node-access
		const svgs = Array.from( panelCopy( 0 ).parentElement?.querySelectorAll( 'svg' ) ?? [] );

		// One per line, and hidden: the words are carried by the copy above
		// instead. Counted off the data, because the start screen's copy is
		// three lines where every other step's is two.
		expect( svgs ).toHaveLength( PANEL_LINES[ 0 ].length );
		expect( svgs.every( svg => svg.getAttribute( 'aria-hidden' ) === 'true' ) ).toBe( true );

		// The box is the font's, and the flip is what keeps the glyphs right way up.
		expect( svgs[ 0 ] ).toHaveAttribute(
			'viewBox',
			expect.stringMatching( /^0 -1037 [\d.]+ 1326$/ )
		);
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			svgs.map( svg => svg.querySelector( 'g' )?.getAttribute( 'transform' ) )
		).toEqual( PANEL_LINES[ 0 ].map( () => 'scale(1, -1)' ) );
	} );

	it( 'joins the three start-screen lines into one hidden sentence', () => {
		setupWizard();

		// The start screen's copy runs to three lines where every other step's
		// runs to two, and the three are read as one sentence, not as fragments.
		expect( PANEL_LINES[ 0 ] ).toHaveLength( 3 );
		expect( panelCopy( 0 ) ).toHaveTextContent(
			'Grow your audience. Speed up your site. Keep it secure.'
		);
	} );

	it( 'marks the chosen option as checked', async () => {
		const user = setupWizard();

		await advance( user, 1 );

		const [ first, second ] = screen.getAllByRole( 'radio' );
		expect( first ).not.toBeChecked();

		await user.click( second );
		expect( second ).toBeChecked();
		expect( first ).not.toBeChecked();
	} );

	it( 'offers Back only once a step has been left', async () => {
		const user = setupWizard();

		expect( screen.queryByRole( 'button', { name: 'Back' } ) ).not.toBeInTheDocument();

		await advance( user, 1 );
		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent(
			'Start with Jetpack for free'
		);
	} );

	it( 'replaces Continue with Finish on the last step', async () => {
		const user = setupWizard();

		await advance( user, 3 );

		expect( screen.queryByRole( 'button', { name: 'Continue' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Finish' } ) ).toHaveAttribute( 'href', exitUrl );
	} );
} );
