/**
 * The Daily Writing Prompt widget ships from this package to Simple, Atomic,
 * and self-hosted Jetpack sites alike, so its Jetpack branding has to live in
 * the React component (the one surface shared across every environment). These
 * tests pin that branding contract. While prompts are still loading the widget
 * renders nothing at all, so the logo never flashes on a not-yet-populated
 * widget. Once the fetch has settled the widget always renders the branding
 * footer (Jetpack logo + Reader link) so customers can tell which plugin added
 * the widget: when a prompt came back it renders the prompt, and when none did
 * (an empty response or a failed request) it renders a short fallback message
 * plus the footer instead of collapsing to a blank box.
 */

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

const mockGetSiteData = jest.fn();
const mockGetSiteType = jest.fn();
const mockGetScriptData = jest.fn();
const mockIsWpcomPlatformSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getSiteData: ( ...args: unknown[] ) => mockGetSiteData( ...args ),
	getSiteType: ( ...args: unknown[] ) => mockGetSiteType( ...args ),
	getScriptData: ( ...args: unknown[] ) => mockGetScriptData( ...args ),
	isWpcomPlatformSite: ( ...args: unknown[] ) => mockIsWpcomPlatformSite( ...args ),
} ) );

const mockInitialize = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: ( ...args: unknown[] ) => mockInitialize( ...args ),
		tracks: {
			recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ),
		},
	},
} ) );

import { act, render, screen, within } from '@testing-library/react';
import WritingPrompt from '../src/writing-prompt/writing-prompt';

const PROMPT = {
	id: 1,
	text: 'What is your favorite way to relax?',
	answered_link: 'https://example.com/tag/dailyprompt-1',
	answered_users_count: 0,
	answered_users_sample: [],
};

