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

import { render, screen } from '@testing-library/react';
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
