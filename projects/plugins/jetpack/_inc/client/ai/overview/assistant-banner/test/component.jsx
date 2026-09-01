import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';
import AssistantBanner from '../index';

// The component imports the webpack-aliased 'lib/analytics', which doesn't
// resolve under jest — provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

afterEach( () => {
	jest.resetAllMocks();
	// The preferences store lives on the shared default registry, so state
	// written by one test survives into the next — reset the flag each time.
	dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', undefined );
} );

describe( 'AssistantBanner', () => {
	test( 'renders the announcement with a dismiss control', () => {
		render( <AssistantBanner /> );

		expect( screen.getByText( 'Your site now has an assistant.' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'Turn your ideas into ready-to-publish content at lightspeed. Make changes across your site using ChatGPT, Claude, Slack, or right here.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Dismiss' } ) ).toBeInTheDocument();
	} );

	test( 'CTA links to MCP settings and records the click', async () => {
		render( <AssistantBanner /> );

		const cta = screen.getByRole( 'link', { name: 'Connect your agent' } );
		expect( cta ).toHaveAttribute( 'href', '#/mcp' );

		await userEvent.click( cta );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_assistant_banner_cta_click',
			{ is_a11n: 'false', is_test: 'false' }
		);
		// Navigating to MCP settings is not a dismissal — the banner stays.
		expect( screen.getByText( 'Your site now has an assistant.' ) ).toBeInTheDocument();
	} );

	test( 'Close dismisses like the corner X', async () => {
		render( <AssistantBanner /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect( screen.queryByText( 'Your site now has an assistant.' ) ).not.toBeInTheDocument();
		expect( select( preferencesStore ).get( 'jetpack/ai', 'assistantBannerDismissed' ) ).toBe(
			true
		);
	} );

	test( 'renders nothing when already dismissed', () => {
		dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', true );

		const { container } = render( <AssistantBanner /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'dismiss hides the banner and sets the per-user preference', async () => {
		render( <AssistantBanner /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( screen.queryByText( 'Your site now has an assistant.' ) ).not.toBeInTheDocument();
		expect( select( preferencesStore ).get( 'jetpack/ai', 'assistantBannerDismissed' ) ).toBe(
			true
		);
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_assistant_banner_dismiss',
			{ is_a11n: 'false', is_test: 'false' }
		);
	} );
} );
