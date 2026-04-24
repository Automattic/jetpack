/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, within } from '@testing-library/react';
import SortControlEdit from '../../../src/search-blocks/blocks/sort-control/edit';

// InspectorControls, PanelBody and the wrapper components from @wordpress
// own portal/slot machinery that doesn't wire up under jsdom. Replace them
// with pass-through render helpers so the checkbox / select / text controls
// the component drives land in the testing DOM.
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-jetpack-sort-control' } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

let controlIdCounter = 0;
const nextControlId = () => `mock-control-${ ++controlIdCounter }`;

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" aria-label={ title }>
			{ children }
		</section>
	),
	TextControl: ( { label, value, onChange } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="text"
					value={ value || '' }
					onChange={ event => onChange( event.target.value ) }
				/>
			</>
		);
	},
	SelectControl: ( { label, value, options, onChange } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<select id={ id } value={ value } onChange={ event => onChange( event.target.value ) }>
					{ options.map( option => (
						<option key={ option.value } value={ option.value }>
							{ option.label }
						</option>
					) ) }
				</select>
			</>
		);
	},
	CheckboxControl: ( { label, checked, onChange } ) => {
		const id = nextControlId();
		return (
			<>
				<input
					id={ id }
					type="checkbox"
					checked={ !! checked }
					onChange={ event => onChange( event.target.checked ) }
				/>
				<label htmlFor={ id }>{ label }</label>
			</>
		);
	},
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'SortControlEdit', () => {
	it( 'renders the dropdown preview with the default label and swaps to radios when displayAs=radio', () => {
		const { rerender } = render(
			<SortControlEdit attributes={ {} } setAttributes={ jest.fn() } />
		);
		expect( screen.getByRole( 'combobox', { name: 'Sort by' } ) ).toBeInTheDocument();

		rerender(
			<SortControlEdit
				attributes={ { displayAs: 'radio', defaultSort: 'newest' } }
				setAttributes={ jest.fn() }
			/>
		);
		const fieldset = screen.getByRole( 'group' );
		expect( within( fieldset ).getByRole( 'radio', { name: 'Newest' } ) ).toBeChecked();
	} );

	it( 'moves defaultSort onto the next available key when the author unchecks the current default', () => {
		// This is the subtle correctness case: without the sync, the saved
		// `defaultSort` would keep the stale value on disk while the
		// inspector's Default-sort select visually rebinds to another key.
		const onSetAttributes = jest.fn();
		render(
			<SortControlEdit
				attributes={ {
					defaultSort: 'newest',
					availableSortOptions: [ 'relevance', 'newest', 'oldest' ],
				} }
				setAttributes={ onSetAttributes }
			/>
		);
		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Newest' } ) );
		expect( onSetAttributes ).toHaveBeenCalledWith( {
			availableSortOptions: [ 'relevance', 'oldest' ],
			defaultSort: 'relevance',
		} );
	} );
} );