describe( 'WritingPrompt widget branding', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'renders the Jetpack logo once prompts have loaded', async () => {
		mockApiFetch.mockResolvedValue( [ PROMPT ] );

		render( <WritingPrompt /> );

		await expect(
			screen.findByRole( 'img', { name: 'Jetpack Logo' } )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders nothing (and so no logo) while prompts are still loading', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		const { container } = render( <WritingPrompt /> );

		expect( container ).toBeEmptyDOMElement();
		expect( screen.queryByRole( 'img', { name: 'Jetpack Logo' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'WritingPrompt widget empty state', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockIsWpcomPlatformSite.mockReturnValue( true );
	} );

	it( 'renders the fallback message and branded footer when no prompt comes back', async () => {
		mockApiFetch.mockResolvedValue( [] );

		render( <WritingPrompt /> );

		// The fallback view still carries the Jetpack branding and Reader links so the
		// widget stays useful instead of collapsing to a blank box.
		// The message links "the Reader" inline to the WordPress.com Reader...
		const inlineReaderLink = await screen.findByRole( 'link', { name: 'the Reader' } );
		expect( inlineReaderLink ).toHaveAttribute(
			'href',
			'https://wordpress.com/reader?origin_site_id=12345'
		);
		expect( screen.getByText( /No writing prompt to show right now/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'img', { name: 'Jetpack Logo' } ) ).toBeInTheDocument();
		// ...and the always-on footer Reader link is still present alongside it.
		expect(
			screen.getByRole( 'link', { name: /Read the blogs and topics you follow/ } )
		).toHaveAttribute( 'href', 'https://wordpress.com/reader?origin_site_id=12345' );

		// None of the prompt-only controls should render without a prompt.
		expect( screen.queryByRole( 'button', { name: 'Post your answer' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Next/ } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the fallback view when the prompts request fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'network error' ) );

		render( <WritingPrompt /> );

		// A rejected request must degrade to the same fallback view rather than
		// leaving the widget stuck on its empty loading state.
		await expect(
			screen.findByRole( 'link', { name: 'the Reader' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( /No writing prompt to show right now/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'img', { name: 'Jetpack Logo' } ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: /Read the blogs and topics you follow/ } )
		).toBeInTheDocument();
	} );
} );

const PROMPT_WITH_RESPONSES = {
	id: 1,
	text: 'What is your favorite way to relax?',
	answered_link: 'https://example.com/tag/dailyprompt-1',
	answered_users_count: 3,
	answered_users_sample: [
		{ avatar: 'https://example.com/avatar1.png' },
		{ avatar: 'https://example.com/avatar2.png' },
	],
};

describe( 'WritingPrompt widget Reader link and responses', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockIsWpcomPlatformSite.mockReturnValue( true );
	} );

	it( 'renders the View responses link and avatar faces outside the footer', async () => {
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		const { container } = render( <WritingPrompt /> );

		// The responses control is an external link that opens the Reader tag
		// archive in a new tab.
		const responsesLink = await screen.findByRole( 'link', { name: /View responses/ } );
		expect( responsesLink ).toHaveAttribute( 'href', 'https://example.com/tag/dailyprompt-1' );
		expect( responsesLink ).toHaveAttribute( 'target', '_blank' );
		expect( screen.getAllByRole( 'img', { name: 'User avatar' } ) ).toHaveLength( 2 );

		// The facepile closes with a "+N" chip for the answerers beyond the two
		// sampled avatars (3 total answerers - 2 shown = 1 more).
		expect( screen.getByText( '+1' ) ).toBeInTheDocument();

		// The responses link now lives in the answered-users group, next to the avatars.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- The answered-users group has no ARIA role, so a class selector is the most direct way to scope this assertion.
		const answeredUsers = container.querySelector( '.wpcom-daily-writing-prompt--answered-users' );
		expect( answeredUsers ).not.toBeNull();
		expect(
			within( answeredUsers as HTMLElement ).getByRole( 'link', { name: /View responses/ } )
		).toBeInTheDocument();

		// The branding footer must NOT contain the responses link.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- The branding footer has no ARIA role, so a class selector is the most direct way to scope this assertion.
		const footer = container.querySelector( '.wpcom-daily-writing-prompt--branding' );
		expect( footer ).not.toBeNull();
		expect(
			within( footer as HTMLElement ).queryByRole( 'link', { name: /View responses/ } )
		).not.toBeInTheDocument();
	} );

	it( 'omits the "+N" facepile chip when every answerer is already shown', async () => {
		// answered_users_count matches the number of sampled avatars, so there are
		// no additional answerers to summarise.
		mockApiFetch.mockResolvedValue( [ { ...PROMPT_WITH_RESPONSES, answered_users_count: 2 } ] );

		render( <WritingPrompt /> );

		await expect(
			screen.findByRole( 'link', { name: /View responses/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'img', { name: 'User avatar' } ) ).toHaveLength( 2 );
		expect( screen.queryByText( /^\+\d/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Reader link in the footer with the origin_site_id', async () => {
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		const { container } = render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		expect( readerLink ).toHaveAttribute(
			'href',
			'https://wordpress.com/reader?origin_site_id=12345'
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- The branding footer has no ARIA role, so a class selector is the most direct way to scope this assertion.
		const footer = container.querySelector( '.wpcom-daily-writing-prompt--branding' );
		expect(
			within( footer as HTMLElement ).getByRole( 'link', {
				name: /Read the blogs and topics you follow/,
			} )
		).toBeInTheDocument();
	} );

	it( 'opens the Reader link in a new tab on non-wpcom platforms', async () => {
		mockIsWpcomPlatformSite.mockReturnValue( false );
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		expect( readerLink ).toHaveAttribute( 'target', '_blank' );
		expect( readerLink ).toHaveAttribute( 'rel', expect.stringContaining( 'noopener' ) );
	} );

	it( 'opens the Reader link in the same tab on wpcom platforms', async () => {
		mockIsWpcomPlatformSite.mockReturnValue( true );
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		expect( readerLink ).not.toHaveAttribute( 'target' );
		expect( readerLink ).not.toHaveAttribute( 'rel' );
	} );

	it( 'falls back to the bare Reader URL when site data is unavailable', async () => {
		mockGetSiteData.mockReturnValue( undefined );
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		expect( readerLink ).toHaveAttribute( 'href', 'https://wordpress.com/reader' );
	} );

	it( 'falls back to the bare Reader URL on a self-hosted site with no wpcom data', async () => {
		// On a self-hosted Jetpack site, getSiteData() returns a valid object with no wpcom key.
		mockGetSiteData.mockReturnValue( { site: { title: 'My Blog' } } );
		mockIsWpcomPlatformSite.mockReturnValue( false );
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		expect( readerLink ).toHaveAttribute( 'href', 'https://wordpress.com/reader' );
		expect( readerLink ).toHaveAttribute( 'target', '_blank' );
	} );
} );

describe( 'WritingPrompt widget prompt text', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockIsWpcomPlatformSite.mockReturnValue( true );
	} );

	it( 'decodes HTML entities in the prompt text', async () => {
		// The wpcom/v3/blogging-prompts endpoint returns the prompt text HTML-entity
		// encoded (via wp_kses), matching the WP REST API convention. The widget must
		// decode it before rendering, the same way Calypso's blogging-prompt-card does,
		// otherwise readers see raw entity names like &quot; instead of quotation marks.
		mockApiFetch.mockResolvedValue( [
			{
				...PROMPT,
				text: 'Tell us about &quot;The Hard Years&quot; &amp; other stories.',
			},
		] );

		render( <WritingPrompt /> );

		await expect(
			screen.findByText( 'Tell us about "The Hard Years" & other stories.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /&quot;/ ) ).not.toBeInTheDocument();
	} );
} );

const PROMPTS = [
	{
		id: 1,
		text: 'What is your favorite way to relax?',
		answered_link: 'https://example.com/tag/dailyprompt-1',
		answered_users_count: 3,
		answered_users_sample: [ { avatar: 'https://example.com/avatar1.png' } ],
	},
	{
		id: 2,
		text: 'What did you eat for breakfast?',
		answered_link: 'https://example.com/tag/dailyprompt-2',
		answered_users_count: 0,
		answered_users_sample: [],
	},
];

describe( 'WritingPrompt widget prompt navigation', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockIsWpcomPlatformSite.mockReturnValue( true );
	} );

	it( 'renders icon-only Previous/Next controls and disables Previous on the first prompt', async () => {
		mockApiFetch.mockResolvedValue( PROMPTS );

		render( <WritingPrompt /> );

		// The navigation controls are icon-only buttons whose accessible name comes
		// from their label (rendered as a tooltip), replacing the old text buttons.
		const previous = await screen.findByRole( 'button', { name: 'Previous prompt' } );
		const next = screen.getByRole( 'button', { name: 'Next prompt' } );

		// On the first prompt there is nothing before it, so Previous is disabled
		// while Next stays available to advance through the remaining prompts.
		// @wordpress/ui buttons express their disabled state via `aria-disabled`
		// (the element stays focusable), so assert on that rather than the native
		// `disabled` attribute.
		expect( previous ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( next ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'advances to the next prompt and disables Next on the last prompt', async () => {
		mockApiFetch.mockResolvedValue( PROMPTS );

		render( <WritingPrompt /> );

		const next = await screen.findByRole( 'button', { name: 'Next prompt' } );
		expect( screen.getByText( 'What is your favorite way to relax?' ) ).toBeInTheDocument();

		// The package favours the native `.click()` pattern over fireEvent; wrap it
		// in act() so the resulting index state update flushes cleanly.
		act( () => {
			next.click();
		} );

		// The second (and last) prompt is now shown, so Next is disabled and
		// Previous becomes available again.
		await expect(
			screen.findByText( 'What did you eat for breakfast?' )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Next prompt' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Previous prompt' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );

describe( 'WritingPrompt widget analytics', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockGetSiteType.mockReset();
		mockGetScriptData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockInitialize.mockReset();
		mockRecordEvent.mockReset();

		mockApiFetch.mockResolvedValue( PROMPTS );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockGetSiteType.mockReturnValue( 'jetpack' );
		mockGetScriptData.mockReturnValue( {
			newsletter: { tracksUserData: { userid: 7, username: 'tester' } },
		} );
		mockIsWpcomPlatformSite.mockReturnValue( true );
	} );

	it( 'initializes analytics with the connected user Tracks identity on mount', async () => {
		render( <WritingPrompt /> );

		// Wait for the prompts to load before asserting on the mount effect.
		await expect(
			screen.findByRole( 'img', { name: 'Jetpack Logo' } )
		).resolves.toBeInTheDocument();
		expect( mockInitialize ).toHaveBeenCalledWith( 7, 'tester' );
	} );

	it( 'does not initialize analytics when no Tracks identity is available', async () => {
		mockGetScriptData.mockReturnValue( { newsletter: { tracksUserData: false } } );

		render( <WritingPrompt /> );

		await expect(
			screen.findByRole( 'img', { name: 'Jetpack Logo' } )
		).resolves.toBeInTheDocument();
		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'records a post-answer event with the prompt id when Post your answer is clicked', async () => {
		render( <WritingPrompt /> );

		const postAnswerButton = await screen.findByRole( 'button', { name: 'Post your answer' } );
		postAnswerButton.click();

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_writing_prompt_post_answer_click',
			{ site_type: 'jetpack', prompt_id: 1 }
		);

		// Posting an answer assigns document.location to navigate to the editor;
		// jsdom cannot perform that navigation and logs an expected error, which
		// @wordpress/jest-console requires us to acknowledge.
		expect( console ).toHaveErrored();
	} );

	it( 'records a view-responses event with the prompt id when View responses is clicked', async () => {
		render( <WritingPrompt /> );

		const responsesLink = await screen.findByRole( 'link', { name: /View responses/ } );
		responsesLink.click();

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_writing_prompt_view_responses_click',
			{ site_type: 'jetpack', prompt_id: 1 }
		);
	} );

	it( 'records a reader-click event when the Reader link is clicked', async () => {
		render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		readerLink.click();

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_writing_prompt_reader_click',
			{ site_type: 'jetpack' }
		);
	} );
} );
