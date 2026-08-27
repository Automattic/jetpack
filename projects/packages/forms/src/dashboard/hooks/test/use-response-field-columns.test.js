import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

/**
 * The answer columns each form has already offered, standing in for what the preferences
 * store holds. The hook only ever reads this, so driving it directly keeps these tests
 * about which columns get offered rather than about how the record is stored.
 */
const knownAnswerIdsByForm = new Map();

await jest.unstable_mockModule( '../../response-column-preferences.ts', () => ( {
	getColumnPreferenceKey: formId => `response-columns/${ formId ?? 'all' }`,
	readKnownAnswerIds: formId => knownAnswerIdsByForm.get( formId ) ?? null,
	writeKnownAnswerIds: ( formId, ids ) => knownAnswerIdsByForm.set( formId, ids ),
} ) );

const { default: useResponseFieldColumns } = await import( '../use-response-field-columns.ts' );

afterEach( () => knownAnswerIdsByForm.clear() );

const DEFAULT_FIELDS = [ 'date', 'source', 'ip' ];

/**
 * Records the answer columns a form had already offered when its view was last changed.
 *
 * @param {number|null} formId - The form the record belongs to.
 * @param {string[]}    ids    - The columns already offered.
 * @return {Map} The updated record map.
 */
const alreadyOffered = ( formId, ids ) => knownAnswerIdsByForm.set( formId, ids );

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
 * Renders the hook with a view whose state persists across rerenders, the way the view
 * `useView` hands back does.
 *
 * @param {object}   initial - Initial props (`formId`, `records`).
 * @param {string[]} fields  - The visible columns to start from, as `useView` resolved them.
 * @return {object} The hook result plus `view()` and `rerender()` helpers.
 */
const setup = ( initial, fields = DEFAULT_FIELDS ) => {
	let view = { titleField: 'from', fields: [ ...fields ] };
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
		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] }, [ 'ip' ] );

		expect( view().fields ).toEqual( [ 'field:1_Name', 'ip' ] );
	} );
} );

describe( 'useResponseFieldColumns, against a view that was restored', () => {
	it( 'leaves the restored columns alone rather than re-offering them', () => {
		// `useView` restores which columns are shown; the record says both answer columns
		// were already offered when that choice was made, so neither may be added back.
		alreadyOffered( 5, [ 'field:1_Name', 'field:2_Email' ] );

		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name', 'Email' ] ) ] }, [
			'date',
			'field:2_Email',
			'ip',
		] );

		// Name stays hidden and Source stays removed.
		expect( view().fields ).toEqual( [ 'date', 'field:2_Email', 'ip' ] );
	} );

	it( 'still shows a field added to the form since the choice was made', () => {
		alreadyOffered( 5, [ 'field:1_Name' ] );

		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name', 'Phone' ] ) ] }, [
			'date',
			'ip',
		] );

		// Name was on offer at the time and stays hidden. Phone was not, so it is
		// genuinely new and appears after Date.
		expect( view().fields ).toEqual( [ 'date', 'field:2_Phone', 'ip' ] );
	} );

	it( 'reads each form’s own record when switching between them', () => {
		alreadyOffered( 5, [ 'field:1_Name' ] );
		alreadyOffered( 30, [] );

		const { rerender, view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] }, [
			'date',
			'ip',
		] );

		// Form 5 had already offered Name, so it is not added back.
		expect( view().fields ).toEqual( [ 'date', 'ip' ] );

		// Form 30 has offered nothing, so its own field is new and appears.
		rerender( { formId: 30, records: [ response( 30, [ 'Reporter' ] ) ] } );

		expect( view().fields ).toEqual( [ 'date', 'field:1_Reporter', 'ip' ] );
	} );

	it( 'offers every column when the form has no record at all', () => {
		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] } );

		expect( view().fields ).toEqual( [ 'date', 'field:1_Name', 'source', 'ip' ] );
	} );

	it( 'does not add a column the restored view already names', () => {
		// A view can already name a column the hook is only now discovering — when it was
		// saved before the answer columns had loaded, so nothing was ever recorded as
		// offered. Adding it again would render the column twice.
		const { view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] }, [
			'date',
			'field:1_Name',
			'source',
			'ip',
		] );

		expect( view().fields ).toEqual( [ 'date', 'field:1_Name', 'source', 'ip' ] );
	} );

	it( 'leaves a column for a field the form no longer has, for the view to withhold', () => {
		// The hook cannot tell a deleted field from one whose responses are still loading,
		// so it keeps the id and `getResponseTableView` declines to render it.
		alreadyOffered( 5, [ 'field:1_Deleted' ] );

		const { result, view } = setup( { formId: 5, records: [ response( 5, [ 'Name' ] ) ] }, [
			'date',
			'field:1_Deleted',
			'source',
		] );

		// Name was never offered before, so it is new and appears; the deleted field's id
		// is kept, and only the rendered view drops it.
		expect( view().fields ).toEqual( [ 'date', 'field:1_Name', 'field:1_Deleted', 'source' ] );
		expect( result.current.map( column => column.id ) ).toEqual( [ 'field:1_Name' ] );
	} );

	it( 'works the same for responses that carry form field ids', () => {
		alreadyOffered( 5, [ 'field:g5-name', 'field:g5-email' ] );

		const identifiedResponse = ( formId, labels ) => ( {
			id: `${ formId }-id-${ labels.join( '-' ) }`,
			form_id: formId,
			fields: labels.map( ( label, index ) => ( {
				id: `g${ formId }-${ label.toLowerCase() }`,
				key: `${ index + 1 }_${ label }`,
				label,
				value: 'x',
				type: 'text',
			} ) ),
		} );

		const { result, view } = setup(
			{ formId: 5, records: [ identifiedResponse( 5, [ 'Name', 'Email' ] ) ] },
			[ 'date', 'field:g5-email', 'ip' ]
		);

		expect( result.current.map( column => column.id ) ).toEqual( [
			'field:g5-name',
			'field:g5-email',
		] );
		// Name stays hidden, and the discovered columns are keyed by field id throughout.
		expect( view().fields ).toEqual( [ 'date', 'field:g5-email', 'ip' ] );
	} );
} );
