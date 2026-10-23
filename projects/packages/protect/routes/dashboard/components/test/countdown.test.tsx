import { render, screen } from '@testing-library/react';
import Countdown from '../countdown';

it.each( [
	[ ( 23 * 3600 + 59 * 60 + 21 ) * 1000, '23 hours, 59 minutes, 21 seconds' ],
	[ ( 3600 + 60 + 1 ) * 1000, '1 hour, 1 minute, 1 second' ],
	[ -5000, '0 hours, 0 minutes, 0 seconds' ],
] )( 'reads %i ms left as "%s"', ( left, text ) => {
	render( <Countdown to={ new Date( Date.now() + left ) } /> );

	expect( screen.getByText( text ) ).toBeInTheDocument();
} );
