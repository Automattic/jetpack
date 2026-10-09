import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAnalytics from '../../../hooks/use-analytics';
import { GlobalNotice } from '../index';

jest.mock( '../../../hooks/use-analytics' );

const mockUseAnalytics = useAnalytics;
const recordEvent = jest.fn();

describe( 'GlobalNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseAnalytics.mockReturnValue( { recordEvent } );
	} );

	it( 'records the view event once on mount', () => {
		const { rerender } = render(
			<GlobalNotice message="Body" title="Title" options={ { id: 'backup-failure' } } />
		);

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_global_notice_view', {
			notice_id: 'backup-failure',
		} );

		// A re-render with the same notice id must not re-fire the view event.
		rerender( <GlobalNotice message="Body" title="Title" options={ { id: 'backup-failure' } } /> );
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps rendering when a higher-priority notice with a title replaces an untitled one', () => {
		const action = { label: 'Act', onClick: jest.fn() };
		const { rerender } = render(
			<GlobalNotice message="Incomplete install" options={ { id: 'bad', actions: [ action ] } } />
		);

		rerender(
			<GlobalNotice
				message="Connect"
				title="Missing site connection"
				options={ { id: 'missing-connection', actions: [ action ] } }
			/>
		);

		expect( screen.getByText( 'Missing site connection' ) ).toBeInTheDocument();
	} );

	it( 'hides the close button by default', () => {
		render( <GlobalNotice message="Body" title="Title" options={ { id: 'seo' } } /> );

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the close button and calls onClose when a watcher overrides it', async () => {
		const onClose = jest.fn();
		render(
			<GlobalNotice
				message="Body"
				title="Title"
				options={ { id: 'backup-failure', hideCloseButton: false, onClose } }
			/>
		);

		await userEvent.click( screen.getByRole( 'button' ) );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
