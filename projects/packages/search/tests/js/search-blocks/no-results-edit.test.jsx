import { fireEvent, render, screen } from '@testing-library/react';
import { InnerBlocks, store as blockEditorStore } from '@wordpress/block-editor';
import NoResultsEdit from '../../../src/search-blocks/blocks/no-results/edit';

const mockSelectedStores = [];

jest.mock( '@wordpress/block-editor', () => {
	const mockInnerBlocks = jest.fn( () => <div data-testid="no-results-inner-blocks" /> );
	mockInnerBlocks.ButtonBlockAppender = () => null;
	return {
		store: { name: 'core/block-editor' },
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
	useSelect: callback =>
		callback( store => {
			mockSelectedStores.push( store );
			return { getBlocks: () => mockSlots };
		} ),
	useDispatch: () => ( { insertBlock: mockInsertBlock } ),
} ) );

const CONDITIONS = [ 'any', 'filtered', 'error' ];
const LABELS = {
	any: 'Any empty search',
	filtered: 'Filters are active',
	error: 'Search failed',
};

describe( 'NoResultsEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		mockInsertBlock.mockClear();
		mockSlots = [];
	} );

	// Every condition is created up front so an author sees all three empty
	// states without adding anything.
	// Selecting by store object rather than the 'core/block-editor' string
	// keeps the dependency explicit and survives a store rename.
	it( 'selects state through the block-editor store object', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( mockSelectedStores ).toContain( blockEditorStore );
	} );

	it( 'seeds a variant for each condition', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toEqual( [
			[ 'jetpack-search/no-results-slot', { condition: 'any' } ],
			[ 'jetpack-search/no-results-slot', { condition: 'filtered' } ],
			[ 'jetpack-search/no-results-slot', { condition: 'error' } ],
		] );
	} );

	it( 'offers a button to bring back a condition that was removed', () => {
		mockSlots = [ { attributes: { condition: 'any' } } ];
		render( <NoResultsEdit clientId="nr-1" /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Filters are active' } ) );
		expect( mockInsertBlock ).toHaveBeenCalledWith(
			{ name: 'jetpack-search/no-results-slot', attributes: { condition: 'filtered' } },
			1,
			'nr-1'
		);
	} );

	it( 'offers nothing to add while every condition is covered', () => {
		mockSlots = CONDITIONS.map( condition => ( { attributes: { condition } } ) );
		render( <NoResultsEdit clientId="nr-1" /> );

		CONDITIONS.forEach( condition => {
			expect(
				screen.queryByRole( 'button', { name: LABELS[ condition ] } )
			).not.toBeInTheDocument();
		} );
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

	// A variant with no attribute — or an unrecognized one — still renders as
	// the unscoped condition, so the panel must read it as taken. Offering the
	// button again would stack a duplicate `any` variant.
	it.each( [
		[ 'no saved condition', {} ],
		[ 'an unknown condition', { condition: 'bogus' } ],
	] )( 'treats a variant with %s as the unscoped one', ( _label, attributes ) => {
		mockSlots = [ { attributes } ];
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( screen.queryByRole( 'button', { name: 'Any empty search' } ) ).not.toBeInTheDocument();
	} );

	// Three dashed rows read as three unrelated things without an outline and a
	// name around them.
	it( 'labels the container so the messages read as one block', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( screen.getByText( 'No Results' ) ).toBeInTheDocument();
	} );

	it( 'restricts inner blocks to variants and suppresses the default appender', () => {
		render( <NoResultsEdit clientId="nr-1" /> );

		expect( InnerBlocks ).toHaveBeenCalled();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.allowedBlocks ).toEqual( [ 'jetpack-search/no-results-slot' ] );
		expect( props.renderAppender ).toBe( false );
	} );
} );
