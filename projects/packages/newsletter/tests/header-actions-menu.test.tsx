/* eslint-disable testing-library/prefer-user-event -- user-event is not a dependency of this package. */
import { fireEvent, render, screen } from '@testing-library/react';
import HeaderActions from '../_inc/subscribers/components/header-actions';

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	recordTracksEvent: jest.fn(),
} ) );

const baseProps = {
	blogId: 123,
	exportQuery: {
		filters: [],
		search: '',
		sort: 'date_subscribed' as const,
		sortOrder: 'desc' as const,
	},
	onAddSubscribers: jest.fn(),
	showSelfOnlyNudge: false,
	onDismissSelfOnlyNudge: jest.fn(),
	matchingCount: 40,
	narrowed: true,
	isBulkRemoveRunning: false,
	onRemoveAll: jest.fn(),
	onRemoveMatching: jest.fn(),
};

/**
 * Open the More menu.
 */
function openMenu() {
	fireEvent.click( screen.getByRole( 'button', { name: 'More options' } ) );
}

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'HeaderActions More menu', () => {
	it( 'hides the bulk removals until WP.com turns removal on for the site', () => {
		render( <HeaderActions { ...baseProps } /> );
		openMenu();

		expect( screen.getByRole( 'menuitem', { name: 'Download as CSV' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Remove all subscribers' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Remove 40 matching subscribers' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the bulk removals once removal is on', () => {
		render( <HeaderActions { ...baseProps } isBulkRemoveEnabled /> );
		openMenu();

		fireEvent.click( screen.getByRole( 'menuitem', { name: 'Remove 40 matching subscribers' } ) );
		expect( baseProps.onRemoveMatching ).toHaveBeenCalled();

		openMenu();
		fireEvent.click( screen.getByRole( 'menuitem', { name: 'Remove all subscribers' } ) );
		expect( baseProps.onRemoveAll ).toHaveBeenCalled();
	} );
} );
