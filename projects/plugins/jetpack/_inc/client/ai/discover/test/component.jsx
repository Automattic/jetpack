import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnackbarNotices } from '@wordpress/notices';
import analytics from 'lib/analytics';
import Discover from '../index';
import { SEO_PROMPT, SKILLS_INDEX } from './fixtures';

// tracks.js imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const renderDiscover = () =>
	render(
		<>
			<Discover />
			<SnackbarNotices />
		</>
	);

// Snackbars mirror their text into a hidden wp.a11y.speak live region, so a
// bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: '.a11y-speak-region, script, style' };

// Card titles in page order: h3 in the flat grid and list, h4 in category rows.
const cards = () =>
	screen
		.queryAllByRole( 'article' )
		.map( node => within( node ).getAllByRole( 'heading' )[ 0 ].textContent );

// A good first skill also shows in its own category's row; the first copy stands in.
const card = title => screen.getAllByRole( 'article', { name: title } )[ 0 ];

let user;

const openMenu = async title =>
	user.click(
		within( card( title ) ).getByRole( 'button', { name: `Send to agent: ${ title }` } )
	);

describe( 'Discover', () => {
	let writeText, openSpy, scrollSpy;

	beforeEach( () => {
		// Set up before the clipboard stub below: user-event installs its own
		// clipboard, which would otherwise replace ours.
		user = userEvent.setup();
		window.jetpackAiSettings = {
			siteAdminUrl: 'https://example.com/wp-admin/',
			skills: SKILLS_INDEX,
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
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		delete window.__agentsManagerActions;
		openSpy.mockRestore();
		scrollSpy.mockRestore();
	} );

	test( 'lists every skill in the index', () => {
		renderDiscover();

		expect( new Set( cards() ).size ).toBe( 7 );
		expect( screen.getByText( 'Give your agent the expertise to run your site.' ) ).toBeVisible();
	} );

	test( 'unfiltered, Good first skills leads, then a row per category', () => {
		renderDiscover();

		expect(
			screen.getAllByRole( 'heading', { level: 3 } ).map( node => node.textContent )
		).toEqual( [
			'Good first skills2',
			'SEO2',
			'General1',
			'Content1',
			'Marketing1',
			'Security1',
			'Performance1',
		] );
		expect( cards().slice( 0, 4 ) ).toEqual( [
			'SEO audit',
			'Security checkup',
			'SEO audit',
			'Write meta descriptions',
		] );
	} );

	test( 'a search keeps catalog order, and the first skill still shows in it', async () => {
		renderDiscover();

		await user.type( screen.getByRole( 'searchbox', { name: 'Search skills' } ), 'audit' );

		expect( cards()[ 0 ] ).toBe( 'Performance audit' );
		expect( cards() ).toContain( 'SEO audit' );
	} );

	// In document order: the title, the suggest link, then the toolbar's search.
	test( 'Suggest a skill sits beside the page title, not in the toolbar', () => {
		renderDiscover();

		const suggest = screen.getByRole( 'link', { name: /Suggest a skill/ } );
		const title = screen.getByRole( 'heading', { name: 'Skills for your AI agent', level: 2 } );
		const search = screen.getByRole( 'searchbox', { name: 'Search skills' } );
		expect( suggest ).toHaveAttribute( 'href', 'https://jetpack.com/contact-support/' );
		expect( suggest ).toHaveAttribute( 'target', '_blank' );
		expect( title.compareDocumentPosition( suggest ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( suggest.compareDocumentPosition( search ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	test( 'each card ends with View skill, then the Send to agent menu', () => {
		renderDiscover();

		const seo = card( 'SEO audit' );
		const blurb = within( seo ).getByText( /Audit titles, metas, and headings/ );
		const view = within( seo ).getByRole( 'link', { name: 'View skill: SEO audit' } );
		const trigger = within( seo ).getByRole( 'button', { name: 'Send to agent: SEO audit' } );
		expect( blurb.compareDocumentPosition( view ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( view.compareDocumentPosition( trigger ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	test( 'says so when the catalog couldn’t be loaded', () => {
		window.jetpackAiSettings.skills = { categories: [], skills: [] };
		renderDiscover();

		expect( cards() ).toEqual( [] );
		expect( screen.getByText( 'Skills couldn’t be loaded' ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: /Browse the full catalog/ } ) ).toBeVisible();
	} );

	test( 'a category pill narrows the list under its heading and reports it', async () => {
		renderDiscover();

		const seo = screen.getByRole( 'button', { name: /^SEO/ } );
		await user.click( seo );

		expect( seo ).toHaveAttribute( 'aria-pressed', 'true' );
		expect(
			screen.getAllByRole( 'heading', { level: 3 } ).map( node => node.textContent )
		).toEqual( [ 'SEO2' ] );
		expect( cards() ).toEqual( [ 'SEO audit', 'Write meta descriptions' ] );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_filtered',
			expect.objectContaining( { category: 'seo' } )
		);
	} );

	test( 'the Good first skills pill leads with the site-wide checks, whatever the catalog order', async () => {
		window.jetpackAiSettings.skills = {
			...SKILLS_INDEX,
			skills: [ ...SKILLS_INDEX.skills ].reverse(),
		};
		renderDiscover();

		await user.click( screen.getByRole( 'button', { name: /^Good first skills/ } ) );

		expect( cards() ).toEqual( [ 'SEO audit', 'Security checkup' ] );
	} );

	test( 'the More menu holds the other categories and closes on pick', async () => {
		renderDiscover();

		await user.click( screen.getByRole( 'button', { name: 'More categories' } ) );
		await user.click( await screen.findByRole( 'menuitemradio', { name: /Security/ } ) );

		expect( cards() ).toEqual( [ 'Security checkup' ] );
		await waitFor( () => expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument() );
		expect(
			screen.getByRole( 'button', { name: 'More categories, Security selected' } )
		).toBeVisible();
	} );

	test( 'pills follow the set category order, then the rest by size', () => {
		window.jetpackAiSettings.skills = {
			...SKILLS_INDEX,
			categories: [ ...SKILLS_INDEX.categories ].reverse(),
		};
		renderDiscover();

		const group = screen.getByRole( 'group', { name: 'Filter skills by category' } );
		const pills = within( group )
			.getAllByRole( 'button' )
			.map( pill => pill.textContent );
		expect( pills ).toEqual( [ 'All 7', 'Good first skills 2', 'SEO 2', 'Performance 1', 'More' ] );
	} );

	test( 'category pills lead with their icon, which stays out of the name; All has none', () => {
		renderDiscover();

		const group = screen.getByRole( 'group', { name: 'Filter skills by category' } );
		const all = within( group ).getByRole( 'button', { name: 'All 7' } );
		const seo = within( group ).getByRole( 'button', { name: 'SEO 2' } );
		expect( all ).toHaveAttribute( 'aria-pressed', 'true' );
		expect( all.innerHTML ).not.toContain( '<svg' );
		expect( seo.innerHTML ).toMatch( /^<svg/ );
	} );

	test( 'the narrow-width select lists every category with a count and filters', async () => {
		renderDiscover();

		const select = screen.getByRole( 'combobox', { name: 'Filter skills by category' } );
		expect( select ).toHaveTextContent( 'All (7)' );
		await user.click( select );
		const options = ( await screen.findAllByRole( 'option' ) ).map( node => node.textContent );
		expect( options[ 0 ] ).toBe( 'All (7)' );
		expect( options ).toContain( 'SEO (2)' );
		expect( options ).toContain( 'Security (1)' );
		await user.click( screen.getByRole( 'option', { name: 'Security (1)' } ) );

		expect( cards() ).toEqual( [ 'Security checkup' ] );
		expect( select ).toHaveTextContent( 'Security (1)' );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_filtered',
			expect.objectContaining( { category: 'security' } )
		);
		// The wide layout follows along: the More pill now shows the pick.
		expect(
			screen.getByRole( 'button', { name: 'More categories, Security selected' } )
		).toBeVisible();
	} );

	test( 'a search with no match shows the empty state', async () => {
		renderDiscover();

		await user.type( screen.getByRole( 'searchbox', { name: 'Search skills' } ), 'zzzz' );

		expect( cards() ).toEqual( [] );
		expect( screen.getByText( 'No skills match “zzzz”' ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: /Browse the full catalog/ } ) ).toBeVisible();
	} );

	test( 'the clear button empties the search and keeps focus in it', async () => {
		renderDiscover();
		const search = screen.getByRole( 'searchbox', { name: 'Search skills' } );
		expect( screen.queryByRole( 'button', { name: 'Clear search' } ) ).not.toBeInTheDocument();

		await user.type( search, 'zzzz' );
		await user.click( screen.getByRole( 'button', { name: 'Clear search' } ) );

		expect( search ).toHaveValue( '' );
		expect( search ).toHaveFocus();
		expect( new Set( cards() ).size ).toBe( 7 );
		expect( screen.queryByRole( 'button', { name: 'Clear search' } ) ).not.toBeInTheDocument();
	} );

	test( 'search matches the description as well as the title', async () => {
		renderDiscover();

		await user.type( screen.getByRole( 'searchbox', { name: 'Search skills' } ), 'inbox' );

		expect( cards() ).toEqual( [ 'Build a contact form' ] );
	} );

	test( 'hides Ask WordPress Agent until the agent can take a prompt', async () => {
		renderDiscover();
		await openMenu( 'SEO audit' );

		await expect(
			screen.findByRole( 'menuitem', { name: /Open in Claude/ } )
		).resolves.toBeVisible();
		expect(
			screen.queryByRole( 'menuitem', { name: /Ask WordPress Agent/ } )
		).not.toBeInTheDocument();
	} );

	test( 'Ask WordPress Agent opens a new chat with the prompt in the composer', async () => {
		const actions = {
			isReady: true,
			chatNavigate: jest.fn(),
			setChatOpen: jest.fn(),
			setChatInput: jest.fn(),
		};
		window.__agentsManagerActions = actions;
		renderDiscover();
		await openMenu( 'SEO audit' );
		await user.click( await screen.findByRole( 'menuitem', { name: /Ask WordPress Agent/ } ) );

		expect( actions.chatNavigate ).toHaveBeenCalledWith( '/' );
		expect( actions.setChatOpen ).toHaveBeenCalledWith( true );
		expect( actions.setChatInput ).toHaveBeenCalledWith( SEO_PROMPT );
	} );

	test( 'the WordPress Agent appears once the Agents Manager reports ready', async () => {
		renderDiscover();
		act( () => {
			window.__agentsManagerActions = { isReady: true, setChatInput: jest.fn() };
			window.dispatchEvent( new Event( 'agents-manager-ready' ) );
		} );
		await openMenu( 'SEO audit' );

		await expect(
			screen.findByRole( 'menuitem', { name: /Ask WordPress Agent/ } )
		).resolves.toBeVisible();
	} );

	test( 'Open in Claude copies the prompt and opens Claude with it', async () => {
		renderDiscover();
		await openMenu( 'SEO audit' );
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
				location: 'card',
				outcome: 'sent',
			} )
		);
	} );

	test( 'Open in ChatGPT uses its own address', async () => {
		renderDiscover();
		await openMenu( 'SEO audit' );
		await user.click( await screen.findByRole( 'menuitem', { name: /Open in ChatGPT/ } ) );

		expect( window.open ).toHaveBeenCalledWith(
			'https://chatgpt.com/?q=' + encodeURIComponent( SEO_PROMPT ),
			'_blank',
			'noopener,noreferrer'
		);
	} );

	test( 'Claude and ChatGPT always open straight away, with nothing to connect first', async () => {
		renderDiscover();
		await openMenu( 'SEO audit' );
		const claude = await screen.findByRole( 'menuitem', { name: /Open in Claude/ } );
		const chatgpt = screen.getByRole( 'menuitem', { name: /Open in ChatGPT/ } );
		// Nothing else in the label; the new tab is said to assistive tech.
		expect( claude ).toHaveAccessibleName( 'Open in Claude (opens in a new tab)' );
		expect( chatgpt ).toHaveAccessibleName( 'Open in ChatGPT (opens in a new tab)' );
		await user.click( claude );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( window.open ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'Copy for another agent copies the prompt', async () => {
		renderDiscover();
		await openMenu( 'SEO audit' );
		await user.click( await screen.findByRole( 'menuitem', { name: /Copy for another agent/ } ) );

		expect( writeText ).toHaveBeenCalledWith( SEO_PROMPT );
		await expect( screen.findByText( 'Prompt copied', IGNORE_A11Y ) ).resolves.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_sent',
			expect.objectContaining( { agent: 'copy', location: 'card', outcome: 'sent' } )
		);
	} );

	test( 'says so when the browser refuses the copy, and records it as failed', async () => {
		writeText.mockImplementation( () => Promise.reject( new Error( 'denied' ) ) );
		renderDiscover();
		await openMenu( 'SEO audit' );
		await user.click( await screen.findByRole( 'menuitem', { name: /Copy for another agent/ } ) );

		await expect(
			screen.findByText( 'Couldn’t copy the prompt.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		const sent = analytics.tracks.recordEvent.mock.calls.filter(
			( [ name ] ) => name === 'jetpack_ai_hub_discover_skill_sent'
		);
		expect( sent ).toHaveLength( 1 );
		expect( sent[ 0 ][ 1 ] ).toMatchObject( { agent: 'copy', outcome: 'copy_failed' } );
	} );

	// The skill itself shows in boot's side panel; see skill-panel.test.jsx.
	test( 'View skill opens the skill’s side panel rather than a page', async () => {
		window.jetpackAiSettings.featureFlags = { 'ai-hub-discover': true };
		window.history.replaceState( null, '', '/wp-admin/admin.php?page=jetpack-ai#/skills' );
		renderDiscover();
		await user.click( within( card( 'SEO audit' ) ).getByRole( 'link', { name: /View skill/ } ) );

		const route = new URL( window.location.href ).searchParams.get( 'p' );
		expect( route ).toBe( '/?skill=site-seo-audit' );
		expect( window.location.hash ).toBe( '#/skills' );
		// The list stays where it was, beside the panel.
		expect( new Set( cards() ).size ).toBe( 7 );
		window.history.replaceState( null, '', '/' );
	} );
} );
