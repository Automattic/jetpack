import { render } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import GlobalNotices from 'components/global-notices';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

describe( 'GlobalNotices', function () {
	beforeEach( () => {
		speak.mockClear();
	} );

	describe( 'rendering', function () {
		it( 'can render', () => {
			const { container } = render(
				<GlobalNotices notices={ [ { id: 1, status: 'success' } ] } />
			);
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'global-notices' );
		} );

		it.each( [
			[ 'is-error', 'assertive' ],
			[ 'is-success', 'polite' ],
		] )( 'announces a %s notice as %s', ( status, politeness ) => {
			render( <GlobalNotices notices={ [ { id: 1, status, text: 'Saved.' } ] } /> );

			expect( speak ).toHaveBeenCalledWith( 'Saved.', politeness );
		} );
	} );
} );
