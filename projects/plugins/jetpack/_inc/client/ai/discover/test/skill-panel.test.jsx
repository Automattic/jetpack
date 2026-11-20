import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useViewportMatch } from '@wordpress/compose';
import { StrictMode } from '@wordpress/element';
import { SnackbarNotices } from '@wordpress/notices';
import analytics from 'lib/analytics';
import Discover from '../index';
import DiscoverSkillPanel from '../skill-panel';
import { getViewHref, isSkillPanelOpen } from '../skill-panel-state';
import { resetSkillBodies } from '../use-skill-body';
import { SEO_PROMPT, SKILLS_INDEX } from './fixtures';

// tracks.js imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );
// jsdom has no matchMedia, so every viewport query answers false (wide) unless
// a test says otherwise.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: jest.fn( () => false ),
} ) );
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// Snackbars mirror their text into a hidden wp.a11y.speak live region, so a
// bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: '.a11y-speak-region, script, style' };

const PAGE = '/wp-admin/admin.php?page=jetpack-ai';

// The address with a skill's panel open, as boot's router writes it.
const panelUrl = slug => `${ PAGE }&p=${ encodeURIComponent( '/?skill=' + slug ) }#/skills`;

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
const resolveBody = () =>
	apiFetch.mockImplementation( ( { path } ) =>
		Promise.resolve( { slug: path.split( '/' ).pop(), body: '## Steps\n\n1. Read the site.' } )
	);
// A good first skill also shows in its own category's row; the first copy stands in.
const card = title => screen.getAllByRole( 'article', { name: title } )[ 0 ];
const viewLink = title => within( card( title ) ).getByRole( 'link', { name: /View skill/ } );

let user;

