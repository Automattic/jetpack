import { describe, expect, it } from '@jest/globals';
import {
	getFieldLink,
	getFrozenColumnsClassName,
	getResponseTableView,
	keepColumnChoice,
	getResponseField,
	getResponseFieldColumns,
	getResponseFieldValue,
	mergeResponseFieldColumns,
} from '../response-field-columns.tsx';

const collectionResponse = fields => ( { id: 1, fields } );

describe( 'getResponseFieldColumns', () => {
	it( 'derives one column per field, keyed by the field key', () => {
		const columns = getResponseFieldColumns( [
			collectionResponse( [
				{ key: '1_Name', label: 'Name', value: 'Ada', type: 'name' },
				{ key: '2_Email', label: 'Email', value: 'ada@example.com', type: 'email' },
			] ),
		] );

		expect( columns ).toEqual( [
			{ id: 'field:1_Name', key: '1_Name', label: 'Name', type: 'name' },
			{ id: 'field:2_Email', key: '2_Email', label: 'Email', type: 'email' },
		] );
	} );

	it( 'unions fields across responses, so a field only some responses carry still gets a column', () => {
		const columns = getResponseFieldColumns( [
			collectionResponse( [ { key: '1_Name', label: 'Name', value: 'Ada' } ] ),
			collectionResponse( [
				{ key: '1_Name', label: 'Name', value: 'Grace' },
				{ key: '2_Phone', label: 'Phone', value: '555' },
			] ),
		] );

		expect( columns.map( column => column.key ) ).toEqual( [ '1_Name', '2_Phone' ] );
	} );

	it( 'infers a type from the label for legacy responses that carry none', () => {
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Rating', value: '4/5' } ] ),
		] );

		expect( column.type ).toBe( 'rating' );
	} );

	it( 'falls back to text when the label matches no known field type', () => {
		// `inferFieldTypeFromLabel` matches on a label *prefix*, so a renamed field
		// ("Please rate our website") is not recognized and its column renders as
		// text. The response inspector behaves the same way, which is the point.
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Please rate our website', value: '4/5' } ] ),
		] );

		expect( column.type ).toBe( 'text' );
	} );

	it( 'keeps an explicit field type over the label guess', () => {
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Name', value: 'x', type: 'rating' } ] ),
		] );

		expect( column.type ).toBe( 'rating' );
	} );

	it( 'decodes entities in the column label', () => {
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Tom &amp; Jerry', value: 'x' } ] ),
		] );

		expect( column.label ).toBe( 'Tom & Jerry' );
	} );

	it( 'reads the legacy label-value shape, keying columns by label', () => {
		const columns = getResponseFieldColumns( [
			{ id: 1, fields: { Name: 'Ada', Message: 'Hello' } },
		] );

		// The legacy shape carries no type, so it is inferred from the label the way
		// the response inspector does.
		expect( columns ).toEqual( [
			{ id: 'field:Name', key: 'Name', label: 'Name', type: 'name' },
			{ id: 'field:Message', key: 'Message', label: 'Message', type: 'textarea' },
		] );
	} );

	it( 'returns nothing for responses without fields', () => {
		expect( getResponseFieldColumns( [ { id: 1 }, { id: 2, fields: [] } ] ) ).toEqual( [] );
		expect( getResponseFieldColumns( undefined ) ).toEqual( [] );
	} );
} );

describe( 'getResponseFieldValue', () => {
	const valueOf = ( value, key = 'k' ) =>
		getResponseFieldValue( collectionResponse( [ { key, label: 'L', value } ] ), key );

	it( 'renders a plain string', () => {
		expect( valueOf( 'Social Media' ) ).toBe( 'Social Media' );
	} );

	it( 'joins a multiple-choice array', () => {
		expect( valueOf( [ 'Keynote', 'Workshop', 'Panel' ] ) ).toBe( 'Keynote, Workshop, Panel' );
	} );

	it( 'names a single uploaded file and counts several', () => {
		expect( valueOf( { files: [ { name: 'proposal.pdf' } ] } ) ).toBe( 'proposal.pdf' );
		expect( valueOf( { files: [ { name: 'a.pdf' }, { name: 'b.pdf' } ] } ) ).toBe( '2 files' );
		expect( valueOf( { files: [] } ) ).toBe( '' );
	} );

	it( 'lists the chosen image-select options', () => {
		expect(
			valueOf( {
				type: 'image-select',
				choices: [ { selected: 'Riverside Hall' }, { selected: 'b', label: 'Garden Room' } ],
			} )
		).toBe( 'Riverside Hall, Garden Room' );
	} );

	it( 'decodes entities in the value', () => {
		expect( valueOf( 'Tom &amp; Jerry' ) ).toBe( 'Tom & Jerry' );
	} );

	it( 'renders an empty string for missing, empty and unrecognized values', () => {
		expect( valueOf( null ) ).toBe( '' );
		expect( valueOf( undefined ) ).toBe( '' );
		expect( valueOf( '   ' ) ).toBe( '' );
		expect( valueOf( { unexpected: true } ) ).toBe( '' );
		expect( getResponseFieldValue( collectionResponse( [] ), 'missing' ) ).toBe( '' );
	} );

	it( 'renders a rating as submitted', () => {
		expect( valueOf( '4/5' ) ).toBe( '4/5' );
	} );
} );

const DESKTOP_VIEW = { titleField: 'from', fields: [ 'date', 'field:1_Name', 'ip' ] };
const COLUMNS = [ { id: 'field:1_Name', key: '1_Name', label: 'Name', type: 'text' } ];

