import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const navigate = jest.fn();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
	useSearch: () => ( { needs: 'title', postId: '5', postType: 'page' } ),
} ) );
jest.unstable_mockModule( '@automattic/jetpack-components', () => ( {
	ThemeProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );
jest.unstable_mockModule( '../../../_inc/screens/content/seo-inspector', () => ( {
	default: ( { onClose }: { onClose: () => void } ) => <button onClick={ onClose }>Close</button>,
} ) );

const { inspector: Inspector } = await import( '../inspector' );

describe( 'Content inspector route', () => {
	it( 'closes by clearing the selected post and keeping the current filter', () => {
		render( <Inspector /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- No user-event devDep for one click.
		fireEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect( navigate ).toHaveBeenCalledWith( {
			to: '/content',
			search: { needs: 'title', postId: undefined, postType: undefined },
		} );
	} );
} );
