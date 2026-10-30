import { render, screen } from '@testing-library/react';
import InboxPreview from '../inbox-preview';

const props = {
	fromName: 'Example Site',
	fromAddress: 'hello@example.com',
	siteTitle: 'Example Site',
	fallback: true,
	done: false,
};

describe( 'InboxPreview', () => {
	it( 'shows a real core email from the sender, not on yet', () => {
		render( <InboxPreview { ...props } sending={ false } /> );
		expect( screen.getByText( 'How your emails will look' ) ).toBeInTheDocument();
		expect( screen.getByText( 'hello@example.com' ) ).toBeInTheDocument();
		expect( screen.getByText( '[Example Site] Password Reset' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Not on yet' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your host keeps sending your site’s emails until then.' )
		).toBeInTheDocument();
	} );

	it.each( [
		[ true, 'If an email ever can’t go out this way, your host sends it instead.' ],
		[ false, 'Every email goes out this way.' ],
	] )( 'says On once sending is on (host takes over: %s)', ( fallback, note ) => {
		render( <InboxPreview { ...props } sending fallback={ fallback } done /> );
		expect( screen.getByText( 'How your emails look' ) ).toBeInTheDocument();
		expect( screen.getByText( 'On' ) ).toBeInTheDocument();
		expect( screen.getByText( note ) ).toBeInTheDocument();
	} );
} );
