import { render, screen } from '@testing-library/react';
import Countdown from '../countdown';

it.each( [
	[ ( 23 * 3600 + 59 * 60 + 21 ) * 1000, '23h59m21s', '23 hours, 59 minutes, 21 seconds' ],
	[ ( 3600 + 60 + 1 ) * 1000, '1h01m01s', '1 hour, 1 minute, 1 second' ],
	[ -5000, '0h00m00s', '0 hours, 0 minutes, 0 seconds' ],
] )( 'shows %i ms left as "%s", read as "%s"', ( left, shown, read ) => {
	render( <Countdown to={ new Date( Date.now() + left ) } /> );

	expect( document.body ).toHaveTextContent( shown );
	expect( screen.getByText( read ) ).toBeInTheDocument();
} );
