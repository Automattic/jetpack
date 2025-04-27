import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabbedModal from '../index';

// Simplified mocks
jest.mock( '@wordpress/components', () => ( {
	Modal: ( { title, onRequestClose, className, children } ) => (
		<div data-testid="modal" className={ className }>
			<h2>{ title }</h2>
			<button data-testid="close-button" onClick={ onRequestClose }>
				Close
			</button>
			{ children }
		</div>
	),
	TabPanel: ( { tabs, children } ) => <div>{ children( tabs[ 0 ] ) }</div>,
} ) );

describe( 'TabbedModal', () => {
	const mockOnClose = jest.fn();
	const mockTabs = [
		{
			name: 'tab1',
			title: 'First Tab',
			content: <div>Tab 1 Content</div>,
		},
		{
			name: 'tab2',
			title: 'Second Tab',
			content: <div>Tab 2 Content</div>,
		},
	];

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders nothing when closed', () => {
		const { container } = render(
			<TabbedModal isOpen={ false } onClose={ mockOnClose } title="Test" tabs={ mockTabs } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders with title when open', () => {
		render(
			<TabbedModal isOpen={ true } onClose={ mockOnClose } title="Test Title" tabs={ mockTabs } />
		);
		expect( screen.getByText( 'Test Title' ) ).toBeInTheDocument();
	} );

	it( 'calls onClose when close button is clicked', async () => {
		render(
			<TabbedModal isOpen={ true } onClose={ mockOnClose } title="Test" tabs={ mockTabs } />
		);
		await userEvent.click( screen.getByTestId( 'close-button' ) );
		expect( mockOnClose ).toHaveBeenCalled();
	} );

	it( 'applies custom className to modal', () => {
		render(
			<TabbedModal
				isOpen={ true }
				onClose={ mockOnClose }
				title="Test"
				tabs={ mockTabs }
				className="custom-class"
			/>
		);
		expect( screen.getByTestId( 'modal' ) ).toHaveClass( 'custom-class' );
	} );
} );
