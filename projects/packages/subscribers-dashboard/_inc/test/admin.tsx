import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { JetpackSubscribers } from '../admin';

// Mock the jetpack-script-data module
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( {
		plan: {
			product_slug: 'jetpack_free',
		},
		wpcom: {
			blog_id: 123,
		},
	} ),
} ) );

describe( 'JetpackSubscribers', () => {
	describe( 'Renders as expected', () => {
		const setup = () => {
			return render( <JetpackSubscribers /> );
		};
		it( 'renders subscribers header', () => {
			setup();
			expect( screen.getByText( 'Subscribers' ) ).toBeInTheDocument();
		} );

		it( 'renders add subscribers button', () => {
			setup();
			expect( screen.getByText( 'Add Subscribers' ) ).toBeInTheDocument();
		} );
	} );
} );
