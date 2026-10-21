import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useViewportMatch } from '@wordpress/compose';
import { StrictMode } from '@wordpress/element';
import { SnackbarNotices } from '@wordpress/notices';
import analytics from 'lib/analytics';
import Discover from '../index';
import DiscoverSkillPanel from '../skill-panel';
import { getViewHref, isSkillPanelOpen } from '../skill-panel-state';

// tracks.js imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );
// jsdom has no matchMedia, so every viewport query answers false (wide) unless
// a test says otherwise.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: jest.fn( () => false ),
} ) );

const SEO_PROMPT =
	'Use the WordPress.com connector to run the seo-audit skill on example.com. Run an SEO audit and show me the top five fixes.';

// Snackbars mirror their text into a hidden wp.a11y.speak live region, so a
// bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: '.a11y-speak-region, script, style' };

const PAGE = '/wp-admin/admin.php?page=jetpack-ai';

// The address with a skill's panel open, as boot's router writes it.
const panelUrl = slug => `${ PAGE }&p=${ encodeURIComponent( '/?skill=' + slug ) }#/discover`;

// Boot's route, read back from `?p=`.
const routeSearch = () =>
	new URL( new URL( window.location.href ).searchParams.get( 'p' ) || '/', 'https://x.invalid' )
		.searchParams;

// Discover in the stage and the panel in boot's inspector: two trees side by
// side, as boot renders them, with no props between them.
const hub = props => (
	<>
		<Discover { ...props } />
		<DiscoverSkillPanel />
		<SnackbarNotices />
	</>
);
const renderHub = ( props = {} ) => render( hub( props ) );

const viewedCalls = () =>
	analytics.tracks.recordEvent.mock.calls.filter(
		( [ name ] ) => name === 'jetpack_ai_hub_discover_skill_viewed'
	);

const panel = () => screen.getByRole( 'region', { name: 'SEO audit' } );
const queryPanel = () => screen.queryByRole( 'region', { name: 'SEO audit' } );
const card = title => screen.getByRole( 'article', { name: title } );
const viewLink = title => within( card( title ) ).getByRole( 'link', { name: /View skill/ } );

let user;

