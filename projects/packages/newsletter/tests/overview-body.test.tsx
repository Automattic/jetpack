const mockGetScriptData = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: ( ...args: unknown[] ) => mockGetScriptData( ...args ),
} ) );

import { render, screen } from '@testing-library/react';
import OverviewBody from '../routes/dashboard/components/overview-body';

beforeEach( () => {
	mockGetScriptData.mockReset();
	mockGetScriptData.mockReturnValue( {
		user: {
			current_user: {
				display_name: 'Ada Lovelace',
			},
		},
	} );
} );

describe( 'OverviewBody', () => {
	it( 'greets the current user and renders the introductory content', () => {
		render( <OverviewBody /> );

		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Welcome, Ada Lovelace' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 3, name: 'Newsletters on WordPress.com' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( /a newsletter lets people subscribe with their email address/i )
		).toBeInTheDocument();
	} );

	it( 'renders the fallback greeting when the display name is unavailable', () => {
		mockGetScriptData.mockReturnValue( undefined );

		render( <OverviewBody /> );

		expect( screen.getByRole( 'heading', { level: 2, name: 'Welcome' } ) ).toBeInTheDocument();
	} );

	it( 'renders the onboarding checklist state and actions', () => {
		render( <OverviewBody /> );

		expect(
			screen.getByRole( 'button', { name: /start a newsletter\s*complete/i } )
		).toHaveAttribute( 'aria-expanded', 'false' );
		expect( screen.getByRole( 'button', { name: /make it your own/i } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Customize' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Skip' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /write your first post/i } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( screen.getByRole( 'button', { name: /share your newsletter/i } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it.each( [
		[ 'Start a newsletter', '2 min', 'https://wordpress.com/support/newsletter/' ],
		[
			'Send newsletter emails to subscribers',
			'4 min',
			'https://wordpress.com/support/newsletter/send-newsletter-emails/',
		],
		[ 'Newsletter settings', '5 min', 'https://wordpress.com/support/newsletter-settings/' ],
	] )( 'renders the %s guide as an external link', ( title, duration, href ) => {
		render( <OverviewBody /> );

		const link = screen.getByRole( 'link', {
			name: new RegExp( `${ title }.*opens in a new tab`, 'i' ),
		} );

		expect( link ).toHaveAttribute( 'href', href );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noreferrer' );
		expect( link ).toHaveTextContent( duration );
	} );
} );
