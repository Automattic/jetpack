import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { dashboard } from '@wordpress/icons';
import PageActionButton from '../page-action-button.tsx';

// useMediaQuery caches the first MediaQueryList per query and reads its `matches` live.
const narrowScreen = {
	matches: false,
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
};

beforeAll( () => {
	window.matchMedia = jest.fn( () => narrowScreen ) as unknown as typeof window.matchMedia;
} );

describe( 'PageActionButton', () => {
	it.each( [
		[ 'its label', 400, false, 'Run speed test' ],
		[ 'only its icon', 390, true, '' ],
	] )( 'shows %s at %ipx', ( _, __, isNarrow, text ) => {
		narrowScreen.matches = isNarrow;
		render( <PageActionButton label="Run speed test" icon={ dashboard } /> );

		const button = screen.getByRole( 'button', { name: 'Run speed test' } );

		expect( button ).toHaveTextContent( text );
		expect( window.matchMedia ).toHaveBeenCalledWith( '(max-width: 390px)' );
	} );
} );
