import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { writeColumnPreference } from '../../response-column-preferences.ts';
import useResponseFieldColumns from '../use-response-field-columns.ts';

afterEach( () => window.localStorage.clear() );

const DEFAULT_FIELDS = [ 'date', 'source', 'ip' ];

/**
 * Builds a response carrying the given fields, tied to a form.
 *
 * @param {number}   formId - The jetpack_form post the response belongs to.
 * @param {string[]} labels - One field per label, keyed `<n>_<label>`.
 * @return {object} A form response.
 */
const response = ( formId, labels ) => ( {
	id: `${ formId }-${ labels.join( '-' ) }`,
	form_id: formId,
	fields: labels.map( ( label, index ) => ( {
		key: `${ index + 1 }_${ label }`,
		label,
		value: 'x',
		type: 'text',
	} ) ),
} );

/**
 * Renders the hook with a view whose state persists across rerenders, the way a
 * real `useState` view does.
 *
 * @param {object} initial - Initial props (`formId`, `records`).
 * @return {object} The hook result plus `view()` and `rerender()` helpers.
 */
const setup = initial => {
	let view = { titleField: 'from', fields: [ ...DEFAULT_FIELDS ] };
	const setView = jest.fn( updater => {
		view = typeof updater === 'function' ? updater( view ) : updater;
	} );

	const utils = renderHook( props => useResponseFieldColumns( { ...props, setView } ), {
		initialProps: initial,
	} );

	return { ...utils, setView, view: () => view };
};

describe( 'useResponseFieldColumns', () => {
	it( 'returns no columns and leaves the view alone when no form is in scope', () => {
		const { result, setView, view } = setup( {
			formId: null,
			records: [ response( 5, [ 'Name', 'Email' ] ) ],
		} );

		expect( result.current ).toEqual( [] );
		expect( setView ).not.toHaveBeenCalled();
		expect( view().fields ).toEqual( DEFAULT_FIELDS );
	} );

	it( 'discovers a column per field and shows it right after Date', () => {
		const { result, view } = setup( {
			formId: 5,
			records: [ response( 5, [ 'Name', 'Email' ] ) ],
		} );

		expect( result.current.map( column => column.label ) ).toEqual( [ 'Name', 'Email' ] );
		expect( view().fields ).toEqual( [ 'date', 'field:1_Name', 'field:2_Email', 'source', 'ip' ] );
	} );

	it( 'keeps later batches together with the columns already shown', () => {
		const { rerender, view } = setup( {
			formId: 5,
			records: [ response( 5, [ 'Name' ] ) ],
		} );

		rerender( { formId: 5, records: [ response( 5, [ 'Name', 'Email' ] ) ] } );

		// 'Email' lands after 'Name', not back at the front.
		expect( view().fields ).toEqual( [ 'date', 'field:1_Name', 'field:2_Email', 'source', 'ip' ] );
	} );

	it( 'does not bring back a column the user has hidden', () => {
		const { rerender, view, setView } = setup( {
			formId: 5,
			records: [ response( 5, [ 'Name', 'Email' ] ) ],
		} );

		// The user hides Email through the DataViews properties panel.
		setView( previous => ( {
			...previous,
			fields: previous.fields.filter( id => id !== 'field:2_Email' ),
		} ) );

		rerender( { formId: 5, records: [ response( 5, [ 'Name', 'Email' ] ) ] } );

		expect( view().fields ).not.toContain( 'field:2_Email' );
	} );

	it( 'drops the previous form’s columns when the form changes', () => {
		const { rerender, result, view } = setup( {
			formId: 5,
			records: [ response( 5, [ 'Name', 'Email' ] ) ],
		} );

		rerender( { formId: 30, records: [ response( 30, [ 'Reporter' ] ) ] } );

		expect( result.current.map( column => column.label ) ).toEqual( [ 'Reporter' ] );
		expect( view().fields ).toEqual( [ 'date', 'field:1_Reporter', 'source', 'ip' ] );
	} );

	it( 'ignores responses belonging to a form that is no longer in scope', () => {
		const { rerender, result, view } = setup( {
			formId: 5,
			records: [ response( 5, [ 'Name', 'Email' ] ) ],
		} );

		// Switching forms re-runs the effect one render before the new responses land,
		// so `records` still holds the outgoing form's. Its fields must not come back.
		rerender( { formId: 30, records: [ response( 5, [ 'Name', 'Email' ] ) ] } );

		expect( result.current ).toEqual( [] );
		expect( view().fields ).toEqual( DEFAULT_FIELDS );

		// ...and the new form's own responses still populate once they arrive.
		rerender( { formId: 30, records: [ response( 30, [ 'Reporter' ] ) ] } );

		expect( view().fields ).toEqual( [ 'date', 'field:1_Reporter', 'source', 'ip' ] );
	} );

	it( 'keeps a column whose field is missing from the responses now loaded', () => {
		const { rerender, result } = setup( {
			formId: 5,
			records: [ response( 5, [ 'Name', 'Email' ] ) ],
		} );

		// Page two happens to carry only one of the two fields.
		rerender( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] } );

		expect( result.current.map( column => column.label ) ).toEqual( [ 'Name', 'Email' ] );
	} );

	it( 'shows answers first when Date is not among the visible columns', () => {
		let view = { titleField: 'from', fields: [ 'ip' ] };
		const setView = jest.fn( updater => {
			view = typeof updater === 'function' ? updater( view ) : updater;
		} );

		renderHook( () =>
			useResponseFieldColumns( {
				formId: 5,
				records: [ response( 5, [ 'Name' ] ) ],
				setView,
			} )
		);

		expect( view.fields ).toEqual( [ 'field:1_Name', 'ip' ] );
	} );
} );

