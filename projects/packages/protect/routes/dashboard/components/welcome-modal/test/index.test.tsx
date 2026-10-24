import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeModal from '..';

const SEEN_KEY = `jetpack-protect-welcome-seen-${ window.location.host }`;

describe( 'WelcomeModal', () => {
	afterEach( () => {
		window.localStorage.clear();
		window.history.replaceState( null, '', '/' );
	} );

	it.each( [
		[ 'opens on a first visit', null, '/', true ],
		[ 'stays closed once dismissed', '1', '/', false ],
		[ 'reopens with welcome=1', '1', '/?welcome=1', true ],
	] )( '%s', ( _name, seen, url, isOpen ) => {
		if ( seen ) {
			window.localStorage.setItem( SEEN_KEY, seen );
		}
		window.history.replaceState( null, '', url );
		render( <WelcomeModal /> );
		expect( screen.queryByRole( 'dialog', { name: 'Welcome to Protect' } ) !== null ).toBe(
			isOpen
		);
	} );

	it( 'remembers the dismissal', async () => {
		render( <WelcomeModal /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Page 3 of 3' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Get started' } ) );
		expect( window.localStorage.getItem( SEEN_KEY ) ).toBe( '1' );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );
} );
