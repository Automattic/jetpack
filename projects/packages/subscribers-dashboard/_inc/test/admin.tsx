import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { JetpackSubscribers } from '../admin';

describe( 'JetpackSubscribers', () => {
	describe( 'Renders as expected', () => {
		const setup = () => {
			return render( <JetpackSubscribers /> );
		};
		it( 'renders hello world', () => {
			setup();
			expect( screen.getByText( 'Hello world!' ) ).toBeInTheDocument();
		} );
	} );
} );
