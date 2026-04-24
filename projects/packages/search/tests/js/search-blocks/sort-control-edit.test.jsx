// The search package doesn't ship `@testing-library/user-event`, so
// these tests stay on the synchronous `fireEvent` helpers — adequate for
// a block editor component whose reactions fire synchronously against
// the mocked WordPress controls.
/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, within } from '@testing-library/react';
import SortControlEdit from '../../../src/search-blocks/blocks/sort-control/edit';

// InspectorControls, PanelBody and the wrapper components from @wordpress
// own portal/slot machinery that doesn't wire up under jsdom. Replace them
// with pass-through render helpers so their children — the controls the
// component actually drives — land in the testing DOM.
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
	TextControl: ( { label, value, placeholder, onChange } ) => {
		const id = nextControlId();
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="text"
					value={ value || '' }
					placeholder={ placeholder }
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
	it( 'renders the select preview with the default label when no attributes are saved', () => {
		render( <SortControlEdit attributes={ {} } setAttributes={ jest.fn() } /> );
		expect( screen.getAllByText( 'Sort by' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByRole( 'combobox', { name: 'Sort by' } ) ).toBeInTheDocument();
	} );

	it( 'swaps to a radio group when displayAs is radio and marks the default as checked', () => {
		render(
			<SortControlEdit
				attributes={ {
					displayAs: 'radio',
					defaultSort: 'newest',
					availableSortOptions: [ 'relevance', 'newest', 'oldest' ],
				} }
				setAttributes={ jest.fn() }
			/>
		);
		const fieldset = screen.getByRole( 'group' );
		expect( within( fieldset ).getAllByRole( 'radio' ) ).toHaveLength( 3 );
		expect( within( fieldset ).getByRole( 'radio', { name: 'Newest' } ) ).toBeChecked();
	} );

	it( 'filters the preview to only keys present in availableSortOptions', () => {
		render(
			<SortControlEdit
				attributes={ { availableSortOptions: [ 'relevance', 'rating_desc' ] } }
				setAttributes={ jest.fn() }
			/>
		);
		const select = screen.getByRole( 'combobox', { name: 'Sort by' } );
		const values = within( select )
			.getAllByRole( 'option' )
			.map( option => option.value );
		expect( values ).toEqual( [ 'relevance', 'rating_desc' ] );
	} );

	it( 'moves defaultSort onto the next available key when the author unchecks the current default', () => {
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

	it( 'leaves defaultSort alone when the author unchecks a non-default key', () => {
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
		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Oldest' } ) );
		expect( onSetAttributes ).toHaveBeenCalledWith( {
			availableSortOptions: [ 'relevance', 'newest' ],
		} );
	} );

	it( 're-adds a key in canonical order when the author re-checks it', () => {
		const onSetAttributes = jest.fn();
		render(
			<SortControlEdit
				attributes={ { availableSortOptions: [ 'relevance', 'oldest' ] } }
				setAttributes={ onSetAttributes }
			/>
		);
		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Newest' } ) );
		expect( onSetAttributes ).toHaveBeenCalledWith( {
			availableSortOptions: [ 'relevance', 'newest', 'oldest' ],
		} );
	} );

	it( 'offers only enabled keys as choices in the Default sort select', () => {
		render(
			<SortControlEdit
				attributes={ { availableSortOptions: [ 'relevance', 'price_asc' ] } }
				setAttributes={ jest.fn() }
			/>
		);
		const select = screen.getByRole( 'combobox', { name: 'Default sort' } );
		const values = within( select )
			.getAllByRole( 'option' )
			.map( option => option.value );
		expect( values ).toEqual( [ 'relevance', 'price_asc' ] );
	} );

	it( 'uses the author-supplied label verbatim in the preview', () => {
		render( <SortControlEdit attributes={ { label: 'Order by' } } setAttributes={ jest.fn() } /> );
		expect( screen.getAllByText( 'Order by' ).length ).toBeGreaterThan( 0 );
	} );

	it( 'writes the label attribute when the author edits the text control', () => {
		const onSetAttributes = jest.fn();
		render( <SortControlEdit attributes={ {} } setAttributes={ onSetAttributes } /> );
		fireEvent.change( screen.getByRole( 'textbox', { name: 'Label' } ), {
			target: { value: 'Order results by' },
		} );
		expect( onSetAttributes ).toHaveBeenCalledWith( { label: 'Order results by' } );
	} );

	it( 'writes defaultSort when the author changes the Default sort select', () => {
		const onSetAttributes = jest.fn();
		render(
			<SortControlEdit
				attributes={ {
					defaultSort: 'relevance',
					availableSortOptions: [ 'relevance', 'newest' ],
				} }
				setAttributes={ onSetAttributes }
			/>
		);
		fireEvent.change( screen.getByRole( 'combobox', { name: 'Default sort' } ), {
			target: { value: 'newest' },
		} );
		expect( onSetAttributes ).toHaveBeenCalledWith( { defaultSort: 'newest' } );
	} );

	it( 'writes displayAs when the author flips to the radio variant', () => {
		const onSetAttributes = jest.fn();
		render( <SortControlEdit attributes={ {} } setAttributes={ onSetAttributes } /> );
		fireEvent.change( screen.getByRole( 'combobox', { name: 'Display as' } ), {
			target: { value: 'radio' },
		} );
		expect( onSetAttributes ).toHaveBeenCalledWith( { displayAs: 'radio' } );
	} );

	it( 'falls back to every canonical key when availableSortOptions is missing entirely', () => {
		render(
			<SortControlEdit
				attributes={ { displayAs: 'radio', defaultSort: 'relevance' } }
				setAttributes={ jest.fn() }
			/>
		);
		const fieldset = screen.getByRole( 'group' );
		const values = within( fieldset )
			.getAllByRole( 'radio' )
			.map( radio => radio.value );
		expect( values ).toEqual( [
			'relevance',
			'newest',
			'oldest',
			'rating_desc',
			'price_asc',
			'price_desc',
		] );
	} );
} );
