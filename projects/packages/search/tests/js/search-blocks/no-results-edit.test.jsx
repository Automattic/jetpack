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
	RadioControl: ( { label, selected, options, onChange } ) => (
		<fieldset aria-label={ label }>
			{ options.map( option => {
				const id = `filter-state-${ option.value }`;
				return (
					<label key={ option.value } htmlFor={ id }>
						<input
							id={ id }
							type="radio"
							name="filterState"
							value={ option.value }
							checked={ selected === option.value }
							onChange={ () => onChange( option.value ) }
						/>
						{ option.label }
					</label>
				);
			} ) }
		</fieldset>
	),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

let mockInnerBlockCount = 0;
jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => ( { getBlockCount: () => mockInnerBlockCount } ) ),
} ) );

const UNFILTERED_DEFAULT = 'No results found. Try a different search.';
const FILTERED_DEFAULT =
	'No results match these filters. Try clearing some, or searching for something else.';

describe( 'NoResultsEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		mockInnerBlockCount = 0;
	} );

	// The block carries no InnerBlocks template on purpose: an auto-inserted
	// placeholder paragraph would serialize as an empty `<p>` and displace the
	// localized fallback render.php emits for an untouched block.
	it( 'renders InnerBlocks with no template so an untouched block stays empty', () => {
		render( <NoResultsEdit attributes={ {} } setAttributes={ jest.fn() } clientId="nr-1" /> );

		expect( screen.getByTestId( 'no-results-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toBeUndefined();
		expect( props.renderAppender ).toBe( InnerBlocks.ButtonBlockAppender );
	} );

	it( 'previews both default messages while the block is empty', () => {
		render( <NoResultsEdit attributes={ {} } setAttributes={ jest.fn() } clientId="nr-1" /> );

		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	it( 'narrows the preview to the message matching the chosen filter state', () => {
		render(
			<NoResultsEdit
				attributes={ { filterState: 'filtered' } }
				setAttributes={ jest.fn() }
				clientId="nr-1"
			/>
		);

		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
	} );

	it( 'drops the default preview once the author adds content', () => {
		mockInnerBlockCount = 1;
		render( <NoResultsEdit attributes={ {} } setAttributes={ jest.fn() } clientId="nr-1" /> );

		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'no-results-inner-blocks' ) ).toBeInTheDocument();
	} );

	it( 'updates the filterState attribute from the Display when control', () => {
		const setAttributes = jest.fn();
		render( <NoResultsEdit attributes={ {} } setAttributes={ setAttributes } clientId="nr-1" /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package; the sibling block tests use fireEvent for the same reason.
		fireEvent.click( screen.getByRole( 'radio', { name: 'Filters are active' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { filterState: 'filtered' } );
	} );

	// A hand-edited or future-version attribute must not leave the canvas
	// blank; the unscoped state is the safe read.
	it( 'falls back to the unscoped state for an unknown filterState', () => {
		render(
			<NoResultsEdit
				attributes={ { filterState: 'bogus' } }
				setAttributes={ jest.fn() }
				clientId="nr-1"
			/>
		);

		expect( screen.getByRole( 'radio', { name: 'Any empty search' } ) ).toBeChecked();
		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	// Two No Results blocks in one results region look identical on the
	// canvas without this, so the label carries the distinguishing state.
	it( 'labels the block with its filter state on the canvas', () => {
		render(
			<NoResultsEdit
				attributes={ { filterState: 'unfiltered' } }
				setAttributes={ jest.fn() }
				clientId="nr-1"
			/>
		);

		expect( screen.getByText( 'No Results — no filters active' ) ).toBeInTheDocument();
	} );
} );
