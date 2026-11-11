/* eslint-disable testing-library/prefer-user-event -- user-event is not a dependency of this package. */
import { fireEvent, render, screen } from '@testing-library/react';
import SelectionBanner from '../_inc/subscribers/components/selection-banner';

const baseProps = {
	pageCount: 20,
	selectedCount: 20,
	matchingCount: 15000,
	totalPages: 750,
	narrowed: false,
	isAllSelected: false,
	disabled: false,
	onSelectAll: jest.fn(),
	onRemovePage: jest.fn(),
	onRemoveAll: jest.fn(),
	onClear: jest.fn(),
};

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'SelectionBanner', () => {
	it( 'shows nothing until the whole page is selected', () => {
		const { container } = render( <SelectionBanner { ...baseProps } selectedCount={ 19 } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'offers to select everyone once the page is selected', () => {
		render( <SelectionBanner { ...baseProps } /> );

		expect(
			screen.getByText( 'All 20 subscribers on this page are selected.' )
		).toBeInTheDocument();
		fireEvent.click( screen.getByRole( 'button', { name: 'Select all 15,000 subscribers' } ) );
		expect( baseProps.onSelectAll ).toHaveBeenCalled();

		fireEvent.click( screen.getByRole( 'button', { name: 'Remove these 20' } ) );
		expect( baseProps.onRemovePage ).toHaveBeenCalled();
	} );

	it( 'says "matching" when a search or filter is on', () => {
		render( <SelectionBanner { ...baseProps } narrowed matchingCount={ 1200 } /> );

		expect(
			screen.getByRole( 'button', { name: 'Select all 1,200 matching subscribers' } )
		).toBeInTheDocument();
	} );

	it( 'removes everyone once everyone is selected', () => {
		render( <SelectionBanner { ...baseProps } isAllSelected /> );

		expect(
			screen.getByText( 'All 15,000 subscribers are selected, across all 750 pages.' )
		).toBeInTheDocument();
		fireEvent.click( screen.getByRole( 'button', { name: 'Remove 15,000 subscribers' } ) );
		expect( baseProps.onRemoveAll ).toHaveBeenCalled();

		fireEvent.click( screen.getByRole( 'button', { name: 'Clear selection' } ) );
		expect( baseProps.onClear ).toHaveBeenCalled();
	} );

	it( 'moves focus to the select-all checkbox when the selection is cleared', () => {
		render(
			<div className="dataviews-wrapper">
				<table>
					<thead>
						<tr>
							<th className="dataviews-view-table__checkbox-column">
								<span role="checkbox" aria-checked="true" tabIndex={ 0 } />
							</th>
						</tr>
					</thead>
				</table>
				<SelectionBanner { ...baseProps } isAllSelected />
			</div>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Clear selection' } ) );

		expect( baseProps.onClear ).toHaveBeenCalled();
		expect( screen.getByRole( 'checkbox' ) ).toHaveFocus();
	} );

	it( 'skips "select all" when everyone already fits on the page', () => {
		render(
			<SelectionBanner { ...baseProps } pageCount={ 8 } selectedCount={ 8 } matchingCount={ 8 } />
		);

		expect( screen.getByText( 'All 8 subscribers are selected.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Select all/ } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Remove 8 subscribers' } ) ).toBeInTheDocument();
	} );

	it( 'disables removal while a removal runs', () => {
		render( <SelectionBanner { ...baseProps } isAllSelected disabled /> );

		// @wordpress/ui keeps a disabled button focusable, so it is aria-disabled rather than disabled.
		const button = screen.getByRole( 'button', { name: 'Remove 15,000 subscribers' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		fireEvent.click( button );
		expect( baseProps.onRemoveAll ).not.toHaveBeenCalled();
	} );
} );
