import { render, screen } from '@testing-library/react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import LiveCelebration from '../live-celebration';

jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: jest.fn(),
	} ),
} ) );

// Carries the block-editor plumbing behind "Add to a post or page"; the
// celebration's own announcement and focus are what is under test.
jest.mock( '../../add-to-content-menu', () => ( {
	__esModule: true,
	default: () => <div data-testid="add-to-content-menu" />,
} ) );

describe( 'LiveCelebration', () => {
	it( 'announces itself and takes focus', () => {
		render( <LiveCelebration video={ makeLibraryItem() } onDismiss={ jest.fn() } /> );

		// It replaces the player mid-page after a wait nobody is watching the
		// DOM for, so it both announces and moves the focus point — otherwise
		// the next Tab continues from wherever the page was before.
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Your video is live' );
		const heading = screen.getByRole( 'heading', { name: 'Your video is live' } );
		expect( heading ).toHaveFocus();
	} );
} );
