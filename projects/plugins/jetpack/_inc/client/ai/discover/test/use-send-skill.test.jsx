import { act, render, renderHook, screen } from '@testing-library/react';
import { SnackbarNotices } from '@wordpress/notices';
import analytics from 'lib/analytics';
import { getSkill } from '../skills';
import useSendSkill, { getSiteName } from '../use-send-skill';

// tracks.js imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const SEO_PROMPT =
	'Use the WordPress.com connector to run the seo-audit skill on example.com. Run an SEO audit and show me the top five fixes.';

// Snackbars mirror their text into a hidden wp.a11y.speak live region, so a
// bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: '.a11y-speak-region, script, style' };

const sentCalls = () =>
	analytics.tracks.recordEvent.mock.calls
		.filter( ( [ name ] ) => name === 'jetpack_ai_hub_discover_skill_sent' )
		.map( ( [ , props ] ) => props );

describe( 'useSendSkill', () => {
	let writeText, openSpy, scrollSpy, skill;

	beforeEach( () => {
		window.jetpackAiSettings = {
			isSelfHosted: true,
			siteAdminUrl: 'https://example.com/wp-admin/',
		};
		writeText = jest.fn( () => Promise.resolve() );
		Object.defineProperty( window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		openSpy = jest.spyOn( window, 'open' ).mockImplementation( () => null );
		// The snackbar list restores the scroll position, which jsdom lacks.
		scrollSpy = jest.spyOn( window, 'scrollTo' ).mockImplementation( () => {} );
		analytics.tracks.recordEvent.mockClear();
		skill = getSkill( 'seo-audit', true );
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
		delete window.__agentsManagerActions;
		openSpy.mockRestore();
		scrollSpy.mockRestore();
	} );

	// The snackbars render beside the hook, as the hub renders them.
	const setup = () => {
		render( <SnackbarNotices /> );
		return renderHook( () => useSendSkill( { location: 'overview_hero' } ) ).result;
	};

	test( 'names the site from its admin address, subdirectory and all', () => {
		expect( getSiteName() ).toBe( 'example.com' );
		window.jetpackAiSettings.siteAdminUrl = 'https://example.com/blog/wp-admin/';
		expect( getSiteName() ).toBe( 'example.com/blog' );
		expect( setup().current.siteName ).toBe( 'example.com/blog' );
	} );

	test( 'opens Claude with the prompt and records the caller’s location', async () => {
		const result = setup();

		await act( () => result.current.send( skill, 'claude' ) );

		expect( writeText ).toHaveBeenCalledWith( SEO_PROMPT );
		expect( window.open ).toHaveBeenCalledWith(
			'https://claude.ai/new?q=' + encodeURIComponent( SEO_PROMPT ),
			'_blank',
			'noopener,noreferrer'
		);
		expect( screen.getByText( 'Prompt copied. Opening Claude…', IGNORE_A11Y ) ).toBeInTheDocument();
		expect( sentCalls() ).toEqual( [
			expect.objectContaining( {
				skill: 'seo-audit',
				agent: 'claude',
				location: 'overview_hero',
				outcome: 'sent',
			} ),
		] );
	} );

	test( 'still opens the agent, and says only that, when the copy fails', async () => {
		writeText.mockImplementation( () => Promise.reject( new Error( 'denied' ) ) );
		const result = setup();

		await act( () => result.current.send( skill, 'chatgpt' ) );

		expect( window.open ).toHaveBeenCalledWith(
			'https://chatgpt.com/?q=' + encodeURIComponent( SEO_PROMPT ),
			'_blank',
			'noopener,noreferrer'
		);
		expect( screen.getByText( 'Opening ChatGPT…', IGNORE_A11Y ) ).toBeInTheDocument();
	} );

	test( 'hands the prompt to the WordPress Agent', async () => {
		const actions = { isReady: true, setChatOpen: jest.fn(), setChatInput: jest.fn() };
		window.__agentsManagerActions = actions;
		const result = setup();

		await act( () => result.current.send( skill, 'wordpress' ) );

		expect( actions.setChatInput ).toHaveBeenCalledWith( SEO_PROMPT );
		expect( sentCalls()[ 0 ] ).toMatchObject( { agent: 'wordpress', outcome: 'sent' } );
	} );

	test( 'says so, and records it, when the WordPress Agent has gone away', async () => {
		// The menu offered it, then the Agents Manager unloaded.
		const result = setup();

		await act( async () => {
			await expect( result.current.send( skill, 'wordpress' ) ).resolves.toBe( false );
		} );

		expect(
			screen.getByText( 'Couldn’t open the WordPress Agent.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( sentCalls() ).toEqual( [
			expect.objectContaining( { agent: 'wordpress', outcome: 'unavailable' } ),
		] );
	} );

	test( 'copyPrompt records the copy once the clipboard has it', async () => {
		let resolveWrite;
		writeText.mockImplementation( () => new Promise( resolve => ( resolveWrite = resolve ) ) );
		const result = setup();

		let copying;
		act( () => {
			copying = result.current.copyPrompt( skill );
		} );
		expect( sentCalls() ).toHaveLength( 0 );

		await act( async () => {
			resolveWrite();
			await expect( copying ).resolves.toBe( true );
		} );

		expect( screen.getByText( 'Prompt copied', IGNORE_A11Y ) ).toBeInTheDocument();
		expect( sentCalls() ).toEqual( [
			expect.objectContaining( { agent: 'copy', location: 'overview_hero', outcome: 'sent' } ),
		] );
	} );

	test( 'a refused copy is recorded as failed, and a location can be overridden', async () => {
		writeText.mockImplementation( () => Promise.reject( new Error( 'denied' ) ) );
		const result = setup();

		await act( async () => {
			await expect( result.current.copyPrompt( skill, 'panel_prompt' ) ).resolves.toBe( false );
		} );

		expect( screen.getByText( 'Couldn’t copy the prompt.', IGNORE_A11Y ) ).toBeInTheDocument();
		expect( sentCalls() ).toEqual( [
			expect.objectContaining( {
				agent: 'copy',
				location: 'panel_prompt',
				outcome: 'copy_failed',
			} ),
		] );
	} );
} );
