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
		[ 'opens on a first visit', null, '/', false, true ],
		[ 'waits out a deep link on a first visit', null, '/', true, false ],
		[ 'stays closed once dismissed', '1', '/', false, false ],
		[ 'reopens with welcome=1', '1', '/?welcome=1', false, true ],
	] )( '%s', ( _name, seen, url, deferred, isOpen ) => {
		if ( seen ) {
			window.localStorage.setItem( SEEN_KEY, seen );
		}
		window.history.replaceState( null, '', url );
		render( <WelcomeModal deferred={ deferred } /> );
		expect( screen.queryByRole( 'dialog', { name: 'Welcome to Protect' } ) !== null ).toBe(
			isOpen
		);
	} );

	it.each( [
		[ 'Get started', true ],
		[ 'Close', false ],
	] )( 'remembers a dismissal from %s', async ( button, goToLastPage ) => {
		render( <WelcomeModal /> );
		if ( goToLastPage ) {
			await userEvent.click( screen.getByRole( 'button', { name: 'Page 3 of 3' } ) );
		}
		await userEvent.click( screen.getByRole( 'button', { name: button } ) );
		expect( window.localStorage.getItem( SEEN_KEY ) ).toBe( '1' );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'stays dismissed until the header asks again', async () => {
		const view = render( <WelcomeModal /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );
		view.rerender( <WelcomeModal openRequest={ 0 } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		view.rerender( <WelcomeModal openRequest={ 1 } /> );
		expect( screen.getByRole( 'dialog', { name: 'Welcome to Protect' } ) ).toBeInTheDocument();
		expect( window.localStorage.getItem( SEEN_KEY ) ).toBe( '1' );
	} );

	it( 'opens on mount when the header already asked', () => {
		window.localStorage.setItem( SEEN_KEY, '1' );
		render( <WelcomeModal openRequest={ 1 } /> );
		expect( screen.getByRole( 'dialog', { name: 'Welcome to Protect' } ) ).toBeInTheDocument();
	} );

	it( 'explains daily vulnerability checks, then the built-in tools', async () => {
		render( <WelcomeModal /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next' } ) );
		expect(
			screen.getByRole( 'heading', { name: 'Daily vulnerability checks' } )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Every day, Protect checks WordPress, your plugins, and your themes against a database of known vulnerabilities, and shows you how to fix what it finds.'
			)
		).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Next' } ) );
		expect(
			screen.getByText(
				'Downtime monitoring, the firewall, and login protection now come with Protect. Enable them and manage them from this dashboard.'
			)
		).toBeInTheDocument();
	} );
} );
