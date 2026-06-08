/**
 * The Daily Writing Prompt widget ships from this package to Simple, Atomic,
 * and self-hosted Jetpack sites alike, so its Jetpack branding has to live in
 * the React component (the one surface shared across every environment). These
 * tests pin that branding contract: once prompts have loaded the widget renders
 * the Jetpack logo so customers can tell which plugin added the widget, and
 * before any prompt loads the widget renders nothing at all so the logo never
 * shows on an empty widget.
 */

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

const mockGetSiteData = jest.fn();
const mockIsWpcomPlatformSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getSiteData: ( ...args: unknown[] ) => mockGetSiteData( ...args ),
	isWpcomPlatformSite: ( ...args: unknown[] ) => mockIsWpcomPlatformSite( ...args ),
} ) );

import { render, screen, within } from '@testing-library/react';
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

	it( 'renders nothing (and so no logo) before any prompt loads', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		const { container } = render( <WritingPrompt /> );

		expect( container ).toBeEmptyDOMElement();
		expect( screen.queryByRole( 'img', { name: 'Jetpack Logo' } ) ).not.toBeInTheDocument();
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

	it( 'renders the View all responses link and avatar faces outside the footer', async () => {
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		const { container } = render( <WritingPrompt /> );

		const responsesLink = await screen.findByRole( 'link', { name: /View all responses/ } );
		expect( responsesLink ).toHaveAttribute( 'href', 'https://example.com/tag/dailyprompt-1' );
		expect( screen.getAllByRole( 'img', { name: 'User avatar' } ) ).toHaveLength( 2 );

		// The branding footer must NOT contain the responses link.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- The branding footer has no ARIA role, so a class selector is the most direct way to scope this assertion.
		const footer = container.querySelector( '.wpcom-daily-writing-prompt--branding' );
		expect( footer ).not.toBeNull();
		expect(
			within( footer as HTMLElement ).queryByRole( 'link', { name: /View all responses/ } )
		).not.toBeInTheDocument();
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
	} );

	it( 'falls back to the bare Reader URL when no blog_id is available', async () => {
		mockGetSiteData.mockReturnValue( undefined );
		mockApiFetch.mockResolvedValue( [ PROMPT_WITH_RESPONSES ] );

		render( <WritingPrompt /> );

		const readerLink = await screen.findByRole( 'link', {
			name: /Read the blogs and topics you follow/,
		} );
		expect( readerLink ).toHaveAttribute( 'href', 'https://wordpress.com/reader' );
	} );
} );
