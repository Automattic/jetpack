import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import DiscoverSkillPanel from '../../discover/skill-panel';
import { getOpenSkillSlug, getSkillParam } from '../../discover/skill-panel-state';
import { getCatalog } from '../../discover/skills';
import useSendSkill from '../../discover/use-send-skill';
import SkillsHero, { pickSuggestedSkills } from '../skills-hero';

// tracks.js imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );
// The hand-off itself (prompt, snackbars, Tracks) is the shared hook's job and
// has its own suite; here it only has to be asked, with the right location.
jest.mock( '../../discover/use-send-skill', () => ( { __esModule: true, default: jest.fn() } ) );

const PAGE = '/wp-admin/admin.php?page=jetpack-ai';

const linkClicks = () =>
	analytics.tracks.recordEvent.mock.calls
		.filter( ( [ name ] ) => name === 'jetpack_ai_hub_link_click' )
		.map( ( [ , props ] ) => props );

describe( 'SkillsHero', () => {
	let user, send, scrollSpy;

	beforeEach( () => {
		user = userEvent.setup();
		window.jetpackAiSettings = {
			isSelfHosted: true,
			siteAdminUrl: 'https://example.com/wp-admin/',
			featureFlags: { 'ai-hub-discover': true },
		};
		send = jest.fn( () => Promise.resolve( true ) );
		useSendSkill.mockReturnValue( { send } );
		// Base UI's scroll lock restores the scroll position, which jsdom lacks.
		scrollSpy = jest.spyOn( window, 'scrollTo' ).mockImplementation( () => {} );
		analytics.tracks.recordEvent.mockClear();
		window.history.replaceState( null, '', PAGE + '#/overview' );
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		scrollSpy.mockRestore();
		useSendSkill.mockReset();
		window.history.replaceState( null, '', '/' );
	} );

	test( 'leads with the heading, the connect buttons and the access line, with no prompt box', () => {
		render( <SkillsHero /> );

		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Run your site from your AI agent' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /^Connect Claude/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /^Connect ChatGPT/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Manage access' } ) ).toHaveAttribute(
			'href',
			expect.stringMatching( /#\/mcp$/ )
		);
		expect( screen.queryByRole( 'button', { name: 'Copy prompt' } ) ).not.toBeInTheDocument();
		expect( useSendSkill ).toHaveBeenCalledWith( { location: 'overview_hero' } );
	} );

	test( 'with MCP access off, points at Settings instead of the access line', () => {
		render( <SkillsHero isMcpEnabled={ false } /> );

		expect( screen.getByRole( 'link', { name: 'Settings' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Manage access' } ) ).not.toBeInTheDocument();
	} );

	test( 'suggests two skills on the Skills tab’s cards', () => {
		render( <SkillsHero /> );

		const group = screen.getByRole( 'group', { name: 'Start with a skill' } );
		const cards = within( group ).getAllByRole( 'article' );
		expect( cards ).toHaveLength( 2 );
		const views = within( group ).getAllByRole( 'link' );
		expect( views.map( link => link.getAttribute( 'href' ) ) ).toEqual( [
			'#/discover/performance-audit',
			'#/discover/monthly-site-report',
		] );
		// Each card is Discover's: named by its title, with its own Send to agent.
		expect( cards[ 0 ] ).toHaveAccessibleName( 'Performance audit' );
		expect(
			within( cards[ 0 ] ).getByRole( 'button', { name: 'Send to agent: Performance audit' } )
		).toBeInTheDocument();
	} );

	test( 'a card’s Send to agent sends that skill, marked as the Overview card’s', async () => {
		render( <SkillsHero /> );

		await user.click( screen.getByRole( 'button', { name: 'Send to agent: Performance audit' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: /Open in ChatGPT/ } ) );

		expect( send ).toHaveBeenCalledWith(
			expect.objectContaining( { slug: 'performance-audit' } ),
			'chatgpt',
			'overview_card'
		);
	} );

	test( 'pickSuggestedSkills: skips a suggestion this site can’t run and tops up from the catalog', () => {
		const catalog = getCatalog( true ).filter( skill => skill.slug !== 'monthly-site-report' );

		const slugs = pickSuggestedSkills( catalog ).map( skill => skill.slug );

		expect( slugs ).toEqual( [ 'performance-audit', 'write-meta-descriptions' ] );
		expect( slugs ).not.toContain( 'monthly-site-report' );
	} );

	test( 'a card opens Discover with that skill’s panel, in one history entry', async () => {
		// Record every history write: boot's router runs a view transition per
		// write, and a second write straight after the first cancels it. So the
		// hash and the skill param go into one push, never a push and a replace.
		const writes = [];
		const realPush = window.history.pushState.bind( window.history );
		const realReplace = window.history.replaceState.bind( window.history );
		const pushSpy = jest.spyOn( window.history, 'pushState' ).mockImplementation( ( ...args ) => {
			writes.push( 'push' );
			return realPush( ...args );
		} );
		const replaceSpy = jest
			.spyOn( window.history, 'replaceState' )
			.mockImplementation( ( ...args ) => {
				writes.push( 'replace' );
				return realReplace( ...args );
			} );
		// A push fires no hashchange, so the card tells the hub itself.
		const hashChanged = new Promise( resolve =>
			window.addEventListener( 'hashchange', resolve, { once: true } )
		);
		render(
			<>
				<SkillsHero />
				<DiscoverSkillPanel />
			</>
		);
		const before = window.history.length;

		await user.click( screen.getByRole( 'link', { name: 'View skill: Performance audit' } ) );

		expect( writes ).toEqual( [ 'push' ] );
		expect( window.location.hash ).toBe( '#/discover' );
		expect( getSkillParam() ).toBe( 'performance-audit' );
		expect( getOpenSkillSlug() ).toBe( 'performance-audit' );
		// One entry for the hash and the param, so Back returns to the
		// Overview in one step.
		expect( window.history ).toHaveLength( before + 1 );

		// The hub's hashchange (the view switch) finds the param already
		// where it belongs.
		await hashChanged;
		expect( getOpenSkillSlug() ).toBe( 'performance-audit' );

		// The panel opens with focus on its title: the card that was clicked
		// leaves with the Overview.
		const panel = await screen.findByRole( 'region', { name: 'Performance audit' } );
		await waitFor( () =>
			expect(
				within( panel ).getByRole( 'heading', { level: 2, name: 'Performance audit' } )
			).toHaveFocus()
		);
		expect( linkClicks() ).toEqual( [
			expect.objectContaining( { link_type: 'overview_skill', link: 'performance-audit' } ),
		] );
		// Told apart from a Discover card's open in Tracks.
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_discover_skill_viewed',
			expect.objectContaining( { skill: 'performance-audit', source: 'overview' } )
		);
		pushSpy.mockRestore();
		replaceSpy.mockRestore();
	} );

	test( 'a modified click leaves the link to the browser', async () => {
		render( <SkillsHero /> );
		const link = screen.getByRole( 'link', { name: 'View skill: Performance audit' } );
		// jsdom can't open a new tab; stop it treating the click as navigation.
		const cancel = event => event.preventDefault();
		document.addEventListener( 'click', cancel );

		await user.keyboard( '{Control>}' );
		await user.click( link );
		await user.keyboard( '{/Control}' );

		document.removeEventListener( 'click', cancel );
		expect( window.location.hash ).toBe( '#/overview' );
		expect( getSkillParam() ).toBe( '' );
	} );

	test( 'Browse all skills goes to the Discover tab, leaving any old panel behind', async () => {
		// A panel left open on Discover before the Overview was typed in.
		window.history.replaceState(
			null,
			'',
			PAGE + '&p=' + encodeURIComponent( '/?skill=seo-audit' ) + '#/overview'
		);
		const hashChanged = new Promise( resolve =>
			window.addEventListener( 'hashchange', resolve, { once: true } )
		);
		render( <SkillsHero /> );
		const link = screen.getByRole( 'link', { name: 'Browse all skills' } );

		// Even followed by the browser, the address carries no skill.
		expect( link ).toHaveAttribute( 'href', PAGE + '#/discover' );

		await user.click( link );

		await hashChanged;
		expect( window.location.hash ).toBe( '#/discover' );
		expect( getSkillParam() ).toBe( '' );
		expect( getOpenSkillSlug() ).toBe( '' );
	} );
} );
