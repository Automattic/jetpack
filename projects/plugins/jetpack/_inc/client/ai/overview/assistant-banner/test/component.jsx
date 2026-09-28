import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';
import AssistantBanner from '../index';

// The component imports the webpack-aliased 'lib/analytics', which doesn't
// resolve under jest — provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

// jsdom does not implement navigation; cancel the anchors' default action so
// clicks still reach React's handlers without a jsdom "not implemented" error.
const cancelNavigation = event => event.preventDefault();
beforeEach( () => document.addEventListener( 'click', cancelNavigation ) );

afterEach( () => {
	document.removeEventListener( 'click', cancelNavigation );
	jest.resetAllMocks();
	// The preferences store lives on the shared default registry, so state
	// written by one test survives into the next — reset the flag each time.
	dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', undefined );
} );

describe( 'AssistantBanner', () => {
	test( 'renders the announcement with a dismiss control', () => {
		render( <AssistantBanner /> );

		expect( screen.getByText( 'Do more on your site with AI.' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'Write, edit, and make changes across your whole site. Start in the editor, or connect ChatGPT or Claude and work from there.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Dismiss' } ) ).toBeInTheDocument();
	} );

	test( 'renders no action links', () => {
		render( <AssistantBanner /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	test( 'renders nothing when already dismissed', () => {
		dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', true );

		const { container } = render( <AssistantBanner /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'dismiss hides the banner and sets the per-user preference', async () => {
		render( <AssistantBanner /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( screen.queryByText( 'Do more on your site with AI.' ) ).not.toBeInTheDocument();
		expect( select( preferencesStore ).get( 'jetpack/ai', 'assistantBannerDismissed' ) ).toBe(
			true
		);
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_assistant_banner_dismiss',
			{ site_type: 'jetpack', is_a11n: 'false', is_test: 'false' }
		);
	} );
} );