describe( 'useResponseFieldColumns, restoring a saved choice', () => {
	it( 'starts from the columns the user last chose on this form', () => {
		writeColumnPreference( 5, {
			fields: [ 'date', 'field:2_Email', 'ip' ],
			knownAnswerIds: [ 'field:1_Name', 'field:2_Email' ],
		} );

		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name', 'Email' ] ) ] } );

		// Name was hidden and Source removed; both stay that way, and neither column is
		// re-offered just because the responses carrying them loaded again.
		expect( view().fields ).toEqual( [ 'date', 'field:2_Email', 'ip' ] );
	} );

	it( 'still shows a field added to the form since the choice was saved', () => {
		writeColumnPreference( 5, {
			fields: [ 'date', 'ip' ],
			knownAnswerIds: [ 'field:1_Name' ],
		} );

		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name', 'Phone' ] ) ] } );

		// Name was on offer when the choice was saved and stays hidden. Phone was not, so
		// it is genuinely new and appears after Date.
		expect( view().fields ).toEqual( [ 'date', 'field:2_Phone', 'ip' ] );
	} );

	it( 'restores each form its own choice when switching between them', () => {
		writeColumnPreference( 5, { fields: [ 'date', 'ip' ], knownAnswerIds: [ 'field:1_Name' ] } );
		writeColumnPreference( 30, {
			fields: [ 'field:1_Reporter', 'date' ],
			knownAnswerIds: [ 'field:1_Reporter' ],
		} );

		const { rerender, view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] } );

		expect( view().fields ).toEqual( [ 'date', 'ip' ] );

		rerender( { formId: 30, records: [ response( 30, [ 'Reporter' ] ) ] } );

		expect( view().fields ).toEqual( [ 'field:1_Reporter', 'date' ] );
	} );

	it( 'restores the every-form view too, which has no answer columns of its own', () => {
		writeColumnPreference( null, { fields: [ 'date', 'read_status' ], knownAnswerIds: [] } );

		const { result, view } = setup( { formId: null, records: [ response( 5, [ 'Name' ] ) ] } );

		expect( result.current ).toEqual( [] );
		expect( view().fields ).toEqual( [ 'date', 'read_status' ] );
	} );

	it( 'falls back to the default columns when nothing was ever saved', () => {
		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] } );

		expect( view().fields ).toEqual( [ 'date', 'field:1_Name', 'source', 'ip' ] );
	} );
} );
