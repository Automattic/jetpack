/**
 * The Freshly Pressed tab is only worth showing when WordPress.com actually
 * returned posts, so these tests pin both halves of that contract: with posts
 * the widget grows a tab bar, and without them it stays the single-view widget
 * it was before, rather than offering an empty tab.
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

import { act, render, screen } from '@testing-library/react';
import WritingPrompt from '../src/writing-prompt/writing-prompt';

const PROMPT = {
	id: 1,
	text: 'What is your favorite way to relax?',
	answered_link: 'https://example.com/tag/dailyprompt-1',
	answered_users_count: 0,
	answered_users_sample: [],
};

const FRESHLY_PRESSED = [
	{
		title: 'A day in the life',
		permalink:
			'https://wordpress.com/reader/blogs/34/posts/12?algo=freshly-pressed&ref=dashboard_widget',
		blog_id: 34,
		post_id: 12,
	},
	{
		title: 'Bread &amp; butter',
		permalink:
			'https://wordpress.com/reader/blogs/56/posts/78?algo=freshly-pressed&ref=dashboard_widget',
		blog_id: 56,
		post_id: 78,
	},
];

/**
 * Populate the script data the widget reads at render time.
 *
 * @param freshlyPressed - The Freshly Pressed posts to expose, if any.
 */
function setScriptData( freshlyPressed?: unknown ) {
	mockGetScriptData.mockReturnValue( {
		newsletter: {
			tracksUserData: { userid: 7, username: 'tester' },
			...( freshlyPressed === undefined ? {} : { freshlyPressed } ),
		},
	} );
}

/**
 * Render the widget and wait for the prompt fetch to settle.
 */
async function renderSettled() {
	render( <WritingPrompt /> );
	await expect( screen.findByRole( 'img', { name: 'Jetpack Logo' } ) ).resolves.toBeInTheDocument();
}

/**
 * Activate the Freshly Pressed tab.
 */
async function openFreshlyPressedTab() {
	const tab = screen.getByRole( 'tab', { name: 'Freshly Pressed' } );
	await act( async () => {
		tab.click();
	} );
}

describe( 'Freshly Pressed tab', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockGetSiteType.mockReset();
		mockGetScriptData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockRecordEvent.mockReset();

		mockApiFetch.mockResolvedValue( [ PROMPT ] );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockGetSiteType.mockReturnValue( 'jetpack' );
		mockIsWpcomPlatformSite.mockReturnValue( true );
		setScriptData( FRESHLY_PRESSED );
	} );

	it( 'opens on the writing prompt, not on Freshly Pressed', async () => {
		await renderSettled();

		expect( screen.getByRole( 'tab', { name: 'Writing Prompt' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( screen.getByRole( 'tab', { name: 'Freshly Pressed' } ) ).toHaveAttribute(
			'aria-selected',
			'false'
		);
		expect( screen.getByText( 'What is your favorite way to relax?' ) ).toBeInTheDocument();
	} );

	it( 'carries the class the compact-tab styles hang off', async () => {
		await renderSettled();

		// `@wordpress/ui` sizes horizontal tabs at 48px for admin page headers and
		// the minimal variant doesn't reset it, so style.scss overrides the height
		// through this class. Losing it silently restores the page-header scale.
		expect( screen.getByRole( 'tablist' ) ).toHaveClass( 'wpcom-daily-writing-prompt--tabs' );
	} );

	it( 'lists the posts as Reader links once the tab is opened', async () => {
		await renderSettled();
		await openFreshlyPressedTab();

		// The Link renders a visually-hidden "(opens in a new tab)" suffix, so the
		// accessible name is longer than the title alone.
		const link = screen.getByRole( 'link', { name: /A day in the life/ } );
		expect( link ).toHaveAttribute(
			'href',
			'https://wordpress.com/reader/blogs/34/posts/12?algo=freshly-pressed&ref=dashboard_widget'
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', expect.stringContaining( 'noopener' ) );
	} );

	it( 'decodes HTML entities in post titles', async () => {
		await renderSettled();
		await openFreshlyPressedTab();

		// The v1.1 API returns titles entity-encoded, so a raw title would show
		// readers "Bread &amp; butter" instead of an ampersand.
		expect( screen.getByRole( 'link', { name: /Bread & butter/ } ) ).toBeInTheDocument();
	} );

	it( 'keeps your place in the prompts across a visit to Freshly Pressed', async () => {
		mockApiFetch.mockResolvedValue( [
			PROMPT,
			{ ...PROMPT, id: 2, text: 'What did you eat for breakfast?' },
		] );

		await renderSettled();

		const next = screen.getByRole( 'button', { name: 'Next prompt' } );
		await act( async () => {
			next.click();
		} );
		expect( screen.getByText( 'What did you eat for breakfast?' ) ).toBeInTheDocument();

		await openFreshlyPressedTab();
		const promptTab = screen.getByRole( 'tab', { name: 'Writing Prompt' } );
		await act( async () => {
			promptTab.click();
		} );

		expect( screen.getByText( 'What did you eat for breakfast?' ) ).toBeInTheDocument();
	} );

	it( 'stays a single-view widget when WordPress.com returned no posts', async () => {
		setScriptData( [] );

		await renderSettled();

		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'What is your favorite way to relax?' ) ).toBeInTheDocument();
	} );

	it( 'stays a single-view widget when the script data carries no posts at all', async () => {
		setScriptData();

		await renderSettled();

		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Freshly Pressed analytics', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockGetSiteData.mockReset();
		mockGetSiteType.mockReset();
		mockGetScriptData.mockReset();
		mockIsWpcomPlatformSite.mockReset();
		mockRecordEvent.mockReset();

		mockApiFetch.mockResolvedValue( [ PROMPT ] );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 12345 } } );
		mockGetSiteType.mockReturnValue( 'jetpack' );
		mockIsWpcomPlatformSite.mockReturnValue( true );
		setScriptData( FRESHLY_PRESSED );
	} );

	it( 'records a tab event when the Freshly Pressed tab is opened', async () => {
		await renderSettled();
		await openFreshlyPressedTab();

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_writing_prompt_freshly_pressed_tab_click',
			{ site_type: 'jetpack' }
		);
	} );

	it( 'records no tab event when switching back to the writing prompt', async () => {
		await renderSettled();
		await openFreshlyPressedTab();
		mockRecordEvent.mockReset();

		const promptTab = screen.getByRole( 'tab', { name: 'Writing Prompt' } );
		await act( async () => {
			promptTab.click();
		} );

		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records a post event carrying the post identity and its position', async () => {
		await renderSettled();
		await openFreshlyPressedTab();

		const link = screen.getByRole( 'link', { name: /Bread & butter/ } );
		link.addEventListener( 'click', event => event.preventDefault() );
		link.click();

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_writing_prompt_freshly_pressed_post_click',
			{ site_type: 'jetpack', blog_id: 56, post_id: 78, position: 1 }
		);
	} );
} );