describe( 'Skill panel', () => {
	let writeText, openSpy, scrollSpy;

	beforeEach( () => {
		// Set up before the clipboard stub below: user-event installs its own
		// clipboard, which would otherwise replace ours.
		user = userEvent.setup();
		window.jetpackAiSettings = {
			siteAdminUrl: 'https://example.com/wp-admin/',
			featureFlags: { 'ai-hub-discover': true },
			skills: SKILLS_INDEX,
		};
		resetSkillBodies();
		// Left loading unless a test resolves it, so no update lands after a sync test ends.
		apiFetch.mockReset();
		apiFetch.mockImplementation( () => new Promise( () => {} ) );
		writeText = jest.fn( () => Promise.resolve() );
		Object.defineProperty( window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		openSpy = jest.spyOn( window, 'open' ).mockImplementation( () => null );
		// Base UI's scroll lock restores the scroll position, which jsdom lacks.
		scrollSpy = jest.spyOn( window, 'scrollTo' ).mockImplementation( () => {} );
		analytics.tracks.recordEvent.mockClear();
		window.history.replaceState( null, '', PAGE + '#/skills' );
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

		expect( routeSearch().get( 'skill' ) ).toBe( 'site-seo-audit' );
		expect( window.location.hash ).toBe( '#/skills' );
		expect( window.history ).toHaveLength( before + 1 );
		// The list stays, with the panel beside it and the open skill's card marked.
		expect( card( 'SEO audit' ) ).toBeVisible();
		expect( card( 'SEO audit' ) ).toHaveAttribute( 'data-open', 'true' );
		expect( card( 'Write meta descriptions' ) ).not.toHaveAttribute( 'data-open' );
		const title = within( panel() ).getByRole( 'heading', { level: 2, name: 'SEO audit' } );
		expect( title ).toHaveFocus();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_viewed',
			expect.objectContaining( { skill: 'site-seo-audit', source: 'card' } )
		);
	} );

	test( 'shows the skill, its prompt, prerequisites and instructions', async () => {
		resolveBody();
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		const region = panel();
		expect( within( region ).getByText( 'SEO' ) ).toBeVisible();
		expect( within( region ).getByText( /Audit titles, metas, and headings/ ) ).toBeVisible();
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
		await expect( within( region ).findByText( /1\. Read the site\./ ) ).resolves.toBeVisible();
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/jetpack-ai/skills/site-seo-audit',
		} );
	} );

	test( 'loads the instructions once, however often the panel opens', async () => {
		resolveBody();
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		const { unmount } = renderHub();
		await expect( within( panel() ).findByText( /Read the site/ ) ).resolves.toBeVisible();
		unmount();

		renderHub();

		expect( within( panel() ).getByText( /Read the site/ ) ).toBeVisible();
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'says so when the instructions don’t load', async () => {
		apiFetch.mockImplementation( () => Promise.reject( new Error( 'Bad gateway' ) ) );
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		await expect(
			within( panel() ).findByText( 'The instructions couldn’t be loaded.' )
		).resolves.toBeVisible();
	} );

	test( 'a link that lands open records the view as from a link, and leaves focus be', () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_viewed',
			expect.objectContaining( { skill: 'site-seo-audit', source: 'link' } )
		);
		// Focused in code with no click first, the title would draw a focus ring.
		expect( within( panel() ).getByRole( 'heading', { level: 2 } ) ).not.toHaveFocus();
	} );

	test( 'covering the hub on a phone, it is a modal dialog, takes focus however it opened, and Escape closes it', async () => {
		useViewportMatch.mockImplementation(
			( breakpoint, operator ) => breakpoint === 'medium' && operator === '<'
		);
		try {
			// A link, which on a wide screen leaves focus be (above).
			window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
			renderHub();

			const dialog = screen.getByRole( 'dialog', { name: 'SEO audit' } );
			expect( dialog ).toHaveAttribute( 'aria-modal', 'true' );
			expect( within( dialog ).getByRole( 'heading', { level: 2 } ) ).toHaveFocus();

			await user.keyboard( '{Escape}' );

			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} finally {
			useViewportMatch.mockImplementation( () => false );
		}
	} );

	test( 'beside the hub, it is a plain region', () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		expect( panel() ).not.toHaveAttribute( 'aria-modal' );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	test( 'records one view per open, StrictMode or not', async () => {
		render( <StrictMode>{ hub() }</StrictMode> );

		await user.click( viewLink( 'SEO audit' ) );

		expect( viewedCalls() ).toHaveLength( 1 );
		expect( viewedCalls()[ 0 ][ 1 ] ).toMatchObject( { skill: 'site-seo-audit', source: 'card' } );
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
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
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
		expect( window.location.hash ).toBe( '#/skills' );
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
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		await user.keyboard( '{Escape}' );

		expect( queryPanel() ).not.toBeInTheDocument();
		expect( routeSearch().has( 'skill' ) ).toBe( false );
	} );

	test( 'Escape in the open Send to agent menu closes the menu, not the panel', async () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
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
		expect( window.location.hash ).toBe( '#/skills' );
	} );

	test( 'Send to agent in the panel uses Discover’s hand-off', async () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
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
				skill: 'site-seo-audit',
				agent: 'claude',
				location: 'panel',
				outcome: 'sent',
			} )
		);
	} );

	test( 'the bar holds the category and Close; the title and Send to agent lead the panel', () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		const region = panel();
		const buttons = within( region ).getAllByRole( 'button' );
		const send = within( region ).getByRole( 'button', { name: 'Send to agent' } );
		const title = within( region ).getByRole( 'heading', { level: 2, name: 'SEO audit' } );
		const prereq = within( region ).getByRole( 'heading', { level: 3, name: 'Prerequisites' } );
		expect( buttons[ 0 ] ).toHaveAccessibleName( 'Close' );
		expect( buttons[ 1 ] ).toBe( send );
		expect( buttons[ 0 ].compareDocumentPosition( title ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		expect( title.compareDocumentPosition( send ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( send.compareDocumentPosition( prereq ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( send ).toHaveClass( 'jetpack-ai-skill-panel__send' );
	} );

	test( 'Copy copies the prompt', async () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );
		renderHub();

		await user.click( within( panel() ).getByRole( 'button', { name: 'Copy' } ) );

		expect( writeText ).toHaveBeenCalledWith( SEO_PROMPT );
		await expect( screen.findByText( 'Prompt copied', IGNORE_A11Y ) ).resolves.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_sent',
			expect.objectContaining( {
				skill: 'site-seo-audit',
				agent: 'copy',
				location: 'panel_prompt',
			} )
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
		[ 'another tab', `${ PAGE }&p=${ encodeURIComponent( '/?skill=site-seo-audit' ) }#/mcp` ],
		[ 'no skill at all', panelUrl( 'not-a-skill' ) ],
	] )( 'opens nothing for %s', ( _label, url ) => {
		window.history.replaceState( null, '', url );
		renderHub();

		expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Skill panel gate', () => {
	beforeEach( () => {
		window.jetpackAiSettings = { featureFlags: { 'ai-hub-discover': true }, skills: SKILLS_INDEX };
		window.history.replaceState( null, '', PAGE + '#/skills' );
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		window.history.replaceState( null, '', '/' );
	} );

	test( 'shows boot’s inspector while `skill` names a skill on the Discover tab', () => {
		expect( isSkillPanelOpen( { skill: 'site-seo-audit' } ) ).toBe( true );
		expect( isSkillPanelOpen( {} ) ).toBe( false );
		expect( isSkillPanelOpen( undefined ) ).toBe( false );
	} );

	test( 'stays shut on other tabs, for unknown skills, and without the flag', () => {
		expect( isSkillPanelOpen( { skill: 'not-a-skill' } ) ).toBe( false );

		window.history.replaceState( null, '', PAGE + '#/mcp' );
		expect( isSkillPanelOpen( { skill: 'site-seo-audit' } ) ).toBe( false );

		window.history.replaceState( null, '', PAGE + '#/skills' );
		delete window.jetpackAiSettings.featureFlags;
		expect( isSkillPanelOpen( { skill: 'site-seo-audit' } ) ).toBe( false );
	} );

	test( 'tab links drop the panel and keep the rest of the address', () => {
		window.history.replaceState( null, '', panelUrl( 'site-seo-audit' ) );

		expect( getViewHref( 'mcp/setup' ) ).toBe( PAGE + '#/mcp/setup' );
	} );
} );
