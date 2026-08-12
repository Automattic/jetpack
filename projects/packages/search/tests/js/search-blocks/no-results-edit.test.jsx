import { fireEvent, render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import NoResultsEdit from '../../../src/search-blocks/blocks/no-results/edit';

jest.mock( '@wordpress/block-editor', () => {
	const mockInnerBlocks = jest.fn( () => <div data-testid="no-results-inner-blocks" /> );
	mockInnerBlocks.ButtonBlockAppender = () => null;
	return {
		useBlockProps: props => ( { ...props, className: props?.className } ),
		InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
		InnerBlocks: mockInnerBlocks,
	};
} );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" aria-label={ title }>
			{ children }
		</section>
	),
	Button: ( { children, onClick } ) => (
		<button type="button" onClick={ onClick }>
			{ children }
		</button>
	),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( name, attributes ) => ( { name, attributes } ),
} ) );

let mockSlots = [];
const mockInsertBlock = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => ( { getBlocks: () => mockSlots } ) ),
	useDispatch: () => ( { insertBlock: mockInsertBlock } ),
} ) );

const UNFILTERED_DEFAULT = 'No results found. Try a different search.';
const FILTERED_DEFAULT =
	'No results match these filters. Try clearing some, or searching for something else.';

describe( 'NoResultsEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		mockInsertBlock.mockClear();
		mockSlots = [];
	} );

	// An empty container renders the filter-aware default pair, so the canvas
	// has to show the same thing rather than an empty box.
	it( 'previews the default pair while the container has no variants', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	it( 'drops the preview once a variant is added', () => {
		mockSlots = [ { attributes: { condition: 'any' } } ];
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
	} );

	it( 'offers a button per condition and inserts the matching variant', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Filters are active' } ) );
		expect( mockInsertBlock ).toHaveBeenCalledWith(
			{ name: 'jetpack-search/no-results-slot', attributes: { condition: 'filtered' } },
			0,
			'nr-1'
		);
	} );

	// The renderer would just stack a second variant for a condition that is
	// already covered, so the button for it has to disappear.
	it( 'hides the button for a condition a variant already covers', () => {
		mockSlots = [ { attributes: { condition: 'any' } }, { attributes: { condition: 'error' } } ];
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( screen.queryByRole( 'button', { name: 'Any empty search' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Search failed' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Filters are active' } ) ).toBeInTheDocument();
	} );

	it( 'appends new variants after the existing ones', () => {
		mockSlots = [ { attributes: { condition: 'any' } }, { attributes: { condition: 'filtered' } } ];
		render( <NoResultsEdit clientId="nr-1" /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- see above.
		fireEvent.click( screen.getByRole( 'button', { name: 'Search failed' } ) );
		expect( mockInsertBlock ).toHaveBeenCalledWith( expect.anything(), 2, 'nr-1' );
	} );

	// A variant missing its attribute still occupies the unscoped condition —
	// treating it as uncovered would offer a button that stacks a duplicate.
	it( 'treats a variant with no saved condition as the unscoped one', () => {
		mockSlots = [ { attributes: {} } ];
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( screen.queryByRole( 'button', { name: 'Any empty search' } ) ).not.toBeInTheDocument();
	} );

	it( 'restricts inner blocks to variants and suppresses the default appender', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( InnerBlocks ).toHaveBeenCalled();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.allowedBlocks ).toEqual( [ 'jetpack-search/no-results-slot' ] );
		expect( props.renderAppender ).toBe( false );
	} );
} );
