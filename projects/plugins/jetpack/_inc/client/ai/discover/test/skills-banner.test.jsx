import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';
import SkillsBanner, { PREFERENCE_NAME } from '../skills-banner';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

// The preferences store lives on the shared registry, so reset the flag between tests.
afterEach( () => {
	jest.resetAllMocks();
	dispatch( preferencesStore ).set( 'jetpack/ai', PREFERENCE_NAME, undefined );
} );

describe( 'SkillsBanner', () => {
	test( 'dismissing hides it and remembers that per user', async () => {
		render( <SkillsBanner /> );
		expect( screen.getByText( 'What are skills?' ) ).toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( screen.queryByText( 'What are skills?' ) ).not.toBeInTheDocument();
		expect( select( preferencesStore ).get( 'jetpack/ai', PREFERENCE_NAME ) ).toBe( true );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_skills_banner_dismiss',
			expect.anything()
		);
	} );

	test( 'stays hidden once dismissed', () => {
		dispatch( preferencesStore ).set( 'jetpack/ai', PREFERENCE_NAME, true );

		const { container } = render( <SkillsBanner /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
