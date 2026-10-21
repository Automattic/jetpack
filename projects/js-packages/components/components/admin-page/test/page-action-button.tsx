import { jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import { dashboard } from '@wordpress/icons';
import PageActionButton from '../page-action-button.tsx';

// useViewportMatch's useMediaQuery caches the first MediaQueryList per query and reads its `matches` live.
let notifyChange = () => {};
const narrowScreen = {
	matches: false,
	addEventListener: jest.fn( ( _: string, listener: () => void ) => {
		notifyChange = listener;
	} ),
	removeEventListener: jest.fn(),
};

beforeAll( () => {
	window.matchMedia = jest.fn( () => narrowScreen ) as unknown as typeof window.matchMedia;
} );

describe( 'PageActionButton', () => {
	it.each( [
		[ 'its label', 481, false, 'Run speed test' ],
		[ 'only its icon', 480, true, '' ],
	] )( 'shows %s at %ipx', ( _, __, isNarrow, text ) => {
		narrowScreen.matches = isNarrow;
		render( <PageActionButton label="Run speed test" icon={ dashboard } /> );

		const button = screen.getByRole( 'button', { name: 'Run speed test' } );

		expect( button ).toHaveTextContent( text );
		expect( window.matchMedia ).toHaveBeenCalledWith( 'screen and (max-width: 480px)' );
	} );

	it( 'keeps focus when the screen crosses the breakpoint', () => {
		narrowScreen.matches = false;
		render( <PageActionButton label="Run speed test" icon={ dashboard } /> );
		act( () => screen.getByRole( 'button', { name: 'Run speed test' } ).focus() );

		act( () => {
			narrowScreen.matches = true;
			notifyChange();
		} );

		const button = screen.getByRole( 'button', { name: 'Run speed test' } );
		expect( button ).toHaveTextContent( '' );
		expect( button ).toHaveFocus();
	} );
} );