describe( 'getResponseTableView', () => {
	it( 'hands DataViews the view untouched on a wide screen', () => {
		expect( getResponseTableView( DESKTOP_VIEW, false ) ).toBe( DESKTOP_VIEW );
	} );

	it( 'drops every column but the title and actions on a narrow screen', () => {
		const view = getResponseTableView( DESKTOP_VIEW, true );

		expect( view.fields ).toEqual( [] );
		// The title column is DataViews' own, so it survives; the caller's view is
		// left alone so widening the window restores the columns.
		expect( view.titleField ).toBe( 'from' );
		expect( DESKTOP_VIEW.fields ).toEqual( [ 'date', 'field:1_Name', 'ip' ] );
	} );
} );

describe( 'keepColumnChoice', () => {
	it( 'persists what DataViews reports on a wide screen', () => {
		const incoming = { ...DESKTOP_VIEW, sort: { field: 'date', direction: 'asc' } };

		expect( keepColumnChoice( incoming, DESKTOP_VIEW, false ) ).toBe( incoming );
	} );

	it( 'keeps the real columns when a narrow screen reports a change', () => {
		// Sorting on a phone must not write the collapsed column set back over the
		// columns the user chose on a wide screen.
		const incoming = { ...DESKTOP_VIEW, fields: [], sort: { field: 'date' } };
		const kept = keepColumnChoice( incoming, DESKTOP_VIEW, true );

		expect( kept.fields ).toEqual( [ 'date', 'field:1_Name', 'ip' ] );
		expect( kept.sort ).toEqual( { field: 'date' } );
	} );
} );

describe( 'getFrozenColumnsClassName', () => {
	it( 'freezes the leading columns once there are answers to scroll past', () => {
		expect( getFrozenColumnsClassName( COLUMNS, DESKTOP_VIEW, false ) ).toBe( 'has-field-columns' );
	} );

	it( 'does not freeze when there are no answer columns', () => {
		expect( getFrozenColumnsClassName( [], DESKTOP_VIEW, false ) ).toBeUndefined();
	} );

	it( 'does not freeze on a narrow screen, where nothing scrolls sideways', () => {
		expect( getFrozenColumnsClassName( COLUMNS, DESKTOP_VIEW, true ) ).toBeUndefined();
	} );

	it( 'does not freeze when the title column is hidden', () => {
		// The stylesheet freezes the checkbox column's next sibling. Without a title
		// column that is an answer column, which must not be frozen in its place.
		expect(
			getFrozenColumnsClassName( COLUMNS, { ...DESKTOP_VIEW, showTitle: false }, false )
		).toBeUndefined();
		expect(
			getFrozenColumnsClassName( COLUMNS, { ...DESKTOP_VIEW, titleField: undefined }, false )
		).toBeUndefined();
	} );
} );

describe( 'getFieldLink', () => {
	it( 'opens an address in a mail client', () => {
		expect( getFieldLink( 'email', 'ada@example.com' ) ).toEqual( {
			href: 'mailto:ada@example.com',
			openInNewTab: false,
		} );
	} );

	it( 'dials a phone number, without the spaces it is displayed with', () => {
		expect( getFieldLink( 'telephone', '+1 415 555 0101' ) ).toEqual( {
			href: 'tel:+14155550101',
			openInNewTab: false,
		} );
		expect( getFieldLink( 'phone', '555 0101' ).href ).toBe( 'tel:5550101' );
	} );

	it( 'opens a web address in a new tab', () => {
		expect( getFieldLink( 'url', 'https://example.com/a-page' ) ).toEqual( {
			href: 'https://example.com/a-page',
			openInNewTab: true,
		} );
		expect( getFieldLink( 'url', 'http://example.com' ).openInNewTab ).toBe( true );
	} );

	it( 'leaves a value that does not look like its type as plain text', () => {
		// The response inspector applies the same two guards, so the table matches it.
		expect( getFieldLink( 'email', 'not an address' ) ).toBeNull();
		expect( getFieldLink( 'url', 'example.com' ) ).toBeNull();
		expect( getFieldLink( 'url', 'javascript:alert(1)' ) ).toBeNull();
	} );

	it( 'leaves every other field type as plain text', () => {
		expect( getFieldLink( 'text', 'https://example.com' ) ).toBeNull();
		expect( getFieldLink( 'textarea', 'ada@example.com' ) ).toBeNull();
		expect( getFieldLink( 'select', 'Newsletter' ) ).toBeNull();
	} );
} );

describe( 'getResponseField', () => {
	it( 'returns the field so a caller can read its raw value, not just the text', () => {
		const response = collectionResponse( [
			{ key: 'k', label: 'Sessions', value: [ 'Keynote', 'Panel' ], type: 'checkbox-multiple' },
		] );

		expect( getResponseField( response, 'k' ).value ).toEqual( [ 'Keynote', 'Panel' ] );
		expect( getResponseField( response, 'missing' ) ).toBeUndefined();
	} );
} );

describe( 'mergeResponseFieldColumns', () => {
	const a = { id: 'field:a', key: 'a', label: 'A', type: 'text' };
	const b = { id: 'field:b', key: 'b', label: 'B', type: 'text' };

	it( 'appends columns that are new', () => {
		expect( mergeResponseFieldColumns( [ a ], [ a, b ] ) ).toEqual( [ a, b ] );
	} );

	it( 'keeps the same reference when nothing is new, so the view does not churn', () => {
		const previous = [ a, b ];
		expect( mergeResponseFieldColumns( previous, [ a ] ) ).toBe( previous );
	} );

	it( 'keeps columns that the current page no longer carries', () => {
		expect( mergeResponseFieldColumns( [ a, b ], [] ) ).toEqual( [ a, b ] );
	} );
} );
