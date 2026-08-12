import { fireEvent, render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import NoResultsSlotEdit from '../../../src/search-blocks/blocks/no-results/slot/edit';

jest.mock( '@wordpress/block-editor', () => {
	const mockInnerBlocks = jest.fn( () => <div data-testid="variant-inner-blocks" /> );
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
				const id = `condition-${ option.value }`;
				return (
					<label key={ option.value } htmlFor={ id }>
						<input
							id={ id }
							type="radio"
							name="condition"
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
const ERROR_DEFAULT = 'Something went wrong. Please try again.';

describe( 'NoResultsSlotEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		mockInnerBlockCount = 0;
	} );

	// The canvas preview mirrors render.php's fallback, so an author can see
	// what a visitor gets from a variant they haven't filled in yet.
	it( 'previews the filter-aware pair for an empty unscoped variant', () => {
		render( <NoResultsSlotEdit attributes={ {} } setAttributes={ jest.fn() } clientId="v-1" /> );

		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	it( 'narrows the preview to the matching message for a scoped variant', () => {
		const { unmount } = render(
			<NoResultsSlotEdit
				attributes={ { condition: 'filtered' } }
				setAttributes={ jest.fn() }
				clientId="v-1"
			/>
		);
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
		unmount();

		render(
			<NoResultsSlotEdit
				attributes={ { condition: 'error' } }
				setAttributes={ jest.fn() }
				clientId="v-1"
			/>
		);
		expect( screen.getByText( ERROR_DEFAULT ) ).toBeInTheDocument();
		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
	} );

	// Authored content is what renders, so the preview has to get out of the
	// way — otherwise the canvas shows copy no visitor will ever see.
	it( 'drops the preview once the variant has inner blocks', () => {
		mockInnerBlockCount = 1;
		render( <NoResultsSlotEdit attributes={ {} } setAttributes={ jest.fn() } clientId="v-1" /> );

		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
	} );

	it( 'updates the condition attribute from the Display when control', () => {
		const setAttributes = jest.fn();
		render(
			<NoResultsSlotEdit attributes={ {} } setAttributes={ setAttributes } clientId="v-1" />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package.
		fireEvent.click( screen.getByRole( 'radio', { name: 'Search failed' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { condition: 'error' } );
	} );

	it( 'falls back to the unscoped condition for an unknown saved value', () => {
		render(
			<NoResultsSlotEdit
				attributes={ { condition: 'bogus' } }
				setAttributes={ jest.fn() }
				clientId="v-1"
			/>
		);

		expect( screen.getByRole( 'radio', { name: 'Any empty search' } ) ).toBeChecked();
		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	// Several variants in one container look identical on the canvas without
	// this, so the label carries the condition.
	it( 'labels the variant with its condition on the canvas', () => {
		render(
			<NoResultsSlotEdit
				attributes={ { condition: 'filtered' } }
				setAttributes={ jest.fn() }
				clientId="v-1"
			/>
		);

		expect( screen.getAllByText( 'Filters are active' ).length ).toBeGreaterThan( 0 );
	} );
} );