describe( 'Skill panel', () => {
	let writeText, openSpy, scrollSpy;

	beforeEach( () => {
		// Set up before the clipboard stub below: user-event installs its own
		// clipboard, which would otherwise replace ours.
		user = userEvent.setup();
		window.jetpackAiSettings = {
			isSelfHosted: true,
			siteAdminUrl: 'https://example.com/wp-admin/',
			featureFlags: { 'ai-hub-discover': true },
		};
		writeText = jest.fn( () => Promise.resolve() );
		Object.defineProperty( window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		openSpy = jest.spyOn( window, 'open' ).mockImplementation( () => null );
		// Base UI's scroll lock restores the scroll position, which jsdom lacks.
		scrollSpy = jest.spyOn( window, 'scrollTo' ).mockImplementation( () => {} );
		analytics.tracks.recordEvent.mockClear();
		window.history.replaceState( null, '', PAGE + '#/discover' );
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		openSpy.mockRestore();
		scrollSpy.mockRestore();
		window.history.replaceState( null, '', '/' );
	} );

	test( 'View skill opens the panel beside the list, in a new history entry', async () => {
		renderHub();
		const before = window.history.length;

		await user.click( viewLink( 'SEO audit' ) );

		expect( routeSearch().get( 'skill' ) ).toBe( 'seo-audit' );
		expect( window.location.hash ).toBe( '#/discover' );
		expect( window.history ).toHaveLength( before + 1 );
		// The list stays, with the panel beside it and the open skill's card marked.
		expect( card( 'SEO audit' ) ).toBeVisible();
		expect( card( 'SEO audit' ) ).toHaveAttribute( 'data-open', 'true' );
		expect( card( 'Write meta descriptions' ) ).not.toHaveAttribute( 'data-open' );
		const title = within( panel() ).getByRole( 'heading', { level: 2, name: 'SEO audit' } );
		expect( title ).toHaveFocus();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_viewed',
			expect.objectContaining( { skill: 'seo-audit', source: 'card' } )
		);
	} );

	test( 'shows the skill, its prompt, prerequisites and instructions', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		const region = panel();
		expect(
			within( region ).getByText( 'SEO · Works on WordPress.com and Jetpack sites' )
		).toBeVisible();
		expect(
			within( region ).getByText(
				'Your agent asks for your OK before it starts, and again before each change.'
			)
		).toBeVisible();
		expect( within( region ).getByText( SEO_PROMPT ) ).toBeVisible();
		expect(
			within( region ).getByRole( 'heading', { name: 'Prerequisites', level: 3 } )
		).toBeVisible();
		expect(
			within( region ).getByRole( 'heading', { name: 'Try it prompt', level: 3 } )
		).toBeVisible();
		expect(
			within( region ).getByRole( 'heading', { name: 'Instructions', level: 3 } )
		).toBeVisible();
		expect( within( region ).getByRole( 'heading', { name: 'Steps', level: 4 } ) ).toBeVisible();
		expect( within( region ).getByText( 'Goal:' ) ).toBeVisible();
	} );

	test( 'a link that lands open records the view as from a link, and leaves focus be', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_viewed',
			expect.objectContaining( { skill: 'seo-audit', source: 'link' } )
		);
		// Focused in code with no click first, the title would draw a focus ring.
		expect( within( panel() ).getByRole( 'heading', { level: 2 } ) ).not.toHaveFocus();
	} );

	test( 'covering the hub on a phone, it is a modal dialog and takes focus however it opened', () => {
		useViewportMatch.mockImplementation(
			( breakpoint, operator ) => breakpoint === 'medium' && operator === '<'
		);
		try {
			// A link, which on a wide screen leaves focus be (above).
			window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
			renderHub();

			const dialog = screen.getByRole( 'dialog', { name: 'SEO audit' } );
			expect( dialog ).toHaveAttribute( 'aria-modal', 'true' );
			expect( within( dialog ).getByRole( 'heading', { level: 2 } ) ).toHaveFocus();
		} finally {
			useViewportMatch.mockImplementation( () => false );
		}
	} );

	test( 'beside the hub, it is a plain region', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		expect( panel() ).not.toHaveAttribute( 'aria-modal' );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	test( 'records one view per open, StrictMode or not', async () => {
		render( <StrictMode>{ hub() }</StrictMode> );

		await user.click( viewLink( 'SEO audit' ) );

		expect( viewedCalls() ).toHaveLength( 1 );
		expect( viewedCalls()[ 0 ][ 1 ] ).toMatchObject( { skill: 'seo-audit', source: 'card' } );
		expect( within( panel() ).getByRole( 'heading', { level: 2 } ) ).toHaveFocus();
	} );

	test( 'the open card’s View skill is marked current and named for its skill', async () => {
		renderHub();
		await user.click( viewLink( 'SEO audit' ) );

		expect(
			within( card( 'SEO audit' ) ).getByRole( 'link', { name: 'View skill: SEO audit' } )
		).toHaveAttribute( 'aria-current', 'true' );
		expect( viewLink( 'Write meta descriptions' ) ).not.toHaveAttribute( 'aria-current' );
	} );

	test( 'the outline starts at the title and skips no level', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		const headings = within( panel() ).getAllByRole( 'heading' );
		expect( headings[ 0 ] ).toHaveTextContent( 'SEO audit' );
		const levels = headings.map( node => Number( node.tagName.slice( 1 ) ) );
		expect( levels[ 0 ] ).toBe( 2 );
		levels.slice( 1 ).forEach( ( level, index ) => {
			expect( level ).toBeGreaterThan( 2 );
			expect( level ).toBeLessThanOrEqual( levels[ index ] + 1 );
		} );
	} );

	test( 'Close closes the panel, keeps the tab, and returns focus to View skill', async () => {
		renderHub();
		await user.click( viewLink( 'SEO audit' ) );

		await user.click( within( panel() ).getByRole( 'button', { name: 'Close' } ) );

		expect( queryPanel() ).not.toBeInTheDocument();
		expect( routeSearch().has( 'skill' ) ).toBe( false );
		expect( window.location.hash ).toBe( '#/discover' );
		await waitFor( () => expect( viewLink( 'SEO audit' ) ).toHaveFocus() );
	} );

	test( 'closing a panel whose card the search hid returns focus to the search box', async () => {
		renderHub();
		await user.click( viewLink( 'SEO audit' ) );
		const search = screen.getByRole( 'searchbox', { name: 'Search skills' } );
		await user.type( search, 'zzzz' );
		expect( screen.queryByRole( 'article', { name: 'SEO audit' } ) ).not.toBeInTheDocument();

		await user.click( within( panel() ).getByRole( 'button', { name: 'Close' } ) );

		expect( queryPanel() ).not.toBeInTheDocument();
		await waitFor( () => expect( search ).toHaveFocus() );
	} );

	test( 'Escape closes the panel', async () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		await user.keyboard( '{Escape}' );

		expect( queryPanel() ).not.toBeInTheDocument();
		expect( routeSearch().has( 'skill' ) ).toBe( false );
	} );

	test( 'Escape in the open Send to agent menu closes the menu, not the panel', async () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		await user.click( within( panel() ).getByRole( 'button', { name: 'Send to agent' } ) );
		await expect(
			screen.findByRole( 'menuitem', { name: /Open in Claude/ } )
		).resolves.toBeVisible();
		await user.keyboard( '{Escape}' );

		await waitFor( () => expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument() );
		expect( panel() ).toBeInTheDocument();

		await user.keyboard( '{Escape}' );
		expect( queryPanel() ).not.toBeInTheDocument();
	} );

	test( 'Back closes the panel and keeps the Discover tab', async () => {
		renderHub();
		await user.click( viewLink( 'SEO audit' ) );
		expect( panel() ).toBeInTheDocument();

		await act( async () => {
			window.history.back();
			await new Promise( resolve =>
				window.addEventListener( 'popstate', resolve, { once: true } )
			);
		} );

		expect( queryPanel() ).not.toBeInTheDocument();
		expect( window.location.hash ).toBe( '#/discover' );
	} );

	test( 'Send to agent in the panel uses Discover’s hand-off', async () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		await user.click( within( panel() ).getByRole( 'button', { name: 'Send to agent' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: /Open in Claude/ } ) );

		expect( writeText ).toHaveBeenCalledWith( SEO_PROMPT );
		expect( window.open ).toHaveBeenCalledWith(
			'https://claude.ai/new?q=' + encodeURIComponent( SEO_PROMPT ),
			'_blank',
			'noopener,noreferrer'
		);
		await expect(
			screen.findByText( 'Prompt copied. Opening Claude…', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_sent',
			expect.objectContaining( {
				skill: 'seo-audit',
				agent: 'claude',
				location: 'panel',
				outcome: 'sent',
			} )
		);
	} );

	test( 'Send to agent leads the body as the primary action; the bar holds only Close', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		// The bar is drawn first but comes last in the DOM, so Tab from the
		// title walks the body and reaches Close before leaving the panel.
		const region = panel();
		const buttons = within( region ).getAllByRole( 'button' );
		const send = within( region ).getByRole( 'button', { name: 'Send to agent' } );
		const title = within( region ).getByRole( 'heading', { level: 2, name: 'SEO audit' } );
		const prereq = within( region ).getByRole( 'heading', { level: 3, name: 'Prerequisites' } );
		expect( buttons[ 0 ] ).toBe( send );
		expect( buttons.at( -1 ) ).toHaveAccessibleName( 'Close' );
		expect( prereq.compareDocumentPosition( buttons.at( -1 ) ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect( title.compareDocumentPosition( send ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( send.compareDocumentPosition( prereq ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( send ).toHaveClass( 'jetpack-ai-skill-panel__send' );
	} );

	test( 'the great first skill is badged beside its title; others are not', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		const { unmount } = renderHub();
		expect( within( panel() ).getByText( 'Great first skill' ) ).toBeVisible();
		// The badge stays out of the heading, so the panel is still named by the title.
		expect( within( panel() ).getByRole( 'heading', { level: 2 } ) ).toHaveTextContent(
			/^SEO audit$/
		);
		unmount();

		window.history.replaceState( null, '', panelUrl( 'write-meta-descriptions' ) );
		renderHub();
		const region = screen.getByRole( 'region', { name: 'Write meta descriptions' } );
		expect( within( region ).queryByText( 'Great first skill' ) ).not.toBeInTheDocument();
	} );

	test( 'Copy copies the prompt', async () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );
		renderHub();

		await user.click( within( panel() ).getByRole( 'button', { name: 'Copy' } ) );

		expect( writeText ).toHaveBeenCalledWith( SEO_PROMPT );
		await expect( screen.findByText( 'Prompt copied', IGNORE_A11Y ) ).resolves.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_sent',
			expect.objectContaining( { skill: 'seo-audit', agent: 'copy', location: 'panel_prompt' } )
		);
	} );

	test( 'View skill on the open skill moves focus to its panel', async () => {
		renderHub();
		await user.click( viewLink( 'SEO audit' ) );
		const before = window.history.length;
		viewLink( 'SEO audit' ).focus();

		await user.click( viewLink( 'SEO audit' ) );

		expect( within( panel() ).getByRole( 'heading', { level: 2 } ) ).toHaveFocus();
		expect( window.history ).toHaveLength( before );
	} );

	test.each( [
		[ 'another tab', `${ PAGE }&p=${ encodeURIComponent( '/?skill=seo-audit' ) }#/mcp` ],
		[ 'a skill this site can’t run', panelUrl( 'set-up-a-staging-site' ) ],
		[ 'no skill at all', panelUrl( 'not-a-skill' ) ],
	] )( 'opens nothing for %s', ( _label, url ) => {
		window.history.replaceState( null, '', url );
		renderHub();

		expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Skill panel gate', () => {
	beforeEach( () => {
		window.jetpackAiSettings = { isSelfHosted: true, featureFlags: { 'ai-hub-discover': true } };
		window.history.replaceState( null, '', PAGE + '#/discover' );
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		window.history.replaceState( null, '', '/' );
	} );

	test( 'shows boot’s inspector while `skill` names a skill on the Discover tab', () => {
		expect( isSkillPanelOpen( { skill: 'seo-audit' } ) ).toBe( true );
		expect( isSkillPanelOpen( {} ) ).toBe( false );
		expect( isSkillPanelOpen( undefined ) ).toBe( false );
	} );

	test( 'stays shut on other tabs, for other hosts’ skills, and without the flag', () => {
		expect( isSkillPanelOpen( { skill: 'set-up-a-staging-site' } ) ).toBe( false );

		window.history.replaceState( null, '', PAGE + '#/mcp' );
		expect( isSkillPanelOpen( { skill: 'seo-audit' } ) ).toBe( false );

		window.history.replaceState( null, '', PAGE + '#/discover' );
		delete window.jetpackAiSettings.featureFlags;
		expect( isSkillPanelOpen( { skill: 'seo-audit' } ) ).toBe( false );
	} );

	test( 'tab links drop the panel and keep the rest of the address', () => {
		window.history.replaceState( null, '', panelUrl( 'seo-audit' ) );

		expect( getViewHref( 'mcp/setup' ) ).toBe( PAGE + '#/mcp/setup' );
	} );
} );
