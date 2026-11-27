import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAnalytics from '../../../hooks/use-analytics';
import { GlobalNotice } from '../index';

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

	it( 'renders external actions as new-tab links and the rest as buttons', () => {
		render(
			<GlobalNotice
				message="Body"
				options={ {
					id: 'backup-failure',
					actions: [
						{ label: 'Read guide', onClick: jest.fn() },
						{ label: 'Contact support', url: 'https://example.com', isExternalLink: true },
					],
				} }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Read guide' } ) ).toBeInTheDocument();
		const link = screen.getByRole( 'link', { name: /Contact support/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );
} );
