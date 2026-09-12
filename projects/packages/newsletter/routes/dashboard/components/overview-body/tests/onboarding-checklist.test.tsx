import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingChecklist from '../onboarding-checklist';

const getStep = ( name: RegExp ) => screen.getByRole( 'button', { name } );

describe( 'OnboardingChecklist', () => {
	it( 'renders every step with only the customization step open by default', () => {
		render( <OnboardingChecklist /> );

		expect( getStep( /start a newsletter/i ) ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( getStep( /make it your own/i ) ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( getStep( /write your first post/i ) ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( getStep( /share your newsletter/i ) ).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'announces the completed step in its accessible name', () => {
		render( <OnboardingChecklist /> );

		expect( getStep( /start a newsletter/i ) ).toHaveAccessibleName( 'Start a newsletterComplete' );
	} );

	it( 'shows the customization description and both actions by default', () => {
		render( <OnboardingChecklist /> );

		expect(
			screen.getByText( 'Customize your newsletter with a name, tagline, and more.' )
		).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Customize' } ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Skip' } ) ).toBeVisible();
	} );

	it.each( [
		[
			/Write your first post/i,
			'Create a post to send your first newsletter email.',
			'Write a post',
		],
		[ /Share your newsletter/i, 'Invite readers to subscribe to your newsletter.', 'Share' ],
	] )( 'reveals the action when its step is expanded', ( stepName, description, action ) => {
		render( <OnboardingChecklist /> );

		const step = getStep( stepName );
		// eslint-disable-next-line testing-library/prefer-user-event -- Avoid adding a dependency for one click.
		fireEvent.click( step );

		expect( step ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( screen.getByText( description ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: action } ) ).toBeVisible();
	} );
} );
